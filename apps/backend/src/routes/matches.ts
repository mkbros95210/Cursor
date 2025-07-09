import express from 'express';
import { Match } from '../models';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { socketManager } from '../services/socketService';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createPaginatedResponse,
  createMatchSchema,
  updateMatchSchema,
  matchResultSchema,
  matchFiltersSchema
} from '@sports-betting/shared';

const router = express.Router();

// Get all matches with filtering and pagination
router.get('/',
  validateQuery(matchFiltersSchema),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, sport, status, league, startDate, endDate, isFeatured } = req.query as any;

    // Build filter object
    const filter: any = { isActive: true };
    
    if (sport) filter.sport = sport;
    if (status) filter.status = status;
    if (league) filter.league = new RegExp(league, 'i');
    if (isFeatured !== undefined) filter.isFeatured = isFeatured;
    
    if (startDate || endDate) {
      filter.startTime = {};
      if (startDate) filter.startTime.$gte = new Date(startDate);
      if (endDate) filter.startTime.$lte = new Date(endDate);
    }

    // Execute query with pagination
    const matches = await Match.find(filter)
      .sort({ startTime: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Match.countDocuments(filter);

    res.json(createPaginatedResponse(matches, page, limit, total));
  })
);

// Get single match by ID
router.get('/:id',
  asyncHandler(async (req, res) => {
    const match = await Match.findById(req.params.id);

    if (!match || !match.isActive) {
      return res.status(404).json(createErrorResponse('Match not found'));
    }

    res.json(createSuccessResponse(match, 'Match retrieved successfully'));
  })
);

// Get featured matches
router.get('/featured/list',
  asyncHandler(async (req, res) => {
    const matches = await Match.find({ 
      isActive: true, 
      isFeatured: true,
      status: { $in: ['upcoming', 'live'] }
    })
    .sort({ startTime: 1 })
    .limit(10);

    res.json(createSuccessResponse(matches, 'Featured matches retrieved'));
  })
);

// Get live matches
router.get('/live/list',
  asyncHandler(async (req, res) => {
    const matches = await Match.find({ 
      isActive: true, 
      status: 'live'
    })
    .sort({ startTime: 1 });

    res.json(createSuccessResponse(matches, 'Live matches retrieved'));
  })
);

// Admin routes - Create new match
router.post('/',
  authenticateToken,
  requireAdmin,
  validateBody(createMatchSchema),
  asyncHandler(async (req, res) => {
    const matchData = req.body;
    
    const match = new Match({
      ...matchData,
      startTime: new Date(matchData.startTime),
    });

    await match.save();

    res.status(201).json(createSuccessResponse(match, 'Match created successfully'));
  })
);

// Admin routes - Update match
router.put('/:id',
  authenticateToken,
  requireAdmin,
  validateBody(updateMatchSchema),
  asyncHandler(async (req, res) => {
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json(createErrorResponse('Match not found'));
    }

    // Update match fields
    Object.assign(match, req.body);
    
    if (req.body.startTime) {
      match.startTime = new Date(req.body.startTime);
    }

    await match.save();

    // Emit odds update if odds were changed
    if (req.body.odds) {
      socketManager.emitOddsUpdate(match._id.toString(), match.odds);
    }

    res.json(createSuccessResponse(match, 'Match updated successfully'));
  })
);

// Admin routes - Update match odds
router.patch('/:id/odds',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { odds } = req.body;

    if (!odds || typeof odds !== 'object') {
      return res.status(400).json(createErrorResponse('Invalid odds data'));
    }

    const match = await Match.findByIdAndUpdate(
      req.params.id,
      { odds },
      { new: true, runValidators: true }
    );

    if (!match) {
      return res.status(404).json(createErrorResponse('Match not found'));
    }

    // Emit real-time odds update
    socketManager.emitOddsUpdate(match._id.toString(), odds);

    res.json(createSuccessResponse(match, 'Odds updated successfully'));
  })
);

// Admin routes - Set match result
router.patch('/:id/result',
  authenticateToken,
  requireAdmin,
  validateBody(matchResultSchema),
  asyncHandler(async (req, res) => {
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json(createErrorResponse('Match not found'));
    }

    if (match.status !== 'live' && match.status !== 'completed') {
      return res.status(400).json(createErrorResponse('Can only set result for live or completed matches'));
    }

    // Update match with result
    match.result = req.body;
    match.status = 'completed';
    match.endTime = new Date();

    await match.save();

    // Emit match result for real-time updates
    socketManager.emitMatchResult(match._id.toString(), match.result);

    res.json(createSuccessResponse(match, 'Match result set successfully'));
  })
);

// Admin routes - Toggle match status
router.patch('/:id/status',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { status } = req.body;

    if (!['upcoming', 'live', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json(createErrorResponse('Invalid status'));
    }

    const match = await Match.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!match) {
      return res.status(404).json(createErrorResponse('Match not found'));
    }

    res.json(createSuccessResponse(match, 'Match status updated successfully'));
  })
);

// Admin routes - Toggle featured status
router.patch('/:id/featured',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { isFeatured } = req.body;

    const match = await Match.findByIdAndUpdate(
      req.params.id,
      { isFeatured },
      { new: true }
    );

    if (!match) {
      return res.status(404).json(createErrorResponse('Match not found'));
    }

    res.json(createSuccessResponse(match, 'Match featured status updated'));
  })
);

// Admin routes - Delete match (soft delete)
router.delete('/:id',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const match = await Match.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!match) {
      return res.status(404).json(createErrorResponse('Match not found'));
    }

    res.json(createSuccessResponse(null, 'Match deleted successfully'));
  })
);

export default router;
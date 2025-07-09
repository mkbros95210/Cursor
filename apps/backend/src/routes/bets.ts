import express from 'express';
import { Bet, Match, User, Transaction } from '../models';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { betRateLimiter } from '../middleware/rateLimiter';
import { socketManager } from '../services/socketService';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createPaginatedResponse,
  placeBetSchema,
  betFiltersSchema,
  calculatePotentialWin
} from '@sports-betting/shared';

const router = express.Router();

// Place a new bet
router.post('/',
  authenticateToken,
  betRateLimiter,
  validateBody(placeBetSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const { matchId, betType, amount, odds } = req.body;
    const userId = req.user._id;

    // Verify match exists and is bettable
    const match = await Match.findById(matchId);
    if (!match || !match.isActive) {
      return res.status(404).json(createErrorResponse('Match not found'));
    }

    if (match.status !== 'upcoming' && match.status !== 'live') {
      return res.status(400).json(createErrorResponse('Betting is not available for this match'));
    }

    // Verify user has sufficient balance
    const user = await User.findById(userId);
    if (!user || user.wallet.balance < amount) {
      return res.status(400).json(createErrorResponse('Insufficient balance'));
    }

    // Verify odds haven't changed significantly (within 5% tolerance)
    const currentOdds = match.odds[betType === 'home_win' ? 'homeWin' : 
                                betType === 'away_win' ? 'awayWin' : 'draw'];
    
    if (!currentOdds || Math.abs(currentOdds - odds) / odds > 0.05) {
      return res.status(400).json(createErrorResponse('Odds have changed, please refresh and try again'));
    }

    // Calculate potential winnings
    const potentialWin = calculatePotentialWin(amount, odds);

    // Create bet
    const bet = new Bet({
      userId,
      matchId,
      betType,
      amount,
      odds: currentOdds,
      potentialWin,
    });

    // Create transaction for bet placement
    const transaction = new Transaction({
      userId,
      type: 'bet_placed',
      amount,
      status: 'completed',
      description: `Bet placed on ${match.homeTeam} vs ${match.awayTeam}`,
    });

    // Execute transaction
    await Promise.all([
      bet.save(),
      transaction.save(),
      User.findByIdAndUpdate(userId, {
        $inc: { 'wallet.balance': -amount }
      }),
      Match.findByIdAndUpdate(matchId, {
        $inc: { totalBets: 1, totalAmount: amount }
      })
    ]);

    // Populate bet with match and user data
    await bet.populate([
      { path: 'matchId', select: 'homeTeam awayTeam sport league startTime' },
      { path: 'userId', select: 'username email' }
    ]);

    // Emit real-time bet placement event
    socketManager.emitToAdmin('bet:placed', {
      bet: bet.toJSON(),
      user: user.username,
    });

    res.status(201).json(createSuccessResponse(bet, 'Bet placed successfully'));
  })
);

// Get user's bet history
router.get('/history',
  authenticateToken,
  validateQuery(betFiltersSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const { page = 1, limit = 20, status, startDate, endDate } = req.query as any;
    const userId = req.user._id;

    // Build filter
    const filter: any = { userId };
    
    if (status) filter.status = status;
    
    if (startDate || endDate) {
      filter.placedAt = {};
      if (startDate) filter.placedAt.$gte = new Date(startDate);
      if (endDate) filter.placedAt.$lte = new Date(endDate);
    }

    // Execute query with pagination
    const bets = await Bet.find(filter)
      .populate('matchId', 'homeTeam awayTeam sport league startTime status')
      .sort({ placedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Bet.countDocuments(filter);

    res.json(createPaginatedResponse(bets, page, limit, total));
  })
);

// Get specific bet by ID
router.get('/:id',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res) => {
    const bet = await Bet.findById(req.params.id)
      .populate('matchId', 'homeTeam awayTeam sport league startTime status result')
      .populate('userId', 'username email');

    if (!bet) {
      return res.status(404).json(createErrorResponse('Bet not found'));
    }

    // Check if user owns this bet or is admin
    if (bet.userId._id.toString() !== req.user._id.toString() && 
        !['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json(createErrorResponse('Access denied'));
    }

    res.json(createSuccessResponse(bet, 'Bet retrieved successfully'));
  })
);

// Cancel bet (only if match hasn't started)
router.patch('/:id/cancel',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res) => {
    const bet = await Bet.findById(req.params.id).populate('matchId');

    if (!bet) {
      return res.status(404).json(createErrorResponse('Bet not found'));
    }

    // Check ownership
    if (bet.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json(createErrorResponse('Access denied'));
    }

    // Check if bet can be cancelled
    if (bet.status !== 'pending') {
      return res.status(400).json(createErrorResponse('Bet cannot be cancelled'));
    }

    const match = bet.matchId as any;
    if (match.status !== 'upcoming') {
      return res.status(400).json(createErrorResponse('Cannot cancel bet for started/completed matches'));
    }

    // Cancel bet and refund
    bet.status = 'cancelled';
    await bet.save();

    // Create refund transaction
    const transaction = new Transaction({
      userId: bet.userId,
      type: 'bet_refund',
      amount: bet.amount,
      status: 'completed',
      description: `Bet cancellation refund`,
    });

    await Promise.all([
      transaction.save(),
      User.findByIdAndUpdate(bet.userId, {
        $inc: { 'wallet.balance': bet.amount }
      }),
      Match.findByIdAndUpdate(bet.matchId, {
        $inc: { totalBets: -1, totalAmount: -bet.amount }
      })
    ]);

    res.json(createSuccessResponse(bet, 'Bet cancelled successfully'));
  })
);

// Admin routes - Get all bets with filters
router.get('/admin/all',
  authenticateToken,
  requireAdmin,
  validateQuery(betFiltersSchema),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, userId, matchId, status, startDate, endDate } = req.query as any;

    // Build filter
    const filter: any = {};
    
    if (userId) filter.userId = userId;
    if (matchId) filter.matchId = matchId;
    if (status) filter.status = status;
    
    if (startDate || endDate) {
      filter.placedAt = {};
      if (startDate) filter.placedAt.$gte = new Date(startDate);
      if (endDate) filter.placedAt.$lte = new Date(endDate);
    }

    // Execute query with pagination
    const bets = await Bet.find(filter)
      .populate('userId', 'username email')
      .populate('matchId', 'homeTeam awayTeam sport league startTime status')
      .sort({ placedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Bet.countDocuments(filter);

    res.json(createPaginatedResponse(bets, page, limit, total));
  })
);

// Admin routes - Settle bet manually
router.patch('/:id/settle',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { status } = req.body; // 'won' or 'lost'

    if (!['won', 'lost'].includes(status)) {
      return res.status(400).json(createErrorResponse('Invalid settlement status'));
    }

    const bet = await Bet.findById(req.params.id).populate('matchId');

    if (!bet) {
      return res.status(404).json(createErrorResponse('Bet not found'));
    }

    if (bet.status !== 'pending') {
      return res.status(400).json(createErrorResponse('Bet is already settled'));
    }

    // Update bet status
    bet.status = status;
    bet.settledAt = new Date();
    await bet.save();

    // If bet won, create winning transaction and credit user
    if (status === 'won') {
      const transaction = new Transaction({
        userId: bet.userId,
        type: 'bet_won',
        amount: bet.potentialWin,
        status: 'completed',
        description: `Winning from bet on ${(bet.matchId as any).homeTeam} vs ${(bet.matchId as any).awayTeam}`,
      });

      await Promise.all([
        transaction.save(),
        User.findByIdAndUpdate(bet.userId, {
          $inc: { 'wallet.balance': bet.potentialWin }
        })
      ]);
    }

    res.json(createSuccessResponse(bet, `Bet ${status} successfully`));
  })
);

export default router;
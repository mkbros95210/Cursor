import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { authRateLimiter } from '../middleware/rateLimiter';
import { validateBody } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { createSuccessResponse, createErrorResponse, userRegistrationSchema, userLoginSchema } from '@sports-betting/shared';

const router = express.Router();

// Register new user
router.post('/register', 
  authRateLimiter,
  validateBody(userRegistrationSchema),
  asyncHandler(async (req, res) => {
    const { username, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json(createErrorResponse('User already exists with this email or username'));
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      phone,
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json(createSuccessResponse({
      user: user.toJSON(),
      token,
    }, 'User registered successfully'));
  })
);

// Login user
router.post('/login',
  authRateLimiter,
  validateBody(userLoginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json(createErrorResponse('Invalid email or password'));
    }

    if (!user.isActive) {
      return res.status(401).json(createErrorResponse('Account is deactivated'));
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json(createSuccessResponse({
      user: user.toJSON(),
      token,
    }, 'Login successful'));
  })
);

// Verify token and get user info
router.get('/me',
  asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json(createErrorResponse('Access token required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const user = await User.findById(decoded.userId);

      if (!user) {
        return res.status(401).json(createErrorResponse('Invalid token'));
      }

      res.json(createSuccessResponse(user.toJSON(), 'User info retrieved'));
    } catch (error) {
      return res.status(401).json(createErrorResponse('Invalid token'));
    }
  })
);

// Refresh token
router.post('/refresh',
  asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json(createErrorResponse('Access token required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const user = await User.findById(decoded.userId);

      if (!user || !user.isActive) {
        return res.status(401).json(createErrorResponse('Invalid token'));
      }

      // Generate new token
      const newToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.json(createSuccessResponse({
        token: newToken,
      }, 'Token refreshed successfully'));
    } catch (error) {
      return res.status(401).json(createErrorResponse('Invalid token'));
    }
  })
);

// Logout (client-side token removal, but we can track it)
router.post('/logout',
  asyncHandler(async (req, res) => {
    // In a production app, you might want to blacklist the token
    res.json(createSuccessResponse(null, 'Logged out successfully'));
  })
);

export default router;
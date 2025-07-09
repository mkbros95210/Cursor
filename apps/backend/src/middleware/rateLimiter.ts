import rateLimit from 'express-rate-limit';
import { createErrorResponse } from '@sports-betting/shared';

// General API rate limiter
export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: createErrorResponse('Too many requests from this IP, please try again later.'),
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limiter for auth endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: createErrorResponse('Too many authentication attempts, please try again later.'),
  standardHeaders: true,
  legacyHeaders: false,
});

// Betting rate limiter
export const betRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 bets per minute
  message: createErrorResponse('Too many bets placed, please slow down.'),
  standardHeaders: true,
  legacyHeaders: false,
});

// Payment rate limiter
export const paymentRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // limit each IP to 3 payment requests per minute
  message: createErrorResponse('Too many payment requests, please try again later.'),
  standardHeaders: true,
  legacyHeaders: false,
});
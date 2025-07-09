import { z } from 'zod';

// User Schemas
export const userRegistrationSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  phone: z.string().optional(),
});

export const userLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const updateUserSchema = z.object({
  username: z.string().min(3).max(20).optional(),
  phone: z.string().optional(),
  avatar: z.string().url().optional(),
});

// Match Schemas
export const createMatchSchema = z.object({
  homeTeam: z.string().min(1),
  awayTeam: z.string().min(1),
  sport: z.enum(['cricket', 'football', 'basketball', 'tennis', 'other']),
  league: z.string().min(1),
  startTime: z.string().datetime(),
  venue: z.string().min(1),
  odds: z.object({
    homeWin: z.number().positive(),
    awayWin: z.number().positive(),
    draw: z.number().positive().optional(),
  }),
});

export const updateMatchSchema = z.object({
  homeTeam: z.string().min(1).optional(),
  awayTeam: z.string().min(1).optional(),
  sport: z.enum(['cricket', 'football', 'basketball', 'tennis', 'other']).optional(),
  league: z.string().min(1).optional(),
  startTime: z.string().datetime().optional(),
  venue: z.string().min(1).optional(),
  odds: z.object({
    homeWin: z.number().positive(),
    awayWin: z.number().positive(),
    draw: z.number().positive().optional(),
  }).optional(),
  status: z.enum(['upcoming', 'live', 'completed', 'cancelled']).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export const matchResultSchema = z.object({
  homeScore: z.number().min(0),
  awayScore: z.number().min(0),
  winner: z.enum(['home', 'away', 'draw']),
});

// Bet Schemas
export const placeBetSchema = z.object({
  matchId: z.string().min(1),
  betType: z.enum(['home_win', 'away_win', 'draw']),
  amount: z.number().positive().min(1).max(100000),
  odds: z.number().positive(),
});

// Wallet Schemas
export const depositSchema = z.object({
  amount: z.number().positive().min(10).max(100000),
  paymentMethod: z.enum(['stripe', 'razorpay', 'bank_transfer']),
});

export const withdrawSchema = z.object({
  amount: z.number().positive().min(10),
  accountDetails: z.object({
    accountNumber: z.string().min(10).max(20),
    bankName: z.string().min(1),
    ifscCode: z.string().min(11).max(11),
  }),
});

// Banner Schemas
export const createBannerSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  imageUrl: z.string().url(),
  linkUrl: z.string().url().optional(),
  position: z.enum(['hero', 'sidebar', 'popup']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export const updateBannerSchema = createBannerSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// Notification Schemas
export const createNotificationSchema = z.object({
  userId: z.string().optional(),
  title: z.string().min(1),
  message: z.string().min(1),
  type: z.enum(['bet_result', 'odds_change', 'promotion', 'system', 'payment']),
  data: z.any().optional(),
});

// Query Schemas
export const paginationSchema = z.object({
  page: z.string().transform(Number).refine(n => n > 0).optional(),
  limit: z.string().transform(Number).refine(n => n > 0 && n <= 100).optional(),
});

export const matchFiltersSchema = z.object({
  sport: z.string().optional(),
  status: z.string().optional(),
  league: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isFeatured: z.string().transform(val => val === 'true').optional(),
}).merge(paginationSchema);

export const betFiltersSchema = z.object({
  userId: z.string().optional(),
  matchId: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
}).merge(paginationSchema);

export const userFiltersSchema = z.object({
  role: z.string().optional(),
  isActive: z.string().transform(val => val === 'true').optional(),
  isVerified: z.string().transform(val => val === 'true').optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
}).merge(paginationSchema);
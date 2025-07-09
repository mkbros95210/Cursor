// User Types
export interface User {
  _id: string;
  username: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin' | 'superadmin';
  isActive: boolean;
  isVerified: boolean;
  avatar?: string;
  wallet: {
    balance: number;
    currency: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRegistration {
  username: string;
  email: string;
  password: string;
  phone?: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

// Match Types
export interface Match {
  _id: string;
  homeTeam: string;
  awayTeam: string;
  sport: 'cricket' | 'football' | 'basketball' | 'tennis' | 'other';
  league: string;
  startTime: Date;
  endTime?: Date;
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
  venue: string;
  odds: {
    homeWin: number;
    awayWin: number;
    draw?: number;
  };
  result?: {
    homeScore: number;
    awayScore: number;
    winner: 'home' | 'away' | 'draw';
  };
  isActive: boolean;
  isFeatured: boolean;
  totalBets: number;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMatchDto {
  homeTeam: string;
  awayTeam: string;
  sport: 'cricket' | 'football' | 'basketball' | 'tennis' | 'other';
  league: string;
  startTime: Date;
  venue: string;
  odds: {
    homeWin: number;
    awayWin: number;
    draw?: number;
  };
}

// Bet Types
export interface Bet {
  _id: string;
  userId: string;
  matchId: string;
  betType: 'home_win' | 'away_win' | 'draw';
  amount: number;
  odds: number;
  potentialWin: number;
  status: 'pending' | 'won' | 'lost' | 'cancelled';
  placedAt: Date;
  settledAt?: Date;
  match: Match;
  user: User;
}

export interface PlaceBetDto {
  matchId: string;
  betType: 'home_win' | 'away_win' | 'draw';
  amount: number;
  odds: number;
}

// Wallet & Transaction Types
export interface Transaction {
  _id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'bet_placed' | 'bet_won' | 'bet_refund';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  paymentMethod?: string;
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DepositDto {
  amount: number;
  paymentMethod: 'stripe' | 'razorpay' | 'bank_transfer';
}

export interface WithdrawDto {
  amount: number;
  accountDetails: {
    accountNumber: string;
    bankName: string;
    ifscCode: string;
  };
}

// Notification Types
export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'bet_result' | 'odds_change' | 'promotion' | 'system' | 'payment';
  isRead: boolean;
  data?: any;
  createdAt: Date;
}

// Banner Types
export interface Banner {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl?: string;
  isActive: boolean;
  position: 'hero' | 'sidebar' | 'popup';
  startDate: Date;
  endDate: Date;
  createdAt: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// WebSocket Event Types
export interface SocketEvent {
  type: 'odds_update' | 'match_result' | 'bet_placed' | 'notification';
  data: any;
  timestamp: Date;
}

// Admin Dashboard Types
export interface DashboardStats {
  totalUsers: number;
  totalMatches: number;
  totalBets: number;
  totalRevenue: number;
  recentBets: Bet[];
  recentUsers: User[];
  dailyStats: {
    date: string;
    bets: number;
    revenue: number;
    users: number;
  }[];
}

// Filter Types
export interface MatchFilters {
  sport?: string;
  status?: string;
  league?: string;
  startDate?: Date;
  endDate?: Date;
  isFeatured?: boolean;
}

export interface BetFilters {
  userId?: string;
  matchId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface UserFilters {
  role?: string;
  isActive?: boolean;
  isVerified?: boolean;
  startDate?: Date;
  endDate?: Date;
}
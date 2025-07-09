import mongoose, { Schema, Document } from 'mongoose';
import { Match as IMatch } from '@sports-betting/shared';

export interface MatchDocument extends Omit<IMatch, '_id'>, Document {}

const matchSchema = new Schema<MatchDocument>({
  homeTeam: {
    type: String,
    required: true,
    trim: true,
  },
  awayTeam: {
    type: String,
    required: true,
    trim: true,
  },
  sport: {
    type: String,
    enum: ['cricket', 'football', 'basketball', 'tennis', 'other'],
    required: true,
  },
  league: {
    type: String,
    required: true,
    trim: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['upcoming', 'live', 'completed', 'cancelled'],
    default: 'upcoming',
  },
  venue: {
    type: String,
    required: true,
    trim: true,
  },
  odds: {
    homeWin: {
      type: Number,
      required: true,
      min: 1.01,
    },
    awayWin: {
      type: Number,
      required: true,
      min: 1.01,
    },
    draw: {
      type: Number,
      min: 1.01,
    },
  },
  result: {
    homeScore: {
      type: Number,
      min: 0,
    },
    awayScore: {
      type: Number,
      min: 0,
    },
    winner: {
      type: String,
      enum: ['home', 'away', 'draw'],
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  totalBets: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
matchSchema.index({ sport: 1 });
matchSchema.index({ status: 1 });
matchSchema.index({ startTime: 1 });
matchSchema.index({ isActive: 1 });
matchSchema.index({ isFeatured: 1 });
matchSchema.index({ league: 1 });

// Compound indexes
matchSchema.index({ sport: 1, status: 1 });
matchSchema.index({ startTime: 1, status: 1 });

export const Match = mongoose.model<MatchDocument>('Match', matchSchema);
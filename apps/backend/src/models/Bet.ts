import mongoose, { Schema, Document } from 'mongoose';
import { Bet as IBet } from '@sports-betting/shared';

export interface BetDocument extends Omit<IBet, '_id' | 'match' | 'user'>, Document {
  userId: mongoose.Types.ObjectId;
  matchId: mongoose.Types.ObjectId;
}

const betSchema = new Schema<BetDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  matchId: {
    type: Schema.Types.ObjectId,
    ref: 'Match',
    required: true,
  },
  betType: {
    type: String,
    enum: ['home_win', 'away_win', 'draw'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 1,
    max: 100000,
  },
  odds: {
    type: Number,
    required: true,
    min: 1.01,
  },
  potentialWin: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'won', 'lost', 'cancelled'],
    default: 'pending',
  },
  placedAt: {
    type: Date,
    default: Date.now,
  },
  settledAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
betSchema.index({ userId: 1 });
betSchema.index({ matchId: 1 });
betSchema.index({ status: 1 });
betSchema.index({ placedAt: -1 });
betSchema.index({ settledAt: -1 });

// Compound indexes
betSchema.index({ userId: 1, status: 1 });
betSchema.index({ matchId: 1, status: 1 });
betSchema.index({ userId: 1, placedAt: -1 });

export const Bet = mongoose.model<BetDocument>('Bet', betSchema);
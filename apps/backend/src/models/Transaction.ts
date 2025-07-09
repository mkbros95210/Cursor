import mongoose, { Schema, Document } from 'mongoose';
import { Transaction as ITransaction } from '@sports-betting/shared';

export interface TransactionDocument extends Omit<ITransaction, '_id'>, Document {
  userId: mongoose.Types.ObjectId;
}

const transactionSchema = new Schema<TransactionDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'bet_placed', 'bet_won', 'bet_refund'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending',
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  paymentMethod: {
    type: String,
    trim: true,
  },
  paymentId: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
transactionSchema.index({ userId: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ paymentId: 1 });

// Compound indexes
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ userId: 1, status: 1 });
transactionSchema.index({ userId: 1, createdAt: -1 });

export const Transaction = mongoose.model<TransactionDocument>('Transaction', transactionSchema);
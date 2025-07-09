import mongoose, { Schema, Document } from 'mongoose';
import { Notification as INotification } from '@sports-betting/shared';

export interface NotificationDocument extends Omit<INotification, '_id'>, Document {
  userId: mongoose.Types.ObjectId;
}

const notificationSchema = new Schema<NotificationDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['bet_result', 'odds_change', 'promotion', 'system', 'payment'],
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  data: {
    type: Schema.Types.Mixed,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
notificationSchema.index({ userId: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ createdAt: -1 });

// Compound indexes
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification = mongoose.model<NotificationDocument>('Notification', notificationSchema);
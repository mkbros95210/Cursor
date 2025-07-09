import mongoose, { Schema, Document } from 'mongoose';
import { Banner as IBanner } from '@sports-betting/shared';

export interface BannerDocument extends Omit<IBanner, '_id'>, Document {}

const bannerSchema = new Schema<BannerDocument>({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  imageUrl: {
    type: String,
    required: true,
    trim: true,
  },
  linkUrl: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  position: {
    type: String,
    enum: ['hero', 'sidebar', 'popup'],
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
bannerSchema.index({ isActive: 1 });
bannerSchema.index({ position: 1 });
bannerSchema.index({ startDate: 1 });
bannerSchema.index({ endDate: 1 });

// Compound indexes
bannerSchema.index({ isActive: 1, position: 1 });
bannerSchema.index({ startDate: 1, endDate: 1 });

export const Banner = mongoose.model<BannerDocument>('Banner', bannerSchema);
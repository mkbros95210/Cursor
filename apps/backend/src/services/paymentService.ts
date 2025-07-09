import Stripe from 'stripe';
import Razorpay from 'razorpay';
import { logger } from '../utils/logger';
import { Transaction, User } from '../models';
import { createCustomError } from '../middleware/errorHandler';

// Initialize payment gateways
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export class PaymentService {
  // Create Stripe payment intent
  static async createStripePaymentIntent(amount: number, currency: string = 'usd', userId: string) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata: {
          userId,
        },
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      logger.error('Stripe payment intent creation failed:', error);
      throw createCustomError('Failed to create payment intent', 500);
    }
  }

  // Create Razorpay order
  static async createRazorpayOrder(amount: number, currency: string = 'INR', userId: string) {
    try {
      const order = await razorpay.orders.create({
        amount: Math.round(amount * 100), // Convert to paise
        currency,
        notes: {
          userId,
        },
      });

      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
      };
    } catch (error) {
      logger.error('Razorpay order creation failed:', error);
      throw createCustomError('Failed to create payment order', 500);
    }
  }

  // Verify Stripe payment
  static async verifyStripePayment(paymentIntentId: string) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        return {
          success: true,
          amount: paymentIntent.amount / 100, // Convert from cents
          currency: paymentIntent.currency,
          userId: paymentIntent.metadata.userId,
        };
      }

      return { success: false };
    } catch (error) {
      logger.error('Stripe payment verification failed:', error);
      throw createCustomError('Failed to verify payment', 500);
    }
  }

  // Verify Razorpay payment
  static async verifyRazorpayPayment(
    paymentId: string,
    orderId: string,
    signature: string
  ) {
    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      if (signature === expectedSignature) {
        const payment = await razorpay.payments.fetch(paymentId);
        const order = await razorpay.orders.fetch(orderId);

        return {
          success: true,
          amount: payment.amount / 100, // Convert from paise
          currency: payment.currency,
          userId: order.notes.userId,
        };
      }

      return { success: false };
    } catch (error) {
      logger.error('Razorpay payment verification failed:', error);
      throw createCustomError('Failed to verify payment', 500);
    }
  }

  // Process deposit
  static async processDeposit(
    userId: string,
    amount: number,
    paymentMethod: string,
    paymentId: string
  ) {
    try {
      // Create transaction record
      const transaction = new Transaction({
        userId,
        type: 'deposit',
        amount,
        status: 'completed',
        description: `Deposit via ${paymentMethod}`,
        paymentMethod,
        paymentId,
      });

      await transaction.save();

      // Update user wallet
      await User.findByIdAndUpdate(userId, {
        $inc: { 'wallet.balance': amount },
      });

      logger.info(`Deposit processed: User ${userId}, Amount ${amount}`);
      return transaction;
    } catch (error) {
      logger.error('Deposit processing failed:', error);
      throw createCustomError('Failed to process deposit', 500);
    }
  }

  // Process withdrawal
  static async processWithdrawal(userId: string, amount: number, accountDetails: any) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw createCustomError('User not found', 404);
      }

      if (user.wallet.balance < amount) {
        throw createCustomError('Insufficient balance', 400);
      }

      // Create pending transaction
      const transaction = new Transaction({
        userId,
        type: 'withdrawal',
        amount,
        status: 'pending',
        description: `Withdrawal to ${accountDetails.bankName}`,
        paymentMethod: 'bank_transfer',
      });

      await transaction.save();

      // Deduct amount from wallet (will be refunded if withdrawal fails)
      await User.findByIdAndUpdate(userId, {
        $inc: { 'wallet.balance': -amount },
      });

      logger.info(`Withdrawal initiated: User ${userId}, Amount ${amount}`);
      return transaction;
    } catch (error) {
      logger.error('Withdrawal processing failed:', error);
      throw error;
    }
  }

  // Approve withdrawal (admin action)
  static async approveWithdrawal(transactionId: string) {
    try {
      const transaction = await Transaction.findById(transactionId);
      if (!transaction || transaction.type !== 'withdrawal') {
        throw createCustomError('Transaction not found', 404);
      }

      transaction.status = 'completed';
      await transaction.save();

      logger.info(`Withdrawal approved: Transaction ${transactionId}`);
      return transaction;
    } catch (error) {
      logger.error('Withdrawal approval failed:', error);
      throw error;
    }
  }

  // Reject withdrawal (admin action)
  static async rejectWithdrawal(transactionId: string) {
    try {
      const transaction = await Transaction.findById(transactionId);
      if (!transaction || transaction.type !== 'withdrawal') {
        throw createCustomError('Transaction not found', 404);
      }

      // Refund amount to user wallet
      await User.findByIdAndUpdate(transaction.userId, {
        $inc: { 'wallet.balance': transaction.amount },
      });

      transaction.status = 'cancelled';
      await transaction.save();

      logger.info(`Withdrawal rejected: Transaction ${transactionId}`);
      return transaction;
    } catch (error) {
      logger.error('Withdrawal rejection failed:', error);
      throw error;
    }
  }
}
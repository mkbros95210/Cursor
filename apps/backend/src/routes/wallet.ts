import express from 'express';
import { Transaction, User } from '../models';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { paymentRateLimiter } from '../middleware/rateLimiter';
import { PaymentService } from '../services/paymentService';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createPaginatedResponse,
  depositSchema,
  withdrawSchema,
  paginationSchema
} from '@sports-betting/shared';

const router = express.Router();

// Get wallet balance
router.get('/balance',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res) => {
    const user = await User.findById(req.user._id).select('wallet');
    
    if (!user) {
      return res.status(404).json(createErrorResponse('User not found'));
    }

    res.json(createSuccessResponse(user.wallet, 'Wallet balance retrieved'));
  })
);

// Get transaction history
router.get('/transactions',
  authenticateToken,
  validateQuery(paginationSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const { page = 1, limit = 20 } = req.query as any;
    const userId = req.user._id;

    const transactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Transaction.countDocuments({ userId });

    res.json(createPaginatedResponse(transactions, page, limit, total));
  })
);

// Create deposit intent (Stripe)
router.post('/deposit/stripe/intent',
  authenticateToken,
  paymentRateLimiter,
  validateBody(depositSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const { amount } = req.body;
    const userId = req.user._id;

    const paymentIntent = await PaymentService.createStripePaymentIntent(
      amount,
      'usd',
      userId.toString()
    );

    res.json(createSuccessResponse(paymentIntent, 'Payment intent created'));
  })
);

// Create Razorpay order
router.post('/deposit/razorpay/order',
  authenticateToken,
  paymentRateLimiter,
  validateBody(depositSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const { amount } = req.body;
    const userId = req.user._id;

    const order = await PaymentService.createRazorpayOrder(
      amount,
      'INR',
      userId.toString()
    );

    res.json(createSuccessResponse(order, 'Razorpay order created'));
  })
);

// Verify and process Stripe payment
router.post('/deposit/stripe/verify',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res) => {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json(createErrorResponse('Payment intent ID required'));
    }

    const verification = await PaymentService.verifyStripePayment(paymentIntentId);

    if (!verification.success) {
      return res.status(400).json(createErrorResponse('Payment verification failed'));
    }

    // Process deposit
    const transaction = await PaymentService.processDeposit(
      verification.userId,
      verification.amount,
      'stripe',
      paymentIntentId
    );

    res.json(createSuccessResponse(transaction, 'Deposit processed successfully'));
  })
);

// Verify and process Razorpay payment
router.post('/deposit/razorpay/verify',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res) => {
    const { paymentId, orderId, signature } = req.body;

    if (!paymentId || !orderId || !signature) {
      return res.status(400).json(createErrorResponse('Payment details required'));
    }

    const verification = await PaymentService.verifyRazorpayPayment(
      paymentId,
      orderId,
      signature
    );

    if (!verification.success) {
      return res.status(400).json(createErrorResponse('Payment verification failed'));
    }

    // Process deposit
    const transaction = await PaymentService.processDeposit(
      verification.userId,
      verification.amount,
      'razorpay',
      paymentId
    );

    res.json(createSuccessResponse(transaction, 'Deposit processed successfully'));
  })
);

// Request withdrawal
router.post('/withdraw',
  authenticateToken,
  paymentRateLimiter,
  validateBody(withdrawSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const { amount, accountDetails } = req.body;
    const userId = req.user._id;

    const transaction = await PaymentService.processWithdrawal(
      userId.toString(),
      amount,
      accountDetails
    );

    res.status(201).json(createSuccessResponse(transaction, 'Withdrawal request submitted'));
  })
);

// Get withdrawal status
router.get('/withdraw/:transactionId',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res) => {
    const transaction = await Transaction.findById(req.params.transactionId);

    if (!transaction) {
      return res.status(404).json(createErrorResponse('Transaction not found'));
    }

    // Check ownership
    if (transaction.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json(createErrorResponse('Access denied'));
    }

    res.json(createSuccessResponse(transaction, 'Transaction retrieved'));
  })
);

// Cancel pending withdrawal
router.patch('/withdraw/:transactionId/cancel',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res) => {
    const transaction = await Transaction.findById(req.params.transactionId);

    if (!transaction) {
      return res.status(404).json(createErrorResponse('Transaction not found'));
    }

    // Check ownership
    if (transaction.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json(createErrorResponse('Access denied'));
    }

    if (transaction.type !== 'withdrawal' || transaction.status !== 'pending') {
      return res.status(400).json(createErrorResponse('Cannot cancel this transaction'));
    }

    // Cancel withdrawal and refund balance
    transaction.status = 'cancelled';
    await transaction.save();

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'wallet.balance': transaction.amount }
    });

    res.json(createSuccessResponse(transaction, 'Withdrawal cancelled successfully'));
  })
);

// Get wallet statistics
router.get('/stats',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user._id;

    const stats = await Transaction.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const user = await User.findById(userId).select('wallet');

    res.json(createSuccessResponse({
      currentBalance: user?.wallet.balance || 0,
      stats
    }, 'Wallet statistics retrieved'));
  })
);

export default router;
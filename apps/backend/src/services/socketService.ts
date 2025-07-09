import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { logger } from '../utils/logger';
import { SocketEvent } from '@sports-betting/shared';

class SocketManager {
  private io: Server | null = null;
  private connectedUsers = new Map<string, string>(); // userId -> socketId

  initialize(io: Server) {
    this.io = io;
    this.setupMiddleware();
    this.setupEventHandlers();
    logger.info('Socket.IO initialized');
  }

  private setupMiddleware() {
    if (!this.io) return;

    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const user = await User.findById(decoded.userId);

        if (!user || !user.isActive) {
          return next(new Error('Authentication error'));
        }

        socket.data.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });
  }

  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      const user = socket.data.user;
      logger.info(`User ${user.username} connected`);

      // Store user connection
      this.connectedUsers.set(user._id.toString(), socket.id);

      // Join user to their personal room
      socket.join(`user:${user._id}`);

      // Join admin users to admin room
      if (user.role === 'admin' || user.role === 'superadmin') {
        socket.join('admin');
      }

      // Handle bet placement events
      socket.on('bet:place', (data) => {
        this.handleBetPlacement(socket, data);
      });

      // Handle odds subscription
      socket.on('odds:subscribe', (matchId) => {
        socket.join(`match:${matchId}`);
        logger.info(`User ${user.username} subscribed to odds for match ${matchId}`);
      });

      // Handle odds unsubscription
      socket.on('odds:unsubscribe', (matchId) => {
        socket.leave(`match:${matchId}`);
        logger.info(`User ${user.username} unsubscribed from odds for match ${matchId}`);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        this.connectedUsers.delete(user._id.toString());
        logger.info(`User ${user.username} disconnected`);
      });
    });
  }

  private handleBetPlacement(socket: Socket, data: any) {
    const user = socket.data.user;
    logger.info(`Bet placement event from user ${user.username}:`, data);

    // Emit to admin room for real-time bet monitoring
    this.emitToAdmin('bet:placed', {
      userId: user._id,
      username: user.username,
      ...data,
      timestamp: new Date(),
    });
  }

  // Emit odds update to all subscribers of a match
  emitOddsUpdate(matchId: string, odds: any) {
    if (!this.io) return;

    const event: SocketEvent = {
      type: 'odds_update',
      data: { matchId, odds },
      timestamp: new Date(),
    };

    this.io.to(`match:${matchId}`).emit('odds:update', event);
    logger.info(`Odds update emitted for match ${matchId}`);
  }

  // Emit match result to all subscribers
  emitMatchResult(matchId: string, result: any) {
    if (!this.io) return;

    const event: SocketEvent = {
      type: 'match_result',
      data: { matchId, result },
      timestamp: new Date(),
    };

    this.io.to(`match:${matchId}`).emit('match:result', event);
    logger.info(`Match result emitted for match ${matchId}`);
  }

  // Send notification to specific user
  emitNotificationToUser(userId: string, notification: any) {
    if (!this.io) return;

    const event: SocketEvent = {
      type: 'notification',
      data: notification,
      timestamp: new Date(),
    };

    this.io.to(`user:${userId}`).emit('notification', event);
    logger.info(`Notification sent to user ${userId}`);
  }

  // Send notification to all connected users
  emitBroadcastNotification(notification: any) {
    if (!this.io) return;

    const event: SocketEvent = {
      type: 'notification',
      data: notification,
      timestamp: new Date(),
    };

    this.io.emit('notification', event);
    logger.info('Broadcast notification sent to all users');
  }

  // Emit to admin room
  emitToAdmin(eventName: string, data: any) {
    if (!this.io) return;

    this.io.to('admin').emit(eventName, {
      ...data,
      timestamp: new Date(),
    });
  }

  // Get connected users count
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Check if user is connected
  isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  // Get socket ID for user
  getUserSocketId(userId: string): string | undefined {
    return this.connectedUsers.get(userId);
  }
}

export const socketManager = new SocketManager();
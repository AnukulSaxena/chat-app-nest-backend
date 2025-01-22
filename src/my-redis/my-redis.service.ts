import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class MyRedisService {
  private readonly logger = new Logger(MyRedisService.name);
  redis: Redis;
  private readonly subscriberRedis: Redis;
  private counter = 0;

  private readonly socketKeyPrefix = 'user-sockets';
  private readonly socketToUserHash = 'socket-to-user';

  constructor() {
    this.redis = new Redis({
      host: 'localhost',
      port: 6379,
    });

    // Subscriber Redis client
    this.subscriberRedis = new Redis({
      host: 'localhost',
      port: 6379,
      connectTimeout: 5000,
    });

    this.redis.on('connect', () => {
      this.logger.log('Redis client connected successfully');
    });

    this.redis.on('ready', () => {
      this.logger.log('Redis client is ready to use');
    });

    this.redis.on('error', (error) => {
      this.logger.error('Redis client encountered an error', error.message);
    });

    this.redis.on('reconnecting', () => {
      this.logger.warn('Redis client is reconnecting...');
    });

    this.subscriberRedis.on('connect', () => {
      this.logger.log('SubRedis client connected successfully');
    });

    this.subscriberRedis.on('ready', () => {
      this.logger.log('SubRedis client is ready to use');
    });

    this.subscriberRedis.on('error', (error) => {
      this.logger.error('SubRedis client encountered an error', error.message);
    });

    this.subscriberRedis.on('reconnecting', () => {
      this.logger.warn('SubRedis client is reconnecting...');
    });

    this.subscribeToKeyEvents();
  }

  /**
   * Subscribe to Redis key expiration events and handle cleanup logic.
   */
  private async subscribeToKeyEvents(): Promise<void> {
    this.subscriberRedis.psubscribe('__keyevent@0__:expired');

    this.subscriberRedis.on(
      'pmessage',
      async (pattern, channel, expiredKey) => {
        if (expiredKey.startsWith('socketTTL:')) {
          const socketId = expiredKey.split(':')[1];
          await this.removeSocketId(socketId); // Cleanup logic
        }
      },
    );

    this.subscriberRedis.on('end', () => {
      this.subscriberRedis.quit(); // Ensure subscriber instance is closed
    });
  }

  /**
   * Add a socket ID for a user and assign a TTL for the socket ID.
   * @param userId - The user ID
   * @param socketId - The socket ID
   * @param ttl - Time-to-live in seconds
   */
  async addSocketId(userId: string, socketId: string, ttl = 3600): Promise<void> {
    const key = `${this.socketKeyPrefix}:${userId}`;
    await this.redis.sadd(key, socketId);
    await this.redis.hset(this.socketToUserHash, socketId, userId);

    // Set TTL for the socket ID key
    await this.redis.set(`socketTTL:${socketId}`, userId, 'EX', ttl);

    this.logger.log(
      `Added socket ID: ${socketId} for user ID: ${userId} with TTL: ${ttl}`,
    );
  }

  /**
   * Remove a socket ID and its associated mappings.
   * @param socketId - The socket ID to remove
   */
  async removeSocketId(socketId: string): Promise<void> {
    const userId = await this.redis.hget(this.socketToUserHash, socketId);
    if (userId) {
      const key = `${this.socketKeyPrefix}:${userId}`;
      await this.redis.srem(key, socketId);
      await this.redis.hdel(this.socketToUserHash, socketId);
      await this.redis.del(`socketTTL:${socketId}`);

      console.log('counter', this.counter++);
      this.logger.log(`Removed socket ID: ${socketId} for user ID: ${userId}`);
    }
  }

  /**
   * Get the user ID associated with a given socket ID.
   * @param socketId - The socket ID
   * @returns The user ID or null if not found
   */
  async getUserIdFromSocket(socketId: string): Promise<string | null> {
    return await this.redis.hget(this.socketToUserHash, socketId);
  }

  /**
   * Get all active socket IDs for a user.
   * @param userId - The user ID
   * @returns Array of socket IDs
   */
  async getSocketIdsForUser(userId: string): Promise<string[]> {
    const key = `${this.socketKeyPrefix}:${userId}`;
    return await this.redis.smembers(key);
  }

  /**
   * Delete a user and all their associated socket IDs.
   * @param userId - The user ID to delete
   */
  async deleteUserSockets(userId: string): Promise<void> {
    const key = `${this.socketKeyPrefix}:${userId}`;
    const socketIds = await this.redis.smembers(key);

    for (const socketId of socketIds) {
      await this.redis.hdel(this.socketToUserHash, socketId);
    }

    await this.redis.del(key);
    this.logger.log(`Deleted all sockets for user ID: ${userId}`);
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const data = JSON.stringify(value);
    if (ttl) {
      await this.redis.set(key, data, 'EX', ttl);
    } else {
      await this.redis.set(key, data);
    }
  }

  async get(key: string): Promise<any> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;

  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return await this.redis.keys(pattern);
  }
}

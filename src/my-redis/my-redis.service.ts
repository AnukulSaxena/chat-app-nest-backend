import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class MyRedisService {
  private client: Redis;
  private readonly logger = new Logger(MyRedisService.name);

  constructor() {
    this.client = new Redis({
      host: 'localhost',
      port: 6379,
    });

    // Log connection events
    this.client.on('connect', () => {
      this.logger.log('Redis client connected successfully');
    });

    this.client.on('ready', () => {
      this.logger.log('Redis client is ready to use');
    });

    this.client.on('error', (error) => {
      this.logger.error('Redis client encountered an error', error.message);
    });

    this.client.on('reconnecting', () => {
      this.logger.warn('Redis client is reconnecting...');
    });
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const data = JSON.stringify(value);
    if (ttl) {
      await this.client.set(key, data, 'EX', ttl);
    } else {
      await this.client.set(key, data);
    }
  }

  async get(key: string): Promise<any> {
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return await this.client.keys(pattern);
  }
}

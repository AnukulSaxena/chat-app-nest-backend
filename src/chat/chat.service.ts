import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Schema, Types } from 'mongoose';
import { Chat } from 'src/schema/chat.schema';
import { MyRedisService } from 'src/my-redis/my-redis.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chat.name) private readonly chatModel: Model<Chat>,
    private readonly redisService: MyRedisService,
  ) {}

  async createChat(
    users: Types.ObjectId[],
    isGroup: boolean,
    groupName?: string,
  ) {
    if (!isGroup) {
      if (users.length !== 2) {
        throw new ConflictException(`There should be two people here`);
      }

      const existingChat = await this.chatModel.findOne({
        users: { $all: users },
        isGroup,
        groupName,
      });
      if (existingChat) {
        throw new ConflictException(`A one-to-one chat already exists`);
      }
    }

    const createdChat = await this.chatModel.create({
      users: users,
      isGroup,
      groupName,
    });
    return createdChat;
  }

  async getUserChats(userId: string, resetCache: boolean) {
    // Try to get chats from Redis cache first
    const cacheKey = `user-chats:${userId}`;
    if (!resetCache) {
      const cachedChats = await this.redisService.get(cacheKey);
      if (cachedChats) {
        return cachedChats;
      }
    }

    // If not in cache, fetch from database
    const userChats = await this.chatModel
      .find({
        users: { $in: [new Types.ObjectId(userId)] },
      })
      .populate('users', 'userName');

    // Store in Redis with a TTL of 500 minutes (30000 seconds)
    await this.redisService.set(cacheKey, userChats, 30000);

    return userChats;
  }
}

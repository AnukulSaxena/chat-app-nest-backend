import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Schema, Types } from 'mongoose';
import { Chat } from 'src/schema/chat.schema';
import { createChatDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chat.name) private readonly chatModel: Model<Chat>,
  ) {}

  async createChat(chat: createChatDto) {
    const users = [new Types.ObjectId(chat.fromUserId), new Types.ObjectId(chat.toUserId)];
    const existingChat = await this.chatModel.findOne({
      users: { $all: users },
      isGroup: false,
    });
    if (existingChat) {
      throw new ConflictException(
        `A one-to-one chat between ${chat.fromUserId} and ${chat.toUserId} already exists`,
      );
    }

    const createdChat = await this.chatModel.create({
      users: users,
      isGroup: false,
    });
    return createdChat;
  }

  async getUserChats(userId: string) {
    const userChats = await this.chatModel.find({
      users: { $in: [new Types.ObjectId(userId)] },
    })
    .populate('users', 'userName');
    return userChats;
  }
}

import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { createChatDto, createGroupDto } from './dto/chat.dto';
import { ChatService } from './chat.service';
import { Types } from 'mongoose';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  converter(a: string) {
    return new Types.ObjectId(a);
  }

  @Post()
  async createChat(@Body() chat: createChatDto) {
    await this.chatService.createChat(
      [this.converter(chat.fromUserId), this.converter(chat.toUserId)],
      false,
    );
    return { message: 'Chat created successfully' };
  }

  @Post('group')
  async createGroup(@Body() chat: createGroupDto) {
    await this.chatService.createChat(
      chat.users.map((a) => this.converter(a)),
      true,
      chat.groupName,
    );
    return { message: 'Chat created successfully' };
  }

  @Get(':userId')
  async getUserChats(
    @Param('userId') userId: string,
    @Query('reset-cache') resetCache?: string,
  ) {
    
    const userChats = await this.chatService.getUserChats(userId, resetCache === "true");

    return { data: userChats };
  }
}

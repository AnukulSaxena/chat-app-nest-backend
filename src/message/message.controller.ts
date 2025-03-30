import { Controller, Get, Param } from '@nestjs/common';
import { MessageService } from './message.service';
import { Types } from 'mongoose';

@Controller('message')
export class MessageController {

    constructor(
        private readonly messageService: MessageService
    ){}

    @Get('chat/:chatId')
    async createRelationship(@Param('chatId') chatId: string) {
      console.log(chatId);
      const messages =
        await this.messageService.getChatMessages(new Types.ObjectId(chatId));
      return {
        data: messages,
        message: 'Message fetched successfully',
      };
    } 
  
}

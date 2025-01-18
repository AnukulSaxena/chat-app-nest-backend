import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { MessageService } from 'src/message/message.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from 'src/schema/message.schema';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { Chat, ChatSchema } from 'src/schema/chat.schema';

@Module({
   imports: [
      MongooseModule.forFeature([
      {
        name: Message.name,
        schema: MessageSchema,
      },
      {
        name: Chat.name,
        schema: ChatSchema
        ,
      }
    ])],
  providers: [ChatGateway, MessageService, ChatService],
  controllers: [ChatController]
})
export class ChatModule {}

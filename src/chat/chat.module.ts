import { Module } from '@nestjs/common';
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
        name: Chat.name,
        schema: ChatSchema
        ,
      }
    ])],
  providers: [ ChatService],
  controllers: [ChatController],
  exports: [ChatService]
})
export class ChatModule {}

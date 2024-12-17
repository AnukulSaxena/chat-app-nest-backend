import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { MessageService } from 'src/message/message.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from 'src/schema/message.schema';

@Module({
   imports: [
      MongooseModule.forFeature([
      {
        name: Message.name,
        schema: MessageSchema,
      },
    ])],
  providers: [ChatGateway, MessageService]
})
export class ChatModule {}

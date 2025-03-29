import { Module } from '@nestjs/common';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { ChatModule } from 'src/chat/chat.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from 'src/schema/message.schema';

@Module({
  imports: [ChatModule,
    MongooseModule.forFeature([{
      name: Message.name,
      schema: MessageSchema
    }])
  ],
  controllers: [MessageController],
  providers: [MessageService],
  exports:[MessageService]
})
export class MessageModule {}

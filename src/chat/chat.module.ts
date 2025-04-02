import { MiddlewareConsumer, Module } from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from 'src/schema/message.schema';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { Chat, ChatSchema } from 'src/schema/chat.schema';
import { AuthMiddleware } from 'src/auth/auth.middleware';
import { UserModule } from 'src/user/user.module';

@Module({
   imports: [

      MongooseModule.forFeature([
      {
        name: Chat.name,
        schema: ChatSchema
        ,
      },
    ])],
  providers: [ ChatService],
  controllers: [ChatController],
  exports: [ChatService]
})
export class ChatModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(ChatController)
  }
}

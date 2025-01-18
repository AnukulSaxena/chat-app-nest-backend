import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
import { MessageService } from './message/message.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from './schema/message.schema';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { RelationshipModule } from './relationship/relationship.module';
import { ChatAppGateway } from './chat-app/chat-app.gateway';
import { ChatAppModule } from './chat-app/chat-app.module';
import { MyRedisModule } from './my-redis/my-redis.module';
import { RedisModule } from 'nestjs-redis';
import { SessionService } from './session/session.service';
import { SessionModule } from './session/session.module';

@Module({
  imports: [ChatModule,  
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGO_URI),
    MongooseModule.forFeature([
    {
      name: Message.name,
      schema: MessageSchema,
    },
  ]),
    UserModule,
    RelationshipModule,
    ChatAppModule,
    MyRedisModule,
    SessionModule],
  controllers: [AppController],
  providers: [AppService, MessageService, ChatAppGateway],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
import { MessageService } from './message/message.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from './schema/message.schema';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { RelationshipModule } from './relationship/relationship.module';
import { ChatAppGateway } from './chat-app/chat-app.gateway';
import { ChatAppModule } from './chat-app/chat-app.module';
import { MyRedisModule } from './my-redis/my-redis.module';
import { SessionModule } from './session/session.module';
import { MessageModule } from './message/message.module';
import { BullModule } from '@nestjs/bull';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    ChatModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule], // JwtModule needs ConfigService to read secrets/expiry
      useFactory: async (configService: ConfigService) => ({
        // Use getOrThrow for required variables to fail fast if missing
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1d'), // Default if not set
        },
      }),
      inject: [ConfigService],
    }),
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
    SessionModule,
    MessageModule,
    BullModule.forRoot({ 
      redis: {
        host: 'localhost', 
        port: 6379,     
      },
    }),
    BullModule.registerQueue({ 
      name: 'chat-app', 
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

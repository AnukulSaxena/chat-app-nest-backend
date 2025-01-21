import { Module } from '@nestjs/common';
import { ChatAppGateway } from './chat-app.gateway';
import { ConfigService } from '@nestjs/config';
import { MyRedisService } from 'src/my-redis/my-redis.service';

@Module({
    providers: [ChatAppGateway, ConfigService, MyRedisService],
})
export class ChatAppModule {}

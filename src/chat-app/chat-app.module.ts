import { Module } from '@nestjs/common';
import { ChatAppGateway } from './chat-app.gateway';
import { ConfigService } from '@nestjs/config';
import { MyRedisService } from 'src/my-redis/my-redis.service';
import { MessageService } from 'src/message/message.service';
import { MessageModule } from 'src/message/message.module';
import { BullModule } from '@nestjs/bull';
import { ChatAppProcessor } from './chat-app.processor';
import { ChatModule } from 'src/chat/chat.module';
@Module({
    imports: [MessageModule, BullModule.registerQueue({ name: 'chat-app' }), ChatModule],
    providers: [ChatAppGateway, ConfigService, MyRedisService, ChatAppProcessor],
})
export class ChatAppModule {}

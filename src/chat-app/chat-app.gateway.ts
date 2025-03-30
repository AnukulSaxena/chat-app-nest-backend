import { Logger, UseFilters, OnModuleInit } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { WebsocketExceptionFilter } from './ws-exception.filter';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { parseJwtPayload } from 'src/auth/dto/token.dto';
import { MyRedisService } from 'src/my-redis/my-redis.service';
import { CreateMessageDto } from 'src/chat/dto/chat.dto';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bull';
import { Message } from 'src/schema/message.schema';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@UseFilters(new WebsocketExceptionFilter())
export class ChatAppGateway implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: MyRedisService,
    @InjectQueue('chat-app') private readonly chatAppQueue: Queue
  ) {}
  private readonly logger = new Logger(ChatAppGateway.name);

  @WebSocketServer()
  public server: Server;

  async onModuleInit() {
    await this.redisService.redis.del('valid_sockets'); // Clear the set on startup
    this.logger.log('Cleared stale socket IDs from Redis on startup.');
  }

  handleConnection(client: Socket) {
    console.log('client ----------- >> ', client.id);
    const token = client.handshake.auth?.token;
    if (!token) {
      this.logger.warn(`Unauthorized connection attempt: ${client.id}`);
      client.disconnect();
      return;
    }

    try {
      const payload = jwt.verify(token, this.configService.get('JWT_SECRET'));
      const parsedPayload = parseJwtPayload(payload);
      if (parsedPayload) {
        this.redisService.addSocketId(parsedPayload.userId, client.id);
        this.redisService.redis.sadd('valid_sockets', client.id);
        this.logger.log(
          `User ${parsedPayload.userId} connected with socketId ${client.id}`,
        );
        this.chatAppQueue.add('validate-user', { userId: parsedPayload.userId });
      }
    } catch (err) {
      this.logger.error(`Invalid token for client ${client.id}`);

      client.disconnect();
    }
  }

  @SubscribeMessage('message')
  async sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: CreateMessageDto,
  ) {
    this.chatAppQueue.add('handle-message', { socketId: client.id, data });
  }

  handleDisconnect(client: Socket) {
    this.redisService.removeSocketId(client.id);
    this.redisService.redis.srem('valid_sockets', client.id);
  }

  isValidSocket(socketId: string) {
    return this.server.sockets.sockets.has(socketId);
  }

  emitMessage(socketId: string, message: Message){
    this.server.to(socketId).emit('message', message);
  }

}

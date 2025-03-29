import { Logger, UseFilters, UnauthorizedException, OnModuleInit } from '@nestjs/common';
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
import { MessageService } from 'src/message/message.service';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bull';

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
    private readonly messageService: MessageService,
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
    // const sender = await this.redisService.getUserIdFromSocket(client.id);
    // console.log('sender', sender);
    // this.messageService.create({
    //   sender: new Types.ObjectId(`${sender}`),
    //   text: data.message,
    //   chat: new Types.ObjectId(`${data.chatId}`),
    // });
    const receiverSocketIds = await this.redisService.getSocketIdsForUser(
      data.receiver,
    );
    console.log('receiverSocketIds', receiverSocketIds);
    receiverSocketIds.forEach((receiverSocketId) => {
      console.log('sending to -> ', receiverSocketId);
      this.server.to(receiverSocketId).emit('message', data);
    });
  }

  handleDisconnect(client: Socket) {
    this.redisService.removeSocketId(client.id);
    this.redisService.redis.srem('valid_sockets', client.id);
  }

  isValidSocket(socketId: string) {
    return this.server.sockets.sockets.has(socketId);
  }

}

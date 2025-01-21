import { Logger, UseFilters, UnauthorizedException } from '@nestjs/common';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { WebsocketExceptionFilter } from './ws-exception.filter';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { parseJwtPayload } from 'src/auth/dto/token.dto';
import { MyRedisService } from 'src/my-redis/my-redis.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@UseFilters(new WebsocketExceptionFilter())
export class ChatAppGateway {

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: MyRedisService,
  ){}
  private readonly logger = new Logger(ChatAppGateway.name);
  public activeUsers = new Map<string, string>();

  @WebSocketServer()
  public server: Server;

  isJwtPayload(payload: any): payload is jwt.JwtPayload {
    return (
      typeof payload === 'object' &&
      'userName' in payload &&
      'sessionId' in payload &&
      'userId' in payload 
    );
  }

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    if (!token) {
      this.logger.warn(`Unauthorized connection attempt: ${client.id}`);
      client.disconnect();
      return;
    }

    try {
      const payload = jwt.verify(token, this.configService.get('JWT_SECRET'));
      const parsedPayload = parseJwtPayload(payload);
      console.log(" ------ > ",payload,  typeof payload) 
      if(parsedPayload){
      this.activeUsers.set(parsedPayload.userId, client.id);
      this.redisService.addSocketId(parsedPayload.userId, client.id);
      this.logger.log(`User ${parsedPayload.userId} connected with socketId ${client.id}`);
      }
    } catch (err) {
      this.logger.error(`Invalid token for client ${client.id}`);

      client.disconnect();
    }
  }

  @SubscribeMessage('join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { user: string },
  ) {
    console.log(data);
    const userId = [...this.activeUsers.entries()].find(
      ([, socketId]) => socketId === client.id,
    )?.[0];

    if (userId) {
      this.logger.log(`User ${userId} joined successfully.`);
      client.emit('joined', { message: 'Welcome to the chat!' });
    } else {
      client.disconnect(); // Disconnect if not authenticated
    }
  }

  @SubscribeMessage('message')
  sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { user: string; chat: string },
  ) {
    const userId = [...this.activeUsers.entries()].find(
      ([, socketId]) => socketId === client.id,
    )?.[0];

    if (userId) {
      this.logger.log(`Message from ${userId}: ${data.chat}`);
      this.server.emit('message', { user: userId, chat: data.chat }); // Broadcast to all clients
    } else {
      client.emit('error', { message: 'Unauthorized user.' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.redisService.removeSocketId(client.id);
    const userId = [...this.activeUsers.entries()].find(
      ([, socketId]) => socketId === client.id,
    )?.[0];

    if (userId) {
      this.activeUsers.delete(userId);
      console.log('active users', this.activeUsers);
      this.logger.log(`User ${userId} disconnected`);
    }
  }
}

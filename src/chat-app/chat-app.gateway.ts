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

  @WebSocketServer()
  public server: Server;


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
      if(parsedPayload){
      this.redisService.addSocketId(parsedPayload.userId, client.id);
      this.logger.log(`User ${parsedPayload.userId} connected with socketId ${client.id}`);
      }
    } catch (err) {
      this.logger.error(`Invalid token for client ${client.id}`);

      client.disconnect();
    }
  }

  @SubscribeMessage('message')
  sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { user: string; chat: string; message: string },
  ) {
    const userId = '';

    if (userId) {
      this.logger.log(`Message from ${userId}: ${data.chat}`); 
      this.server.emit('message', { user: userId, chat: data.chat }); 
    } else {
      client.emit('error', { message: 'Unauthorized user.' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.redisService.removeSocketId(client.id);
  }
}

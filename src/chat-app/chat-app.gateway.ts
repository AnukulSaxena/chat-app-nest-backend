import { Logger, UseFilters } from '@nestjs/common';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { WebsocketExceptionFilter } from './ws-exception.filter';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@UseFilters(new WebsocketExceptionFilter())
export class ChatAppGateway {
  private readonly logger = new Logger(ChatAppGateway.name);
  public activeUsers = new Map<string, string>();

  @WebSocketServer()
  public server: Server;

  handleConnection(client: any) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  @SubscribeMessage('join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { user: string },
  ) {
    console.log(data);
    if (data?.user) {
      this.activeUsers.set(data.user, client.id);
      console.log('active users', this.activeUsers);
      this.logger.log(`User ${data.user} connected with socketId ${client.id}`);
    } else {
      client.disconnect(); // Disconnect if userId is invalid
    }
  }

  handleDisconnect(client: any) {
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

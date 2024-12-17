import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessageService } from 'src/message/message.service';

@WebSocketGateway({
  cors: {
    origin: '*', // Allow all origins for development
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly messageService: MessageService
  ){

  }
  @WebSocketServer() server: Server;

  private activeUsers: Set<string> = new Set();

  // Triggered when a client connects
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  // Triggered when a client disconnects
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // Listen for a custom event, like sending a message
  @SubscribeMessage('sendMessage')
  handleSendMessage(client: Socket, payload: { user: string; text: string }) {
    console.log('Message received:', payload)
    this.messageService.create(payload)
    // Broadcast the message to all connected clients
    this.server.emit('receiveMessage', payload);
  }

  // Listen for a "typing" event
  @SubscribeMessage('typing')
  handleTyping(client: Socket, payload: { user: string }) {
    console.log(`${payload.user} is typing...`);
    client.broadcast.emit('userTyping', { user: payload.user });
  }
}

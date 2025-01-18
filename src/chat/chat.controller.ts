import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { createChatDto } from './dto/chat.dto';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
    constructor(
        private readonly chatService: ChatService,
    ){}

    @Post()
    async createChat(
        @Body() chat: createChatDto,
    ) {
        await this.chatService.createChat(chat);

        return { message: 'Chat created successfully' };
    }

    @Get(':userId')
    async getUserChats(
     @Param('userId') userId: string,
    ) {
        const userChats = await this.chatService.getUserChats(userId);

        return { data: userChats };
    }
}

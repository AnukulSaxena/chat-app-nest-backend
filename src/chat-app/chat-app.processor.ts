// src/audio/audio.processor.ts
import {
  Processor,
  Process,
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
} from '@nestjs/bull';
import { Job } from 'bullmq'; // Or 'bull'
import { Logger } from '@nestjs/common'; // Optional: for logging
import { MyRedisService } from 'src/my-redis/my-redis.service';
import { ChatAppGateway } from './chat-app.gateway';
import { CreateMessageDto } from 'src/chat/dto/chat.dto';
import { MessageService } from 'src/message/message.service';
import { Types } from 'mongoose';

@Processor('chat-app') // Decorator links this class to the 'audio' queue
export class ChatAppProcessor {
  private readonly logger = new Logger(ChatAppProcessor.name);

  constructor(
    private readonly redisService: MyRedisService,
    private readonly chatGateway: ChatAppGateway,
    private readonly messageService: MessageService,
  ) {}

  // Optional: Listen to queue events
  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(
      `Processing job ${job.id} of type ${job.name} with data ${JSON.stringify(job.data)}...`,
    );
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.log(
      `Job ${job.id} completed! Result: ${JSON.stringify(result)}`,
    );
  }

  @OnQueueFailed()
  onFailed(job: Job, err: Error) {
    this.logger.error(`Job ${job.id} failed! Error: ${err.message}`, err.stack);
  }

  // Process jobs with the name 'transcode'
  @Process('validate-user')
  async handleValidateUser(job: Job<{ userId: string }>) {
    console.log('job ---> ', job.data);
    const { userId } = job.data;
    this.logger.debug(`Start validating user ${userId}...`);

    const receiverSocketIds =
      await this.redisService.getSocketIdsForUser(userId);

    const validSockets =
      await this.redisService.redis.smembers('valid_sockets'); // Get all valid sockets

    for (const socketId of receiverSocketIds) {
      if (!validSockets.includes(socketId)) {
        console.log('removing socketId', socketId);
        await this.redisService.removeSocketId(socketId);
      }
    }
  }

  @Process('handle-message')
  async handleMessages(job: Job<{ socketId: string; data: CreateMessageDto }>) {
    const { socketId, data } = job.data;

    const sender = await this.redisService.getUserIdFromSocket(socketId);
    const message = await this.messageService.create({
      sender: new Types.ObjectId(`${sender}`),
      text: data.message,
      chat: new Types.ObjectId(`${data.chatId}`),
    });
    const receiverSocketIds = await this.redisService.getSocketIdsForUser(
      data.receiver,
    );
    console.log('receiverSocketIds', receiverSocketIds);
    receiverSocketIds.forEach((receiverSocketId) => {
      console.log('sending to -> ', receiverSocketId);
      this.chatGateway.emitMessage(receiverSocketId, message);
    });
  }

  // You can have multiple @Process decorators for different named jobs
  // @Process('compress')
  // async handleCompress(job: Job<unknown>) {
  //   this.logger.debug('Start compression...');
  //   await new Promise<void>(resolve => setTimeout(resolve, 2000));
  //   this.logger.debug('Compression finished.');
  // }

  // If you don't specify a name in @Process(), it becomes the default handler
  // for jobs added without a specific name.
  // @Process()
  // async handleDefault(job: Job<unknown>) {
  //   // ...
  // }
}

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './user.schema';
import { Chat } from './chat.schema';
import { z } from 'zod';

@Schema({ timestamps: true })
export class Message extends Document {
  @Prop({
    type: Types.ObjectId,
    ref: User.name, 
    required: true,
  })
  sender: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
  })
  text: string;

  @Prop({
    type: Types.ObjectId,
    ref: Chat.name, 
    required: true,
  })
  chat: Types.ObjectId;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({chat: 1})


const mongoIdRegex = /^[a-fA-F0-9]{24}$/;

export const MessageZodSchema = z.object({
  sender: z
    .string()
    .regex(mongoIdRegex, "Sender must be a valid MongoDB ObjectId"),
  text: z.string().min(1, "Message text is required"),
  chat: z
    .string()
    .regex(mongoIdRegex, "Chat must be a valid MongoDB ObjectId"),
});

export type MessageType = z.infer<typeof MessageZodSchema>;
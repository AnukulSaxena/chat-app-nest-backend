import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './user.schema';
import { Chat } from './chat.schema';

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
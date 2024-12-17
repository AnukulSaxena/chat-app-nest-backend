import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Message extends Document {
  @Prop({
    type: String,
    required: true,
  })
  user: string;

  @Prop({
    type: String,
    required: true,
  })
  text: string;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
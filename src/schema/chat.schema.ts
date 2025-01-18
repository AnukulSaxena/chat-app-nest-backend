import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Chat extends Document {
  @Prop({
    type: Boolean,
    required: true,
  })
  isGroup: boolean;

  @Prop({
    type: [Types.ObjectId],
    ref: 'User',
    required: true,
  })
  users: Types.ObjectId[];

  @Prop({
    type: String,
    required:false
  })
  groupName: String
}

export const ChatSchema = SchemaFactory.createForClass(Chat);

ChatSchema.index({ users: 1 });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './user.schema';

@Schema({ timestamps: true })
export class Chat extends Document {
  @Prop({
    type: Boolean,
    required: true,
  })
  isGroup: boolean;

  @Prop({
    type: [Types.ObjectId],
    ref: User.name,
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

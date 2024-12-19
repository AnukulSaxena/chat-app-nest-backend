import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum RelationshipStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  BlockedTo = 'blocked_to',
  BlockedFrom = 'blocked_from',
  BlockedBoth = 'blocked_both',
}

@Schema({ timestamps: true })
export class Relationship extends Document {
  @Prop({
    type: Types.ObjectId,
    ref: 'User', 
    required: true,
  })
  fromUserId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User', 
    required: true,
  })
  toUserId: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(RelationshipStatus), 
    default: RelationshipStatus.Pending,
    required: true,
  })
  status: RelationshipStatus;  
}

export const RelationshipSchema = SchemaFactory.createForClass(Relationship);


RelationshipSchema.pre('save' , function (next) {
  if( typeof this.fromUserId === 'string')
    this.fromUserId = new Types.ObjectId(`${this.fromUserId}`);

  if( typeof this.toUserId === 'string')
    this.toUserId = new Types.ObjectId(`${this.toUserId}`);

  next();
})

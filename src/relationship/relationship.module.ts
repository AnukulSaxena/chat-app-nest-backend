import { Module } from '@nestjs/common';
import { RelationshipController } from './relationship.controller';
import { RelationshipService } from './relationship.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Relationship,
  RelationshipSchema,
} from 'src/schema/relationship.schema';

@Module({
  imports: [
    MongooseModule.forFeature(
      [
        {
          name: Relationship.name,
          schema: RelationshipSchema,
        }
      ]
    ),
  ],
  controllers: [RelationshipController],
  providers: [RelationshipService],
})
export class RelationshipModule {}

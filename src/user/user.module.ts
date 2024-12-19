import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schema/user.schema';
import { RelationshipModule } from 'src/relationship/relationship.module';
import {
  Relationship,
  RelationshipSchema,
} from 'src/schema/relationship.schema';
import { RelationshipService } from 'src/relationship/relationship.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Relationship.name, schema: RelationshipSchema },
    ]),
    RelationshipModule,
  ],
  providers: [UserService, RelationshipService],
  controllers: [UserController],
})
export class UserModule {}

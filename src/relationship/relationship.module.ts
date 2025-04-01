import { MiddlewareConsumer, Module } from '@nestjs/common';
import { RelationshipController } from './relationship.controller';
import { RelationshipService } from './relationship.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Relationship,
  RelationshipSchema,
} from 'src/schema/relationship.schema';
import { AuthMiddleware } from 'src/auth/auth.middleware';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

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
    JwtModule,
    ConfigModule
  ],
  controllers: [RelationshipController],
  providers: [RelationshipService],
  exports: [RelationshipService]
})
export class RelationshipModule {
  configure(consumer: MiddlewareConsumer){
    consumer.apply(AuthMiddleware).forRoutes(RelationshipController);
  }
}

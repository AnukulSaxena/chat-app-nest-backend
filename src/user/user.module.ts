import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schema/user.schema';
import { RelationshipModule } from 'src/relationship/relationship.module';
import { SessionModule } from 'src/session/session.module';
import { ConfigService } from '@nestjs/config';
import { AuthMiddleware } from 'src/auth/auth.middleware';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    RelationshipModule,
    SessionModule,
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: 'user', method: RequestMethod.POST },
        {
          path: 'user/login',
          method: RequestMethod.POST,
        },
        {
          path: 'user/logout',
          method: RequestMethod.POST,
        },
        {
          path: 'user/refresh-token',
          method: RequestMethod.POST,
        },
      )
      .forRoutes(UserController);
  }
}

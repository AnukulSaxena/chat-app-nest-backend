import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { MyRedisService } from 'src/my-redis/my-redis.service';
import { SessionService } from './session.service';
import { MyRedisModule } from 'src/my-redis/my-redis.module';

@Module({
    imports:[
            MyRedisModule
    ],
    providers:[SessionService,ConfigService, JwtService, MyRedisService],
    exports:[SessionService]
})
export class SessionModule {

}

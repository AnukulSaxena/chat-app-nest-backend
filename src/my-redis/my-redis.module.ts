import { Module } from '@nestjs/common';
import { RedisModule } from 'nestjs-redis';
import { MyRedisService } from './my-redis.service';

@Module({
  

  providers: [MyRedisService],
  exports: [MyRedisService]
})
export class MyRedisModule {}

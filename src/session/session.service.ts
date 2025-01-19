import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { MyRedisService } from 'src/my-redis/my-redis.service';
import { User } from 'src/schema/user.schema';
import { UserMetaData } from 'src/user/user.controller';
import { IBrowser, IDevice } from 'ua-parser-js';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SessionService {
  constructor(
    private readonly redisService: MyRedisService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async validateRefreshToken(
    userName: string,
    sessionId: string,
    refreshToken: string,
  ): Promise<boolean> {
    const storedToken = await this.redisService.get(
      `user:${userName}:sessions:${sessionId}`,
    );
    return storedToken && storedToken.refreshToken === refreshToken;
  }

  async revokeSession(data: {
    userName: string;
    sessionId: string;
  }): Promise<void> {
    const { userName, sessionId } = data;
    await this.redisService.delete(`user:${userName}:sessions:${sessionId}`);
  }

  async revokeAllSessions(userName: string): Promise<void> {
    const sessionKeys = await this.redisService.keys(
      `user:${userName}:sessions:*`,
    );
    for (const key of sessionKeys) {
      await this.redisService.delete(key);
    }
  }

  generateAccessToken(userName: string, sessionId: string, userId: string) {
    const accessToken = this.jwtService.sign(
      { userName, sessionId, userId },
      { secret: this.configService.get('JWT_SECRET'), expiresIn: '15s' },
    );

    return accessToken;
  }

  async generateTokens(
    user: User,
    userData: UserMetaData,
  ): Promise<{ accessToken: string; refreshToken: string; sessionId: string }> {
    const { userName, _id: userId } = user;
    if (!userName || !userId) {
      throw new InternalServerErrorException(
        'username and userId is required in order to generate token',
      );
    }
    const sessionId = uuidv4();
    const refreshToken = uuidv4();

    await this.redisService.set(
      `user:${userName}:sessions:${sessionId}`,
      { refreshToken, device: userData, createdAt: new Date().toISOString() },
      7 * 24 * 60 * 60,
    );

    const accessToken = this.generateAccessToken(
      userName,
      sessionId,
      userId.toString(),
    );

    return { accessToken, refreshToken, sessionId };
  }

  async refreshRedisToken(
    userId: string,
    userName: string,
    sessionId: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshToken = uuidv4();
    const storedToken = await this.redisService.get(
      `user:${userName}:sessions:${sessionId}`,
    );

    await this.redisService.set(
      `user:${userName}:sessions:${sessionId}`,
      { refreshToken, device: storedToken.device, createdAt: storedToken.createdAt },
      7 * 24 * 60 * 60,
    );

    const accessToken = this.generateAccessToken(userName, sessionId, userId);

    return { accessToken, refreshToken };
  }
}

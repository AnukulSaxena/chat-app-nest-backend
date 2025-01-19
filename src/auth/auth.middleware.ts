import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NextFunction, Request, Response } from 'express';
import { UAParser } from 'ua-parser-js';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.split(' ')[1];
    }
    return req.cookies?.accessToken || null;
  }

  private verifyToken(token: string): any {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  use(req: Request, res: Response, next: NextFunction) {
    const token = this.extractToken(req);
    if (!token) {
      throw new UnauthorizedException('Token is Required');
    }

    const value = this.verifyToken(token);
    if (!value.userName || !value.userId) {
      throw new UnauthorizedException(
        'userName and userId should be present in the token',
      );
    }

    req['userName'] = value.userName;
    req['userId'] = value.userId;
    next();
  }
}

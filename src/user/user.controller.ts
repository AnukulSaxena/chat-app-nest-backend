import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { UserService } from './user.service';
import { LogOutDTO, RefreshTokenDTO, UserDto } from './dto/user.dto';
import { ConfigService } from '@nestjs/config';
import { UserId, UserName } from 'src/decorator/custom-decorators';
import { UAParser } from 'ua-parser-js';

export type UserMetaData = {
  type: string; // Device type, e.g., 'mobile', 'desktop', or 'unknown'
  browser: string; // Browser name, e.g., 'Chrome', 'Firefox'
  os: string; // Operating system name, e.g., 'Windows', 'Android'
};

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  async createUser(@Body() body: UserDto) {
    const user = await this.userService.createUser(body);
    if (!user) {
      throw new InternalServerErrorException('User Creation Failed');
    }

    return { data: user, message: 'User Created Successfully' };
  }

  @Post('login')
  async loginUser(
    @Body() body: UserDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const userAgent = req.headers['user-agent'];
    const { browser, cpu, device, os } = UAParser(userAgent);

    const userMetaData = {
      type: device.type || 'unknown',
      browser: browser.name,
      os: os.name,
    };
    const metadata = await this.userService.loginUser(body, userMetaData);
    res.cookie('accessToken', metadata.accessToken, {
      httpOnly: true,
      secure: this.configService.get('NEST_ENV') === 'production',
      sameSite: 'strict',
      maxAge: 3600000,
    });

    res.cookie('refreshToken', metadata.refreshToken, {
      httpOnly: true,
      secure: this.configService.get('NEST_ENV') === 'production',
      sameSite: 'strict',
      maxAge: 604800000,
      
    });

    res.send({ data: metadata, message: 'User Logged In Successfully' });
  }

  @Post('logout')
  async logout(@Body() body: LogOutDTO, @Res() res: Response) {
    await this.userService.logout(body);
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: this.configService.get('NEST_ENV') === 'production',
      sameSite: 'strict',
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: this.configService.get('NEST_ENV') === 'production',
      sameSite: 'strict',
    });

    res.send({
      data: {},
      success: true,
      message: 'User Logged Out Successfully',
    });
  }

  @Get()
  async getUsers(
    @Query() query: { ownerId: string }, // ID of the current user
    @UserId() userId: string,
  ) {
    const users = await this.userService.getUsers(userId);
    if (!users) {
      throw new InternalServerErrorException('User Fetch Failed');
    }
    return { data: users, message: 'User Fetched Successfully' };
  }

  @Get(':id')
  async getuser(@Param('id') id: string) {
    const user = await this.userService.getuser(id);
    if (!user) {
      throw new InternalServerErrorException('User Fetch Failed');
    }
    return { data: user, message: 'User Fetched Successfully' };
  }

  @Post('refresh-token')
  async refreshToken(@Body() body: RefreshTokenDTO, @Res() res: Response) {
    const { refreshToken, accessToken } =
      await this.userService.refreshToken(body);
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: this.configService.get('NEST_ENV') === 'production',
      sameSite: 'strict',
      maxAge: 3600000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: this.configService.get('NEST_ENV') === 'production',
      sameSite: 'strict',
      maxAge: 604800000,
    });

    res.send({
      data: { refreshToken, accessToken },
      message: 'Token Refreshed Successfully',
      success: true,
    });
  }
}

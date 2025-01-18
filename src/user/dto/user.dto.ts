import { IsNotEmpty, IsString } from 'class-validator';

export class UserDto {

    @IsString()
    @IsNotEmpty()
    userName: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}

export class RefreshTokenDTO {

    @IsString()
    @IsNotEmpty()
    refreshToken: string;

    @IsString()
    @IsNotEmpty()
    sessionId: string;

    @IsString()
    @IsNotEmpty()
    userId: string;

    @IsString()
    @IsNotEmpty()
    userName: string;
}
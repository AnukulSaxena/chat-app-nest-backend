import { IsNotEmpty, IsString } from 'class-validator';

export class UserDto {

    @IsString()
    @IsNotEmpty()
    userName: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}
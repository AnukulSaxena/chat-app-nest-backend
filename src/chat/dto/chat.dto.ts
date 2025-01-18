import { IsNotEmpty, IsString } from "class-validator";


export class createChatDto {
  @IsString()
  @IsNotEmpty()
  fromUserId: string;

  @IsString()
  @IsNotEmpty()
  toUserId: string;
}
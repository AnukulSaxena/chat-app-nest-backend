import { IsArray, IsBoolean, IsMongoId, IsNotEmpty, IsOptional, IsString } from "class-validator";


export class createChatDto {
  @IsString()
  @IsNotEmpty()
  fromUserId: string;

  @IsString()
  @IsNotEmpty()
  toUserId: string;
}

export class createGroupDto {
  
  @IsString()
  @IsNotEmpty()
  groupName: string;

  @IsArray()
  @IsMongoId({each: true})
  users: string[];
}

export class CreateMessageDto {

  @IsMongoId()
  @IsOptional()
  receiver?: string;

  @IsBoolean()
  @IsNotEmpty()
  isGroup: boolean;

  @IsMongoId()
  @IsNotEmpty()
  chatId: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}

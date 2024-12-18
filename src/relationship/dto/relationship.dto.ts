import { IsNotEmpty, IsString } from "class-validator";


export class RelationshipDto {
    @IsString()
    @IsNotEmpty()
    fromUserId: string;

    @IsString()
    @IsNotEmpty()
    toUserId: string;
}
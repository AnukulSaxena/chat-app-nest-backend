import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class RelationshipDto {
  @IsString()
  @IsNotEmpty()
  fromUserId: string;

  @IsString()
  @IsNotEmpty()
  toUserId: string;
}

export enum updateRelationShipStatus {
  Confirmed = 'confirmed',
  Rejected = 'rejected',
}

export class UpdateRelationDTO {

  @IsNotEmpty()
  @IsString()
  @IsEnum(updateRelationShipStatus)
  status: updateRelationShipStatus;
}

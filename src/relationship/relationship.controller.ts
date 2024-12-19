import { Body, Controller, Param, Patch, Post } from '@nestjs/common';
import { RelationshipDto, UpdateRelationDTO } from './dto/relationship.dto';
import { RelationshipService } from './relationship.service';

@Controller('relationship')
export class RelationshipController {
  constructor(private readonly relationshipService: RelationshipService) {}

  @Post()
  async createRelationship(@Body() relationship: RelationshipDto) {
    console.log(relationship);
    const createdRelationship =
      await this.relationshipService.createRelationship(relationship);
    return {
      data: createdRelationship,
      message: 'Relationship Created Successfully',
    };
  } 

  @Patch(':userId')
  async updateRelationShipStatus(
    @Body() body: UpdateRelationDTO,
    @Param('userId') userId: string,
  ) {
    const { status } = body;
    await this.relationshipService.updateRelationShip(userId, status);
    return { message: 'Relationship status updated successfully' };
  }
}

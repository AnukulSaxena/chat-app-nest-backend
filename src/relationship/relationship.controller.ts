import { Body, Controller, Post } from '@nestjs/common';
import { RelationshipDto } from './dto/relationship.dto';
import { RelationshipService } from './relationship.service';

@Controller('relationship')
export class RelationshipController {
    constructor(
        private readonly relationshipService: RelationshipService
    ) {}

    @Post()
    async createRelationship(
        @Body() relationship: RelationshipDto
    ) {
       const createdRelationship = await this.relationshipService.createRelationship(relationship);
       return { data: createdRelationship, message: 'Relationship Created Successfully' };
    }
}

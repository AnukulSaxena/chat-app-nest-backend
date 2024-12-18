import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Relationship } from 'src/schema/relationship.schema';
import { RelationshipDto } from './dto/relationship.dto';

@Injectable()
export class RelationshipService {
    constructor(
        @InjectModel(Relationship.name) private relationshipModel: Model<Relationship>,
    ){}


    async createRelationship(relationship: RelationshipDto): Promise<Relationship> {
        const existingRelationship = await this.relationshipModel.findOne({ fromUserId: relationship.fromUserId, toUserId: relationship.toUserId }).exec();
        if (existingRelationship) {
            throw new ConflictException('Relationship already exists');
        }

        const createdRelationship = await this.relationshipModel.create(relationship);
        return createdRelationship;

    }
}

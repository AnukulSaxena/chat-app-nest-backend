import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import {
  Relationship,
  RelationshipStatus,
} from 'src/schema/relationship.schema';
import {
  RelationshipDto,
  updateRelationShipStatus,
} from './dto/relationship.dto';

@Injectable()
export class RelationshipService {
  constructor(
    @InjectModel(Relationship.name)
    private relationshipModel: Model<Relationship>,
  ) {}

  async createRelationship(
    relationship: RelationshipDto,
  ): Promise<Relationship> {
    const existingRelationship = await this.relationshipModel
      .findOne({
        fromUserId: new Types.ObjectId(relationship.fromUserId),
        toUserId: new Types.ObjectId(relationship.toUserId),
      })
      .exec();

    if (existingRelationship) {
      throw new ConflictException('Relationship already exists');
    }

    const createdRelationship =
      await this.relationshipModel.create(relationship);
    return createdRelationship;
  }

  async updateRelationShip(
    relationId: string,
    status: updateRelationShipStatus,
  ): Promise<void> {
    const relationship = await this.relationshipModel.findById(relationId);

    if (!relationship) {
      throw new NotFoundException('Relationship not found');
    }

    if (status === updateRelationShipStatus.Confirmed) {
      relationship.status = RelationshipStatus.Confirmed;
      await relationship.save();
    } else if (status === updateRelationShipStatus.Rejected) {
      await this.relationshipModel.findByIdAndDelete(relationId);
    }
  }

  async getRelationShips(ownerId: string): Promise<Relationship[]> {
    return await this.relationshipModel.find({
      $or: [
        { fromUserId: new Types.ObjectId(`${ownerId}`) },
        { toUserId: new Types.ObjectId(`${ownerId}`) },
      ],
    });
  }

  async getFriends(
    ownerId: Types.ObjectId,
  ): Promise<{ id: Types.ObjectId; userName: string }[]> {
    const pipeline: PipelineStage[] = [
      {
        $match: {
          status: 'confirmed',
        },
      },
      {
        $facet: {
          from: [
            {
              $match: {
                fromUserId: ownerId,
              },
            },
            {
              $lookup: {
                from: 'users',
                localField: 'toUserId',
                foreignField: '_id',
                as: 'toDetails',
              },
            },
            {
              $unwind: {
                path: '$toDetails',
                preserveNullAndEmptyArrays: false,
              },
            },
            {
              $project: {
                id: '$toDetails._id',
                userName: '$toDetails.userName',
              },
            },
          ],
          to: [
            {
              $match: {
                toUserId: ownerId,
              },
            },
            {
              $lookup: {
                from: 'users',
                localField: 'fromUserId',
                foreignField: '_id',
                as: 'fromDetails',
              },
            },
            {
              $unwind: {
                path: '$fromDetails',
                preserveNullAndEmptyArrays: false,
              },
            },
            {
              $project: {
                id: '$fromDetails._id',
                userName: '$fromDetails.userName',
              },
            },
          ],
        },
      },
      {
        $project: {
          mergedUsers: {
            $concatArrays: ['$from', '$to'],
          },
        },
      },
      {
        $unwind: '$mergedUsers',
      },
      {
        $replaceRoot: {
          newRoot: '$mergedUsers',
        },
      },
    ];

    const result = await this.relationshipModel.aggregate(pipeline).exec();
    console.log(result);

    return result;
  }
}

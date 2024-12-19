import {
  Injectable,
  NotFoundException,
  PreconditionFailedException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/schema/user.schema';
import { UserDto } from './dto/user.dto';
import { RelationshipService } from 'src/relationship/relationship.service';
import { RelationshipStatus } from 'src/schema/relationship.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly relationshipService: RelationshipService,
  ) {}

  async createUser(user: {
    userName: string;
    password: string;
  }): Promise<User | null> {
    const existingUser = await this.userModel
      .findOne({ userName: user.userName })
      .exec();
    if (existingUser) {
      throw new PreconditionFailedException('User already exists');
    }

    const newUser = await this.userModel.create(user);
    return newUser;
  }

  async getUsers(
    ownerId: string, // ID of the current user
    page: number = 1, // Page number for pagination
    limit: number = 10, // Number of users per page
  ): Promise<any> {
    const skip = (page - 1) * limit;

    // Fetch users excluding the owner
    const users = await this.userModel
      .find({ _id: { $ne: ownerId } }) // Exclude the owner
      .skip(skip)
      .limit(limit)
      .exec();

    const relationships = await this.relationshipService.getRelationShips(ownerId);

    const relationshipMap = new Map<string, string>();

    relationships.forEach((relation) => {
      if (relation.fromUserId.toString() === ownerId) {
        if (relation.status === RelationshipStatus.Pending) {
          relationshipMap.set(relation.toUserId.toString(), 'sentRequest');
        } else if (relation.status === RelationshipStatus.Confirmed) {
          relationshipMap.set(relation.toUserId.toString(), 'friend');
        }
      } else if (relation.toUserId.toString() === ownerId) {
        if (relation.status === RelationshipStatus.Pending) {
          relationshipMap.set(
            relation.fromUserId.toString(),
            'receivedRequest',
          );
        } else if (relation.status === RelationshipStatus.Confirmed) {
          relationshipMap.set(relation.fromUserId.toString(), 'friend');
        }
      }
    });

    const usersWithRelationships = users.map((user) => {
      const relationshipStatus =
        relationshipMap.get(user._id.toString()) || 'none';
      return {
        ...user.toObject(),
        relationshipStatus,
      };
    });

    return {
      users: usersWithRelationships,
      pagination: {
        page,
        limit,
        totalPages: await this.userModel.countDocuments({ _id: { $ne: ownerId } }),
      },
    };
  }

  async getuser(id: string): Promise<User | null> {
    const user = await this.userModel.findById(id).exec();

    return user;
  }

  async loginUser(user: UserDto) {
    const existingUser = await this.userModel
      .findOne({ userName: user.userName })
      .exec();
    if (!existingUser) {
      throw new NotFoundException('User does not exist');
    }

    if (existingUser.password !== user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return existingUser;
  }
}

import {
  Injectable,
  NotFoundException,
  PreconditionFailedException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/schema/user.schema';
import { LogOutDTO, RefreshTokenDTO, UserDto } from './dto/user.dto';
import { RelationshipService } from 'src/relationship/relationship.service';
import { RelationshipStatus } from 'src/schema/relationship.schema';
import { SessionService } from 'src/session/session.service';
import { UserMetaData } from './user.controller';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly relationshipService: RelationshipService,
    private readonly sessionService: SessionService,
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

    const relationships =
      await this.relationshipService.getRelationShips(ownerId);

    const relationshipMap = new Map<
      string,
      { status: string; relationId: string }
    >();

    relationships.forEach((relation) => {
      if (relation.fromUserId.toString() === ownerId) {
        if (relation.status === RelationshipStatus.Pending) {
          relationshipMap.set(relation.toUserId.toString(), {
            status: 'sentRequest',
            relationId: relation._id.toString(),
          });
        } else if (relation.status === RelationshipStatus.Confirmed) {
          relationshipMap.set(relation.toUserId.toString(), {
            status: 'friend',
            relationId: relation._id.toString(),
          });
        }
      } else if (relation.toUserId.toString() === ownerId) {
        if (relation.status === RelationshipStatus.Pending) {
          relationshipMap.set(relation.fromUserId.toString(), {
            status: 'receivedRequest',
            relationId: relation._id.toString(),
          });
        } else if (relation.status === RelationshipStatus.Confirmed) {
          relationshipMap.set(relation.fromUserId.toString(), {
            status: 'friend',
            relationId: relation._id.toString(),
          });
        }
      }
    });

    const usersWithRelationships = users.map((user) => {
      const relationship = relationshipMap.get(user._id.toString()) || {
        status: 'none',
        relationId: '',
      };
      return {
        ...user.toObject(),
        relationshipStatus: relationship.status,
        relationId: relationship.relationId,
      };
    });

    return {
      users: usersWithRelationships,
      pagination: {
        page,
        limit,
        totalPages: await this.userModel.countDocuments({
          _id: { $ne: ownerId },
        }),
      },
    };
  }

  async getuser(id: string): Promise<User | null> {
    const user = await this.userModel.findById(id).exec();

    return user;
  }

  async loginUser(user: UserDto, userData: UserMetaData) {
    const existingUser = await this.userModel
      .findOne({ userName: user.userName })
      .exec();
    if (!existingUser) {
      throw new NotFoundException('User does not exist');
    }

    if (existingUser.password !== user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { accessToken, refreshToken, sessionId } =
      await this.sessionService.generateTokens(existingUser, userData);
    return { accessToken, refreshToken, user: existingUser, sessionId };
  }

  async refreshToken(data: RefreshTokenDTO) {
    const isValid = await this.sessionService.validateRefreshToken(
      data.userName,
      data.sessionId,
      data.refreshToken,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid Refresh Token');
    }

    return await this.sessionService.refreshRedisToken(
      data.userId,
      data.userName,
      data.sessionId,
    );
  }

  async logout(data:LogOutDTO){

    await this.sessionService.revokeSession(data);

  }
}

import { Injectable, NotFoundException, PreconditionFailedException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/schema/user.schema';
import { UserDto } from './dto/user.dto';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async createUser(user: {
    userName: string;
    password: string;
  }): Promise<User | null> {

    const existingUser = await this.userModel.findOne({ userName: user.userName }).exec();
    if (existingUser) {
      throw new PreconditionFailedException('User already exists');
    }

    const newUser = await this.userModel.create(user);
    return newUser;
  }

  async getUsers(): Promise<User[]> {
    const users = await this.userModel.find().exec();
    return users;
  }

  async getuser(id: string): Promise<User | null> {
    const user = await this.userModel.findById(id).exec();
    
    return user;
  }

  async loginUser(user:UserDto ) {
    const existingUser = await this.userModel.findOne({ userName: user.userName }).exec();
    if (!existingUser) {
      throw new NotFoundException('User does not exist');
    }

    if (existingUser.password !== user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return existingUser;
  }

  
}

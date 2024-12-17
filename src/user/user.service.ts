import { Injectable, PreconditionFailedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/schema/user.schema';

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

  
}

import { Body, Controller, Get, InternalServerErrorException, Param, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { UserDto } from './dto/user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createUser(@Body() body: UserDto) {
    const user = await this.userService.createUser(body);
    if(!user){
        throw new InternalServerErrorException('User Creation Failed');
    }

    return{data: user, message: 'User Created Successfully'}
    
  }

  @Get()
  async getUsers() {
    const users =  await this.userService.getUsers();
    if(!users){
        throw new InternalServerErrorException('User Fetch Failed');
    }
    return{data: users, message: 'User Fetched Successfully'}
    
  }

  @Get(':id')
  async getuser(
    @Param('id') id: string
  ){
    const user = await this.userService.getuser(id);
    if(!user){
        throw new InternalServerErrorException('User Fetch Failed');
    }
    return{data: user, message: 'User Fetched Successfully'}
  }
}

import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  NotFoundException,
  Session,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { CreateUserDto } from './dtos/create-user.dto';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dtos/update-user.dto';
import { Serialize } from '../interceptors/serialize.interceptor';
import { UserDto } from './dtos/user.dto';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from './user.entity';
import { AuthGuard } from '../guards/auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { BossGuard } from '../guards/boss.guard';

@Controller('auth')
@Serialize(UserDto)
export class UsersController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
  ) {}

  private async checkBoss(bossId) {
    const boss = await this.usersService.findOne(bossId);

    if (!boss) {
      throw new NotFoundException(`User with id ${bossId} does not exist`);
    }

    if (!boss.isBoss) {
      try {
        await this.usersService.update(boss.id, { isBoss: true });
      } catch (e) {
        throw new BadRequestException(`Update of user ${boss.id} was failed.`);
      }
    }
  }

  @Post('/signup')
  async createUser(@Body() body: CreateUserDto, @Session() session: any) {
    if (!body.isAdmin) {
      await this.checkBoss(body.bossId);
    }

    const user = await this.authService.signup(
      body.email,
      body.password,
      body.bossId,
      body.isAdmin,
    );

    session.userId = user.id;
    return user;
  }

  @Post('/signin')
  async signin(@Body() body: CreateUserDto, @Session() session: any) {
    const user = await this.authService.signin(body.email, body.password);

    session.userId = user.id;
    return user;
  }

  @Get('/me')
  @UseGuards(AuthGuard)
  authorizeMe(@CurrentUser() user: User) {
    return user;
  }

  @Post('/signout')
  @UseGuards(AuthGuard)
  signout(@Session() session: any) {
    session.userId = null;
  }

  @Get('/:id')
  @UseGuards(AdminGuard)
  async findUser(@Param('id') id: string) {
    const user = await this.usersService.findOne(parseInt(id));
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  @Get()
  @UseGuards(BossGuard)
  async findAllUsers(@Session() session: any) {
    const currentUser = await this.usersService.findOne(session.userId);

    if (currentUser.isAdmin) {
      return this.usersService.find();
    } else {
      return this.usersService.findByBossId(currentUser);
    }
  }

  @Patch('/:id')
  @UseGuards(BossGuard)
  async updateUser(
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
    @Session() session: any,
  ) {
    const user = await this.usersService.findOne(parseInt(id));
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.bossId !== session.userId)
      throw new BadRequestException('You are not a boss of chosen user.');

    await this.checkBoss(body.bossId);

    return this.usersService.update(parseInt(id), body);
  }
}

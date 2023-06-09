import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthService } from './auth.service';
import { User } from './user.entity';
import { NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dtos/create-user.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let fakeUsersService: Partial<UsersService>;
  let fakeAuthservice: Partial<AuthService>;

  beforeEach(async () => {
    fakeUsersService = {
      findOne: (id: number) => {
        return Promise.resolve({
          id,
          email: 'qqq@gmail.com',
          password: 'qqqq',
        } as User);
      },
      find: () => {
        return Promise.resolve([
          { id: 1, email: 'qqq@gmail.com', password: 'qqq' } as User,
        ]);
      },
      findByBossId: () => {
        return Promise.resolve([
          { id: 2, email: 'qqq@gmail.com', password: 'qqq' } as User,
        ]);
      },
      // remove: () => {},
      // update: () => {},
    };
    fakeAuthservice = {
      // signup: () => {},
      signin: (email: string, password: string) => {
        return Promise.resolve({ id: 1, email, password } as User);
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: fakeUsersService,
        },
        {
          provide: AuthService,
          useValue: fakeAuthservice,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAllUsers returns list of users', async () => {
    const users = await controller.findAllUsers({ userId: 1 });
    expect(users.length).toEqual(1);
    expect(users[0].email).toEqual('qqq@gmail.com');
  });

  it('findUser returns a user by given id', async () => {
    const user = await controller.findUser('1');
    expect(user).toBeDefined();
  });

  it('findUser throws an error if user with given id is not found', async () => {
    fakeUsersService.findOne = () => null;
    await expect(controller.findUser('1')).rejects.toThrow(NotFoundException);
  });

  it('signin updates session and returns user', async () => {
    const session = { userId: 0 };
    const user = await controller.signin(
      {
        email: 'qqq@gmail.com',
        password: 'qqq',
      } as CreateUserDto,
      session,
    );

    expect(user.id).toEqual(1);
    expect(session.userId).toEqual(1);
  });
});

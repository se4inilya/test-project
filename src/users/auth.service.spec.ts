import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { AuthService } from './auth.service';
import { User } from './user.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;

  beforeEach(async () => {
    const users: User[] = [];
    fakeUsersService = {
      find: () => {
        return Promise.resolve(users);
      },
      create: (email: string, password: string) => {
        const user = {
          id: Math.floor(Math.random() * 9999),
          email,
          password,
        } as User;

        users.push(user);
        return Promise.resolve(user);
      },
      findByEmail: (email: string) => {
        const filteredUsers = users.filter((user) => user.email === email);
        return Promise.resolve(filteredUsers);
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: fakeUsersService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a new user with salted and hashed password', async () => {
    const user = await service.signup('qqq@gmail.com', 'qwerty', 1, false);

    expect(user.password).not.toEqual('qwerty');
    const [salt, hash] = user.password.split('.');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  it('throws an error if user signs up with email that is in use', async () => {
    await service.signup('asdf@asdf.com', 'laskdjf', 1, false);
    await expect(
      service.signup('asdf@asdf.com', 'asdf', 1, false),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws if signin is called with an unused email', async () => {
    await expect(
      service.signin('asdflkj@asdlfkj.com', 'passdflkj'),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws if an invalid password is provided', async () => {
    await service.signup('asdf@asdf.com', 'laskdjf', 1, false);

    await expect(service.signin('asdf@asdf.com', 'passowrd')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('returns user when correct creds are given ', async () => {
    await service.signup('asdf@asdf.com', 'laskdjf', 1, false);
    const user = await service.signin('asdf@asdf.com', 'laskdjf');

    expect(user).toBeDefined();
  });
});

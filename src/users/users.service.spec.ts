import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let repositoryMock: any;

  beforeEach(async () => {
    repositoryMock = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      findOneBy: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: repositoryMock,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user', async () => {
      const user = {
        email: 'test@example.com',
        password: 'password',
        bossId: 1,
      };
      repositoryMock.create.mockReturnValue(user);
      repositoryMock.save.mockResolvedValue(user);

      const result = await service.create(
        user.email,
        user.password,
        user.bossId,
      );

      expect(repositoryMock.create).toHaveBeenCalledWith(user);
      expect(repositoryMock.save).toHaveBeenCalledWith(user);
      expect(result).toEqual(user);
    });
  });

  describe('find', () => {
    it('should find all users', async () => {
      const users = [
        { id: 1, email: 'user1@example.com', password: 'password', bossId: 1 },
        { id: 2, email: 'user2@example.com', password: 'password', bossId: 1 },
      ];
      repositoryMock.find.mockResolvedValue(users);

      const result = await service.find();

      expect(repositoryMock.find).toHaveBeenCalled();
      expect(result).toEqual(users);
    });
  });

  describe('findByEmail', () => {
    it('should find users by email', async () => {
      const email = 'test@example.com';
      const users = [{ id: 1, email, password: 'password', bossId: 1 }];
      repositoryMock.find.mockResolvedValue(users);

      const result = await service.findByEmail(email);

      expect(repositoryMock.find).toHaveBeenCalledWith({ where: { email } });
      expect(result).toEqual(users);
    });
  });

  describe('findByBossId', () => {
    it('should find users by boss ID and flatten subordinates', async () => {
      const bossUser = {
        id: 1,
        email: 'boss@example.com',
        password: 'password',
        bossId: 1,
      } as User;
      const subordinateUser1 = {
        id: 2,
        email: 'sub1@example.com',
        password: 'password',
        bossId: 1,
      };
      const subordinateUser2 = {
        id: 3,
        email: 'sub2@example.com',
        password: 'password',
        bossId: 1,
      };

      const findMock = jest.fn();
      findMock
        .mockResolvedValueOnce([subordinateUser1]) // First page of subordinates
        .mockResolvedValueOnce([subordinateUser2]) // Second page of subordinates
        .mockResolvedValueOnce([]); // No more subordinates

      repositoryMock.find = findMock;

      const result = await service.findByBossId(bossUser);

      expect(findMock).toHaveBeenCalledWith({ where: { bossId: bossUser.id } });
      expect(result).toEqual([bossUser, subordinateUser1, subordinateUser2]);
    });
  });
});

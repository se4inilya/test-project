import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  create(email: string, password: string, bossId: number, isAdmin?: boolean) {
    const user = this.repo.create({
      email,
      password,
      bossId,
      isAdmin,
      isBoss: isAdmin,
    });

    return this.repo.save(user);
  }

  findOne(id: number) {
    if (!id) return null;
    return this.repo.findOneBy({ id });
  }

  findByEmail(email: string) {
    return this.repo.find({ where: { email } });
  }

  findByBossId(user: User) {
    return this.flattenSubordinates([user]);
  }

  private async flattenSubordinates(users: User[]): Promise<User[]> {
    const result: User[] = [];
    for (const user of users) {
      result.push(user);
      const subordinates = await this.repo.find({
        where: { bossId: user.id },
      });
      result.push(...(await this.flattenSubordinates(subordinates)));
    }
    return result;
  }

  find() {
    return this.repo.find();
  }

  async update(id: number, attrs: Partial<User>) {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    Object.assign(user, attrs);

    return this.repo.save(user);
  }
}

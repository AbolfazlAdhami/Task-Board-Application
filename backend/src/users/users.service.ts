import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  findByEmailWithPassword(email: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({
      where: { email },
      select: {
        id: true,
        email: true,
        displayName: true,
        passwordHash: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async create(input: {
    email: string;
    displayName: string;
    passwordHash: string;
  }): Promise<UserEntity> {
    const user = this.usersRepository.create(input);
    return this.usersRepository.save(user);
  }
}

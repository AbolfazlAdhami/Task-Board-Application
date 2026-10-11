import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { IsNull, Repository } from 'typeorm';
import { RefreshTokenEntity } from '../auth/entities/refresh-token.entity/refresh-token.entity';
import { UserEntity, UserRole } from './entities/user.entity';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';

type PublicUser = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

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

  findById(id: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async getProfile(id: string): Promise<PublicUser> {
    return this.toPublicUser(await this.getUserOrThrow(id));
  }

  async listUsers(): Promise<PublicUser[]> {
    const users = await this.usersRepository.find({
      order: { createdAt: 'DESC' },
    });

    return users.map((user) => this.toPublicUser(user));
  }

  async updateMyProfile(
    id: string,
    dto: UpdateMyProfileDto,
  ): Promise<PublicUser> {
    if (dto.email === undefined && dto.displayName === undefined) {
      throw new BadRequestException('Provide at least one field to update');
    }

    const user = await this.getUserOrThrow(id);

    if (dto.email !== undefined) {
      user.email = await this.normalizeAndCheckEmail(dto.email, id);
    }

    if (dto.displayName !== undefined) {
      user.displayName = dto.displayName.trim();
    }

    return this.toPublicUser(await this.usersRepository.save(user));
  }

  async changePassword(id: string, dto: ChangePasswordDto): Promise<void> {
    if (Buffer.byteLength(dto.newPassword, 'utf8') > 72) {
      throw new BadRequestException('Password is too long');
    }

    await this.usersRepository.manager.transaction(async (manager) => {
      const user = await manager
        .getRepository(UserEntity)
        .createQueryBuilder('user')
        .addSelect('user.passwordHash')
        .where('user.id = :id', { id })
        .setLock('pessimistic_write')
        .getOne();

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!(await bcrypt.compare(dto.currentPassword, user.passwordHash))) {
        throw new UnauthorizedException('Current password is incorrect');
      }

      if (dto.currentPassword === dto.newPassword) {
        throw new BadRequestException(
          'New password must differ from current password',
        );
      }

      user.passwordHash = await bcrypt.hash(dto.newPassword, 12);
      await manager.save(user);

      await manager
        .createQueryBuilder()
        .update(RefreshTokenEntity)
        .set({ revokedAt: new Date() })
        .where('"user_id" = :userId', { userId: id })
        .andWhere('"revoked_at" IS NULL')
        .execute();
    });
  }

  async updateUser(id: string, dto: AdminUpdateUserDto): Promise<PublicUser> {
    if (
      dto.email === undefined &&
      dto.displayName === undefined &&
      dto.role === undefined &&
      dto.isActive === undefined
    ) {
      throw new BadRequestException('Provide at least one field to update');
    }

    return this.usersRepository.manager.transaction(async (manager) => {
      const repository = manager.getRepository(UserEntity);

      // Serialize owner changes so two requests cannot remove the final owner.
      await repository
        .createQueryBuilder('user')
        .select(['user.id'])
        .where('user.role = :role', { role: UserRole.OWNER })
        .andWhere('user.isActive = :active', { active: true })
        .setLock('pessimistic_write')
        .getMany();

      const user = await repository.findOne({ where: { id } });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const nextRole = dto.role ?? user.role;
      const nextIsActive = dto.isActive ?? user.isActive;

      if (
        user.role === UserRole.OWNER &&
        user.isActive &&
        (nextRole !== UserRole.OWNER || !nextIsActive)
      ) {
        const activeOwnerCount = await repository.count({
          where: { role: UserRole.OWNER, isActive: true },
        });

        if (activeOwnerCount <= 1) {
          throw new ConflictException(
            'The last active owner cannot be disabled or downgraded',
          );
        }
      }

      if (dto.email !== undefined) {
        user.email = await this.normalizeAndCheckEmail(
          dto.email,
          id,
          repository,
        );
      }

      if (dto.displayName !== undefined) {
        user.displayName = dto.displayName.trim();
      }

      if (dto.role !== undefined) {
        user.role = dto.role;
      }

      if (dto.isActive !== undefined) {
        user.isActive = dto.isActive;
      }

      return this.toPublicUser(await repository.save(user));
    });
  }

  private async getUserOrThrow(id: string): Promise<UserEntity> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private async normalizeAndCheckEmail(
    email: string,
    currentUserId: string,
    repository: Repository<UserEntity> = this.usersRepository,
  ): Promise<string> {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await repository.findOne({
      where: { email: normalizedEmail },
      select: { id: true, email: true },
    });

    if (existing && existing.id !== currentUserId) {
      throw new ConflictException('Email is already registered');
    }

    return normalizedEmail;
  }

  private toPublicUser(user: UserEntity): PublicUser {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

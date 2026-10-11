import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { RefreshTokenEntity } from './entities/refresh-token.entity/refresh-token.entity';
import { LoginDto } from './dto/login.dto';
import { durationToSeconds } from './auth.utils';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokensRepository: Repository<RefreshTokenEntity>,
  ) {}

  async register(input: RegisterDto) {
    const email = input.email.trim().toLowerCase();

    if (await this.usersService.findByEmailWithPassword(email)) {
      throw new ConflictException('Email is already registered');
    }

    if (Buffer.byteLength(input.password, 'utf8') > 72) {
      throw new BadRequestException('Password is too long');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await this.usersService.create({
      email,
      displayName: input.displayName.trim(),
      passwordHash,
    });

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  async login(input: LoginDto) {
    const email = input.email.trim().toLowerCase();
    const user = await this.usersService.findByEmailWithPassword(email);

    const invalidCredentials = new UnauthorizedException(
      'Invalid email or password',
    );

    if (
      !user ||
      !user.isActive ||
      Buffer.byteLength(input.password, 'utf8') > 72 ||
      !(await bcrypt.compare(input.password, user.passwordHash))
    ) {
      throw invalidCredentials;
    }

    const accessExpiresIn = durationToSeconds(
      this.configService.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN'),
    );
    const refreshExpiresIn = durationToSeconds(
      this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN'),
    );
    const familyId = randomUUID();

    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: accessExpiresIn,
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id, familyId, jti: randomUUID() },
      {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpiresIn,
      },
    );

    await this.refreshTokensRepository.save(
      this.refreshTokensRepository.create({
        tokenHash: createHash('sha256').update(refreshToken).digest('hex'),
        familyId,
        expiresAt: new Date(Date.now() + refreshExpiresIn * 1000),
        user,
      }),
    );

    return {
      accessToken,
      refreshToken,
      accessTokenMaxAge: accessExpiresIn * 1000,
      refreshTokenMaxAge: refreshExpiresIn * 1000,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    };
  }
}

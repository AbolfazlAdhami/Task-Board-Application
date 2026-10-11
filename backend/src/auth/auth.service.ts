import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

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
}

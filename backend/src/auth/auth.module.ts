import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshTokenEntity } from './entities/refresh-token.entity/refresh-token.entity';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';

function durationToSeconds(value: string): number {
  const match = /^(\d+)(s|m|h|d)$/.exec(value);

  if (!match) {
    throw new Error(`Invalid JWT duration: ${value}`);
  }

  const amount = Number(match[1]);
  const unit = match[2];

  const secondsPerUnit: Record<string, number> = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 24 * 60 * 60,
  };

  return amount * secondsPerUnit[unit];
}

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: durationToSeconds(
            config.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN'),
          ),
        },
      }),
    }),
    UsersModule,
    TypeOrmModule.forFeature([RefreshTokenEntity]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}

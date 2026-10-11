import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshTokenEntity } from './entities/refresh-token.entity/refresh-token.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RefreshTokenEntity])],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}

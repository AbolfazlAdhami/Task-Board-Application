import {
  Body,
  Controller,
  Post,
  Res,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';

import type { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';

const validationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(
    @Body(validationPipe) input: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.login(input);
    const secure = this.configService.get('NODE_ENV') === 'production';

    response.cookie('access_token', session.accessToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: session.accessTokenMaxAge,
    });

    response.cookie('refresh_token', session.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: session.refreshTokenMaxAge,
    });

    return session.user;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(
    @Req()
    request: Request & {
      user: {
        userId: string;
        name: string;
        email: string;
        role: string;
      };
    },
  ) {
    return request.user;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.refresh(
      request.cookies?.refresh_token,
    );
    const secure = this.configService.get('NODE_ENV') === 'production';

    response.cookie('access_token', session.accessToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: session.accessTokenMaxAge,
    });

    response.cookie('refresh_token', session.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: session.refreshTokenMaxAge,
    });

    return session.user;
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.authService.logout(request.cookies?.refresh_token);
    const secure = this.configService.get('NODE_ENV') === 'production';

    response.clearCookie('access_token', {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
    });

    response.clearCookie('refresh_token', {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/api/v1/auth',
    });
  }
}

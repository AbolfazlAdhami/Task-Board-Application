import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from './entities/user.entity';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

type AuthenticatedRequest = {
  user: {
    userId: string;
    role: UserRole;
  };
};

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.OWNER)
  createUser(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getMyProfile(@Req() request: AuthenticatedRequest) {
    return this.usersService.getProfile(request.user.userId);
  }

  @Patch('me/password')
  @UseGuards(AuthGuard('jwt'))
  async changeMyPassword(
    @Req() request: AuthenticatedRequest,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.usersService.changePassword(request.user.userId, dto);
    return { message: 'Password updated' };
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.OWNER)
  listUsers() {
    return this.usersService.listUsers();
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.OWNER)
  updateUser(@Param('id') id: string, @Body() dto: AdminUpdateUserDto) {
    return this.usersService.updateUser(id, dto);
  }
}

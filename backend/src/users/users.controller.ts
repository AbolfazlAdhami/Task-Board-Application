import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from './entities/user.entity';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { UsersService } from './users.service';

type AuthenticatedRequest = {
  user: {
    userId: string;
    role: UserRole;
  };
};

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getMyProfile(@Req() request: AuthenticatedRequest) {
    return this.usersService.getProfile(request.user.userId);
  }

  @Patch('me')
  @UseGuards(AuthGuard('jwt'))
  updateMyProfile(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateMyProfileDto,
  ) {
    return this.usersService.updateMyProfile(request.user.userId, dto);
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

import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from '../../users/entities/user.entity';
import { UsersService } from '../../users/users.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const usersService = {
    findById: jest.fn(),
  };

  let strategy: JwtStrategy;

  beforeEach(() => {
    usersService.findById.mockReset();

    strategy = new JwtStrategy(
      {
        getOrThrow: jest.fn().mockReturnValue('test-access-secret'),
      } as unknown as ConfigService,
      usersService as unknown as UsersService,
    );
  });

  it('rejects an old access-token payload when its user is disabled', async () => {
    const disabledUser = {
      id: 'disabled-user-id',
      isActive: false,
    } as unknown as UserEntity;

    usersService.findById.mockResolvedValue(disabledUser);

    await expect(
      strategy.validate({ sub: disabledUser.id }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(usersService.findById).toHaveBeenCalledWith(disabledUser.id);
  });
});

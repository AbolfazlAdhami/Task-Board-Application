import type { ExecutionContext } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UsersController } from './users.controller';
import { UserRole } from './entities/user.entity';

describe('UsersController authorization', () => {
  const updateHandler = Object.getOwnPropertyDescriptor(
    UsersController.prototype,
    'updateUser',
  )?.value as (...args: never[]) => unknown;

  function contextFor(role: UserRole): ExecutionContext {
    return {
      getHandler: () => updateHandler,
      getClass: () => UsersController,
      switchToHttp: () => ({
        getRequest: () => ({ user: { userId: 'test-user', role } }),
      }),
    } as unknown as ExecutionContext;
  }

  it('protects user updates with the owner-only role guard', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      updateHandler,
    ) as unknown[];
    const roles = Reflect.getMetadata(ROLES_KEY, updateHandler) as UserRole[];

    expect(guards).toContain(RolesGuard);
    expect(roles).toEqual([UserRole.OWNER]);
  });

  it('rejects a member attempting to update a user', () => {
    const guard = new RolesGuard(new Reflector());

    expect(guard.canActivate(contextFor(UserRole.MEMBER))).toBe(false);
  });
});

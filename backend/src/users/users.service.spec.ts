import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UserEntity, UserRole } from './entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService last active owner protection', () => {
  let service: UsersService;
  let repository: {
    createQueryBuilder: jest.Mock;
    findOne: jest.Mock;
    count: jest.Mock;
    save: jest.Mock;
    manager: {
      getRepository: jest.Mock;
      transaction: jest.Mock;
    };
  };
  let ownerLockQuery: {
    select: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    setLock: jest.Mock;
    getMany: jest.Mock;
  };

  beforeEach(() => {
    ownerLockQuery = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      setLock: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };

    repository = {
      createQueryBuilder: jest.fn().mockReturnValue(ownerLockQuery),
      findOne: jest.fn().mockResolvedValue({
        id: 'only-owner',
        email: 'owner@example.com',
        displayName: 'Last Owner',
        role: UserRole.OWNER,
        isActive: true,
      } as UserEntity),
      count: jest.fn().mockResolvedValue(1),
      save: jest.fn(),
      manager: {
        getRepository: jest.fn(),
        transaction: jest.fn(),
      },
    };

    const manager = {
      getRepository: jest.fn().mockReturnValue(repository),
    };
    repository.manager.getRepository.mockReturnValue(repository);
    repository.manager.transaction.mockImplementation(
      async (callback: (transactionManager: typeof manager) => unknown) =>
        callback(manager),
    );

    service = new UsersService(repository as unknown as Repository<UserEntity>);
  });

  it.each([
    ['disabling', { isActive: false }],
    ['downgrading', { role: UserRole.MANAGER }],
  ])('rejects %s the last active owner', async (_action, changes) => {
    await expect(
      service.updateUser('only-owner', changes),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(repository.count).toHaveBeenCalledWith({
      where: { role: UserRole.OWNER, isActive: true },
    });
    expect(repository.save).not.toHaveBeenCalled();
  });
});

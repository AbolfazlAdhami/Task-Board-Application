import * as bcrypt from 'bcrypt';
import dataSource from '../data-source';
import { UserEntity, UserRole } from '../../../users/entities/user.entity';

type SeedUser = {
  email: string;
  displayName: string;
  password: string;
  role: UserRole;
};

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

async function main(): Promise<void> {
  const seedUsers: SeedUser[] = [
    {
      email: required('SEED_OWNER_EMAIL').trim().toLowerCase(),
      displayName: 'Task Board Owner',
      password: required('SEED_OWNER_PASSWORD'),
      role: UserRole.OWNER,
    },
    {
      email: required('SEED_MANAGER_EMAIL').trim().toLowerCase(),
      displayName: 'Task Board Manager',
      password: required('SEED_MANAGER_PASSWORD'),
      role: UserRole.MANAGER,
    },
    {
      email: required('SEED_MEMBER_EMAIL').trim().toLowerCase(),
      displayName: 'Task Board Member',
      password: required('SEED_MEMBER_PASSWORD'),
      role: UserRole.MEMBER,
    },
  ];

  if (new Set(seedUsers.map((user) => user.email)).size !== seedUsers.length) {
    throw new Error('Seed account emails must be different');
  }

  for (const user of seedUsers) {
    const length = Buffer.byteLength(user.password, 'utf8');
    if (length < 8 || length > 72) {
      throw new Error(`Seed password for ${user.email} must be 8–72 bytes`);
    }
  }

  const preparedUsers = await Promise.all(
    seedUsers.map(async (user) => ({
      email: user.email,
      displayName: user.displayName,
      passwordHash: await bcrypt.hash(user.password, 12),
      role: user.role,
      isActive: true,
    })),
  );

  await dataSource.initialize();

  try {
    await dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(UserEntity);

      for (const user of preparedUsers) {
        await repository
          .createQueryBuilder()
          .insert()
          .into(UserEntity)
          .values(user)
          .orIgnore()
          .execute();

        const existing = await repository.findOne({
          where: { email: user.email },
        });

        if (
          !existing ||
          existing.role !== user.role ||
          existing.isActive !== true
        ) {
          throw new Error(
            `Seed account conflict for ${user.email}; existing record was not changed`,
          );
        }

        console.log(`Seed account ready: ${user.email} (${user.role})`);
      }
    });
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

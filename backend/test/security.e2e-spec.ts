import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource, In } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../src/app.module';
import { RefreshTokenEntity } from '../src/auth/entities/refresh-token.entity/refresh-token.entity';
import { TodoEntity } from '../src/todos/entities/todo.entity';
import { TodoPriority, TodoStatus } from '../src/todos/types/todo.enums';
import { UserEntity, UserRole } from '../src/users/entities/user.entity';

describe('Security requirements (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let member: UserEntity;
  let otherMember: UserEntity;
  let disabledMember: UserEntity;
  let manager: UserEntity;
  let owner: UserEntity;
  const createdUserIds: string[] = [];
  const testPassword = 'Temporary-e2e-password-2026!';

  async function createUser(
    displayName: string,
    role = UserRole.MEMBER,
  ): Promise<UserEntity> {
    const repository = dataSource.getRepository(UserEntity);
    const user = repository.create({
      email: `security-${randomUUID()}@example.test`,
      displayName,
      passwordHash: await bcrypt.hash(testPassword, 10),
      role,
      isActive: true,
    });
    const saved = await repository.save(user);
    createdUserIds.push(saved.id);
    return saved;
  }

  async function accessCookieFor(user: UserEntity): Promise<string> {
    const config = app.get(ConfigService);
    const token = await app.get(JwtService).signAsync(
      { sub: user.id, email: user.email, role: user.role },
      {
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: 60,
      },
    );
    return `access_token=${token}`;
  }

  function cookieFromResponse(
    response: { headers: Record<string, unknown> },
    name: string,
  ): string {
    const cookies = response.headers['set-cookie'] as string[] | undefined;
    const cookie = cookies?.find((value) => value.startsWith(`${name}=`));
    expect(cookie).toBeDefined();
    return cookie!.split(';', 1)[0];
  }

  async function login(email: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: testPassword });

    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThan(300);

    return cookieFromResponse(response, 'access_token');
  }

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    dataSource = app.get(DataSource);
    member = await createUser('Security Test Member');
    otherMember = await createUser('Security Test Other Member');
    disabledMember = await createUser('Security Test Disabled Member');
    manager = await createUser('Security Test Manager', UserRole.MANAGER);
    owner = await createUser('Security Test Owner', UserRole.OWNER);
  }, 30_000);

  afterAll(async () => {
    if (dataSource?.isInitialized && createdUserIds.length > 0) {
      const todos = dataSource.getRepository(TodoEntity);
      await todos.delete({ createdBy: In(createdUserIds) });
      await todos.delete({ assignedTo: In(createdUserIds) });
      await dataSource
        .getRepository(UserEntity)
        .delete({ id: In(createdUserIds) });
    }

    await app?.close();
  }, 30_000);

  it('does not let a member read another member’s task by ID', async () => {
    const todo = await dataSource.getRepository(TodoEntity).save(
      dataSource.getRepository(TodoEntity).create({
        title: 'Private task for another member',
        status: TodoStatus.TODO,
        priority: TodoPriority.MEDIUM,
        description: { type: 'doc', content: [] },
        createdBy: otherMember.id,
        assignedTo: null,
        dueDate: null,
      }),
    );
    const accessCookie = await login(member.email);

    await request(app.getHttpServer())
      .get(`/api/v1/todos/${todo.id}`)
      .set('Cookie', accessCookie)
      .expect(404);
  });

  it('does not let a member create or update users', async () => {
    const accessCookie = await login(member.email);

    await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Cookie', accessCookie)
      .send({
        email: `created-by-member-${randomUUID()}@example.test`,
        displayName: 'Unauthorized Account',
        password: testPassword,
        role: UserRole.MEMBER,
      })
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/api/v1/users/${otherMember.id}`)
      .set('Cookie', accessCookie)
      .send({ role: UserRole.MANAGER })
      .expect(403);

    await request(app.getHttpServer())
      .post('/api/v1/todos')
      .set('Cookie', accessCookie)
      .send({
        title: 'Reject unknown properties',
        unexpectedField: 'must be rejected',
      })
      .expect(400);
  });

  it('lets owners manage users while managers remain read-only', async () => {
    const ownerCookie = await accessCookieFor(owner);
    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Cookie', ownerCookie)
      .send({
        email: `owner-created-${randomUUID()}@example.test`,
        displayName: 'Owner Created User',
        password: testPassword,
        role: UserRole.MEMBER,
      });

    if (typeof createResponse.body.id === 'string') {
      createdUserIds.push(createResponse.body.id);
    }
    expect(createResponse.status).toBe(201);

    const createdUserId = createResponse.body.id as string;
    const updateResponse = await request(app.getHttpServer())
      .patch(`/api/v1/users/${createdUserId}`)
      .set('Cookie', ownerCookie)
      .send({ displayName: 'Updated by Owner', role: UserRole.MANAGER })
      .expect(200);
    expect(updateResponse.body).toMatchObject({
      id: createdUserId,
      displayName: 'Updated by Owner',
      role: UserRole.MANAGER,
    });

    const managerCookie = await accessCookieFor(manager);
    const userListResponse = await request(app.getHttpServer())
      .get('/api/v1/users')
      .set('Cookie', managerCookie)
      .expect(200);
    expect(userListResponse.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: createdUserId })]),
    );

    await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Cookie', managerCookie)
      .send({
        email: `manager-created-${randomUUID()}@example.test`,
        displayName: 'Unauthorized Manager Account',
        password: testPassword,
        role: UserRole.MEMBER,
      })
      .expect(403);
    await request(app.getHttpServer())
      .patch(`/api/v1/users/${createdUserId}`)
      .set('Cookie', managerCookie)
      .send({ displayName: 'Unauthorized Manager Update' })
      .expect(403);
  });

  it('allows managers and owners to create, read, update, and delete tasks', async () => {
    for (const user of [manager, owner]) {
      const accessCookie = await accessCookieFor(user);
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/todos')
        .set('Cookie', accessCookie)
        .send({
          title: `CRUD task for ${user.role}`,
          status: TodoStatus.IN_PROGRESS,
          priority: TodoPriority.HIGH,
          assignedTo: member.id,
          dueDate: '2026-11-01',
          description: { type: 'doc', content: [] },
        })
        .expect(201);
      const todoId = createResponse.body.id as string;

      expect(createResponse.body).toMatchObject({
        title: `CRUD task for ${user.role}`,
        status: TodoStatus.IN_PROGRESS,
        priority: TodoPriority.HIGH,
        createdBy: user.id,
        assignedTo: member.id,
        description: { type: 'doc', content: [] },
      });

      await request(app.getHttpServer())
        .get(`/api/v1/todos/${todoId}`)
        .set('Cookie', accessCookie)
        .expect(200);
      await request(app.getHttpServer())
        .patch(`/api/v1/todos/${todoId}`)
        .set('Cookie', accessCookie)
        .send({ status: TodoStatus.DONE })
        .expect(200)
        .expect(({ body }) => expect(body.status).toBe(TodoStatus.DONE));
      await request(app.getHttpServer())
        .delete(`/api/v1/todos/${todoId}`)
        .set('Cookie', accessCookie)
        .expect(204);
    }
  });

  it('rejects an old access token immediately after the user is disabled', async () => {
    const accessCookie = await login(disabledMember.email);
    await dataSource
      .getRepository(UserEntity)
      .update(disabledMember.id, { isActive: false });

    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Cookie', accessCookie)
      .expect(401);
  });

  it('stores refresh-token hashes, rotates tokens, and revokes a reused family', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: member.email, password: testPassword })
      .expect(200);
    const oldRefreshCookie = cookieFromResponse(loginResponse, 'refresh_token');
    const oldRefreshToken = oldRefreshCookie.slice('refresh_token='.length);
    const refreshRepository = dataSource.getRepository(RefreshTokenEntity);
    const oldHash = createHash('sha256').update(oldRefreshToken).digest('hex');
    const storedOldToken = await refreshRepository.findOne({
      where: { tokenHash: oldHash },
    });

    expect(storedOldToken).not.toBeNull();
    expect(storedOldToken?.tokenHash).not.toBe(oldRefreshToken);

    const rotationResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', oldRefreshCookie)
      .expect(200);
    const newRefreshCookie = cookieFromResponse(
      rotationResponse,
      'refresh_token',
    );
    const newRefreshToken = newRefreshCookie.slice('refresh_token='.length);
    const newHash = createHash('sha256').update(newRefreshToken).digest('hex');
    const storedNewToken = await refreshRepository.findOne({
      where: { tokenHash: newHash },
    });
    const revokedOldToken = await refreshRepository.findOne({
      where: { tokenHash: oldHash },
    });

    expect(newRefreshToken).not.toBe(oldRefreshToken);
    expect(storedNewToken).not.toBeNull();
    expect(revokedOldToken?.revokedAt).not.toBeNull();

    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', oldRefreshCookie)
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', newRefreshCookie)
      .expect(401);

    const revokedNewToken = await refreshRepository.findOne({
      where: { tokenHash: newHash },
    });
    expect(revokedNewToken?.revokedAt).not.toBeNull();
  });

  it('clears auth cookies and prevents refresh after logout', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: otherMember.email, password: testPassword })
      .expect(200);
    const refreshCookie = cookieFromResponse(loginResponse, 'refresh_token');

    const logoutResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Cookie', refreshCookie)
      .expect(204);

    expect(logoutResponse.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringContaining('access_token=;'),
        expect.stringContaining('refresh_token=;'),
      ]),
    );
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshCookie)
      .expect(401);
  });
});

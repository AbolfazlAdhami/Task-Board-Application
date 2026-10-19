import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { RefreshTokenEntity } from '../../auth/entities/refresh-token.entity/refresh-token.entity';
import { TodoEntity } from '../../todos/entities/todo.entity';

config({ path: '../.env' });

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
};

export default new DataSource({
  type: 'postgres',
  url:process.env.DATABASE_URL||"postgresql://abolfazl:fWeQJZvTRg22uCC5JwAgHWzLjLO4NdAi@dpg-dbam5aajnfac7388l5i0-a.frankfurt-postgres.render.com/task_board_m5dr",
  // host: process.env.POSTGRES_HOST ?? '127.0.0.1',
  // port: Number(process.env.POSTGRES_PORT ?? 5433),
  // username: required('POSTGRES_USER'),
  // password: required('POSTGRES_PASSWORD'),
  // database: required('POSTGRES_DB'),
  entities: [UserEntity, RefreshTokenEntity, TodoEntity],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
  migrationsRun: false,
});

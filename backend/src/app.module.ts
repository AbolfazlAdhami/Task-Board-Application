import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TodosModule } from './todos/todos.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../.env' }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
  url:process.env.DATABASE_URL||"postgresql://abolfazl:fWeQJZvTRg22uCC5JwAgHWzLjLO4NdAi@dpg-dbam5aajnfac7388l5i0-a.frankfurt-postgres.render.com/task_board_m5dr",
        // host: config.get<string>('POSTGRES_HOST', 'localhost'),
        // port: Number(config.get('POSTGRES_PORT') ?? 5432),
        // database: config.getOrThrow<string>('POSTGRES_DB'),
        // username: config.getOrThrow<string>('POSTGRES_USER'),
        // password: config.getOrThrow<string>('POSTGRES_PASSWORD'),
        autoLoadEntities: true,
        synchronize: false,
        migrationsRun: false,
      }),
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 100 }],
    }),
    UsersModule,
    AuthModule,
    TodosModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

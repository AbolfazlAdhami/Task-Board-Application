import { BadRequestException, Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NextFunction, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

const port = process.env.PORT ?? 3001;
const httpLogger = new Logger('HTTP');
const bootstrapLogger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  app.setGlobalPrefix('api/v1');
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,

      exceptionFactory: (errors) => {
        console.error(
          '[Validation Error]',
          JSON.stringify(
            errors.map(({ property, constraints, children }) => ({
              property,
              constraints,
              children,
            })),
            null,
            2,
          ),
        );

        return new BadRequestException(errors);
      },
    }),
  );

  app.use((request: Request, response: Response, next: NextFunction) => {
    const startedAt = Date.now();

    response.on('finish', () => {
      const message = `${request.method} ${request.path} ${response.statusCode} ${Date.now() - startedAt}ms`;

      if (response.statusCode >= 500) {
        httpLogger.error(message);
      } else if (response.statusCode >= 400) {
        httpLogger.warn(message);
      } else {
        httpLogger.log(message);
      }
    });

    next();
  });

  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  });

  await app.listen(port);
  bootstrapLogger.log(`Listening on port ${port}`);
}

void bootstrap();

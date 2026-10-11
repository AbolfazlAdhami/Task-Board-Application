import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NextFunction, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

const port = process.env.PORT ?? 3001;
const httpLogger = new Logger('HTTP');
const bootstrapLogger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  app.use(cookieParser());

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

  await app.listen(port);
  bootstrapLogger.log(`Listening on port ${port}`);
}

void bootstrap();

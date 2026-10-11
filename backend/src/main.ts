import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
 

const Port = process.env.PORT ?? 3001;
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  app.use(cookieParser());

  console.log('App run on Port:', Port);
  await app.listen(Port);
}
void bootstrap();

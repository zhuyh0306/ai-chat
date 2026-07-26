import * as dotenv from 'dotenv';
// 必须在导入 AppModule 之前加载 .env，否则 JwtStrategy 在模块加载时读取到的 JWT_SECRET 为 undefined
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局 CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  });

  // 全局验证管道
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`NestJS server running on http://localhost:${port}`);
}
void bootstrap();

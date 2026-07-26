import * as dotenv from 'dotenv';
// 必须在导入 AppModule 之前加载 .env，否则 JwtStrategy 在模块加载时读取到的 JWT_SECRET 为 undefined
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppLogger } from './logger/app-logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 使用自定义 logger（控制台 + 日志文件 logs/app-YYYY-MM-DD.log）
  const logger = app.get(AppLogger);
  app.useLogger(logger);

  // 全局 HTTP 请求日志（已在 AppModule 中通过 MiddlewareConsumer 注册）

  // 全局 CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  });

  // 全局验证管道
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // ===== Swagger / OpenAPI 文档 =====
  const config = new DocumentBuilder()
    .setTitle('Mastra App API')
    .setDescription('NestJS 后端 API 文档（认证接口请在右上角 Authorize 填入 Bearer Token）')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuth: true },
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`NestJS server running on http://localhost:${port}`);
  logger.log(`Swagger docs: http://localhost:${port}/api/docs`);
}
void bootstrap();

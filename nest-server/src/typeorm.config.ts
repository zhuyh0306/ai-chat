import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432', 10) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'mastra_app',
      autoLoadEntities: true,
      synchronize: true, // 开发环境自动同步表结构
      // 数据库未就绪时自动重试，避免 nest-server 因短暂连不上 DB 而崩溃
      retryAttempts: 10,
      retryDelay: 3000,
    };
  }
}

import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfigService } from './typeorm.config';
import { LoggerModule } from './logger/logger.module';
import { LoggerMiddleware } from './logger/logger.middleware';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ModelsModule } from './models/models.module';
import { ConversationsModule } from './conversations/conversations.module';
import { MessagesModule } from './messages/messages.module';
import { EcommerceModule } from './ecommerce/ecommerce.module';
import { InterviewModule } from './interview/interview.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
    }),
    LoggerModule,
    AuthModule,
    UsersModule,
    ModelsModule,
    ConversationsModule,
    MessagesModule,
    EcommerceModule,
    InterviewModule,
  ],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}

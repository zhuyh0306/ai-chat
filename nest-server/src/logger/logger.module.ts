import { Global, Module } from '@nestjs/common';
import { AppLogger } from './app-logger';
import { LoggerMiddleware } from './logger.middleware';

@Global()
@Module({
  providers: [AppLogger, LoggerMiddleware],
  exports: [AppLogger, LoggerMiddleware],
})
export class LoggerModule {}

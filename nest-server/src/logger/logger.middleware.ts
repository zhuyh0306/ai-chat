import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { AppLogger } from './app-logger';

/**
 * 记录每个 HTTP 请求的 方法 / URL / 状态码 / 耗时 / 客户端 IP。
 * 在 main.ts 中通过 app.use() 全局注册。
 */
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: AppLogger) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();
    const { method, originalUrl, ip } = req;

    res.on('finish', () => {
      const duration = Date.now() - start;
      const status = res.statusCode;
      const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'log';
      this.logger[level](
        `${method} ${originalUrl} -> ${status} (${duration}ms) ip=${ip}`,
        'HTTP',
      );
    });

    next();
  }
}

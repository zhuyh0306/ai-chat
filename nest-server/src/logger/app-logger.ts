import { Injectable, LoggerService, LogLevel } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 同时输出到控制台和日志文件的 logger。
 * 日志文件位于 <cwd>/logs/app-YYYY-MM-DD.log，便于在服务器上查看/下载。
 */
@Injectable()
export class AppLogger implements LoggerService {
  private readonly logDir = path.resolve(process.cwd(), 'logs');
  private currentDate = this.dateStamp();

  constructor() {
    try {
      fs.mkdirSync(this.logDir, { recursive: true });
    } catch {
      // 目录创建失败不影响控制台输出
    }
  }

  private dateStamp(d = new Date()): string {
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  }

  private filePath(): string {
    return path.join(this.logDir, `app-${this.currentDate}.log`);
  }

  private format(level: LogLevel | 'log', message: unknown, context?: string): string {
    const ts = new Date().toISOString();
    const ctx = context ? ` [${context}]` : '';
    return `${ts} ${level.toUpperCase()}${ctx} ${this.stringify(message)}\n`;
  }

  private stringify(message: unknown): string {
    if (typeof message === 'string') return message;
    if (message instanceof Error) {
      return `${message.message}\n${message.stack ?? ''}`;
    }
    try {
      return JSON.stringify(message);
    } catch {
      return String(message);
    }
  }

  private write(level: LogLevel | 'log', message: unknown, context?: string): void {
    // 跨天自动切换到新日志文件
    const today = this.dateStamp();
    if (today !== this.currentDate) this.currentDate = today;

    const line = this.format(level, message, context);
    process.stdout.write(line);

    try {
      fs.appendFileSync(this.filePath(), line);
    } catch {
      // 文件写入失败忽略，保证服务不中断
    }
  }

  log(message: unknown, context?: string): void {
    this.write('log', message, context);
  }

  error(message: unknown, context?: string): void {
    this.write('error', message, context);
  }

  warn(message: unknown, context?: string): void {
    this.write('warn', message, context);
  }

  debug(message: unknown, context?: string): void {
    this.write('debug', message, context);
  }

  verbose(message: unknown, context?: string): void {
    this.write('verbose', message, context);
  }
}

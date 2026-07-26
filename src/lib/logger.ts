import fs from 'node:fs';
import path from 'node:path';

/**
 * 前端（Next.js）服务端日志：同时输出到控制台和日志文件 logs/frontend-YYYY-MM-DD.log。
 * 注意：仅在 Node.js 运行时使用（instrumentation.ts 中以动态 import 方式按需引入），
 * 避免 Edge 运行时加载 fs 模块报错。
 */
const logDir = path.resolve(process.cwd(), 'logs');
try {
  fs.mkdirSync(logDir, { recursive: true });
} catch {
  // 目录创建失败不影响控制台输出
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

let currentDate = today();

function filePath(): string {
  return path.join(logDir, `frontend-${currentDate}.log`);
}

function stringify(message: unknown): string {
  if (typeof message === 'string') return message;
  if (message instanceof Error) return `${message.message}\n${message.stack ?? ''}`;
  try {
    return JSON.stringify(message);
  } catch {
    return String(message);
  }
}

function format(level: string, message: unknown, context?: string): string {
  const ts = new Date().toISOString();
  const ctx = context ? ` [${context}]` : '';
  return `${ts} ${level}${ctx} ${stringify(message)}\n`;
}

function write(level: string, message: unknown, context?: string): void {
  const t = today();
  if (t !== currentDate) currentDate = t;
  const line = format(level, message, context);
  process.stdout.write(line);
  try {
    fs.appendFileSync(filePath(), line);
  } catch {
    // 文件写入失败忽略，保证服务不中断
  }
}

export const FrontendLogger = {
  log: (message: unknown, context?: string) => write('LOG', message, context),
  info: (message: unknown, context?: string) => write('INFO', message, context),
  warn: (message: unknown, context?: string) => write('WARN', message, context),
  error: (message: unknown, context?: string) => write('ERROR', message, context),
};

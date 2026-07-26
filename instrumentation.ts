/**
 * Next.js 服务端探针：记录启动、全局异常，以及服务端请求错误。
 * 仅在 Node.js 运行时通过动态 import 引入 logger，避免 Edge 运行时加载 fs。
 * 日志文件位置：<cwd>/logs/frontend-YYYY-MM-DD.log（容器中为 /app/logs，已挂载到宿主机 ./logs）
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { FrontendLogger } = await import('./src/lib/logger');
    FrontendLogger.info('Next.js (my-app) server started', 'BOOT');
    process.on('uncaughtException', (err) => FrontendLogger.error(err, 'uncaughtException'));
    process.on('unhandledRejection', (reason) =>
      FrontendLogger.error(reason, 'unhandledRejection'),
    );
  }
}

export async function onRequestError(
  err: unknown,
  request: { path: string; method: string; headers: Record<string, string | string[]> },
  context: { routePath: string; routeType: string },
) {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { FrontendLogger } = await import('./src/lib/logger');
  const message = err instanceof Error ? err.message : String(err);
  FrontendLogger.error(
    `${request.method} ${request.path} -> ${message} | route=${context.routePath} type=${context.routeType}`,
    'RequestError',
  );
}

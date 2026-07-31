import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * API Key 鉴权守卫。
 *
 * - 若环境变量 `ECOMMERCE_API_KEY` 未设置：进入「演示模式」，放行所有请求，
 *   便于模型（mastra-demo）在未配置密钥时直接调用。
 * - 若已设置：要求请求携带 `Authorization: Bearer <ECOMMERCE_API_KEY>` 头，
 *   与智能客服 ApiClient 发送方式保持一致。
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expectedKey = process.env.ECOMMERCE_API_KEY;
    if (!expectedKey) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'] || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme === 'Bearer' && token === expectedKey) {
      return true;
    }

    throw new UnauthorizedException('无效的 API Key');
  }
}

import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class OrderQueryDto {
  @ApiPropertyOptional({ description: '用户ID', example: 'user_001' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: '订单号（模糊匹配）' })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiPropertyOptional({
    enum: ['pending', 'paid', 'shipped', 'completed', 'cancelled', 'all'],
    description:
      '订单状态过滤：pending(待付款)、paid(已付款)、shipped(已发货)、completed(已完成)、cancelled(已取消)、all(全部)',
  })
  @IsOptional()
  @IsEnum(['pending', 'paid', 'shipped', 'completed', 'cancelled', 'all'])
  status?: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled' | 'all';
}

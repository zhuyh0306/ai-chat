import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CouponQueryDto {
  @ApiPropertyOptional({ description: '用户ID', example: 'user_001' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    enum: ['all', 'available', 'expired'],
    description: '优惠券类型：all(全部)、available(可用)、expired(已过期)',
  })
  @IsOptional()
  @IsEnum(['all', 'available', 'expired'])
  type?: 'all' | 'available' | 'expired';
}

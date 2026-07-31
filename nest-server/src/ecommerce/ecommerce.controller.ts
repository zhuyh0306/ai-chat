import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { EcommerceService } from './ecommerce.service';
import { OrderQueryDto } from './dto/order-query.dto';
import { CouponQueryDto } from './dto/coupon-query.dto';
import { ApiKeyGuard } from './api-key.guard';

@ApiTags('ecommerce')
@UseGuards(ApiKeyGuard)
@Controller()
export class EcommerceController {
  constructor(private readonly ecommerceService: EcommerceService) {}

  @Get('orders')
  @ApiOperation({
    summary: '查询订单列表（数据源为 PostgreSQL，替换原 mock）',
  })
  @ApiResponse({ status: 200, description: '订单列表' })
  getOrders(@Query() query: OrderQueryDto) {
    return this.ecommerceService.getOrders(query);
  }

  @Get('logistics/:orderId')
  @ApiOperation({ summary: '查询订单物流轨迹' })
  @ApiParam({ name: 'orderId', description: '订单号' })
  @ApiResponse({ status: 200, description: '物流信息' })
  getLogistics(@Param('orderId') orderId: string) {
    return this.ecommerceService.getLogistics(orderId);
  }

  @Get('coupons')
  @ApiOperation({ summary: '查询用户优惠券' })
  @ApiResponse({ status: 200, description: '优惠券列表' })
  getCoupons(@Query() query: CouponQueryDto) {
    return this.ecommerceService.getCoupons(query);
  }
}

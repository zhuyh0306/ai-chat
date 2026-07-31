import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EcommerceController } from './ecommerce.controller';
import { EcommerceService } from './ecommerce.service';
import { EcommerceSeedService } from './ecommerce.seed';
import { ApiKeyGuard } from './api-key.guard';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Logistics } from './entities/logistics.entity';
import { LogisticsTrack } from './entities/logistics-track.entity';
import { Coupon } from './entities/coupon.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      Logistics,
      LogisticsTrack,
      Coupon,
    ]),
  ],
  controllers: [EcommerceController],
  providers: [EcommerceService, EcommerceSeedService, ApiKeyGuard],
})
export class EcommerceModule {}

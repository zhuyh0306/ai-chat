import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { Logistics } from './entities/logistics.entity';
import { Coupon } from './entities/coupon.entity';
import {
  buildOrderEntities,
  buildLogisticsEntities,
  buildCouponEntities,
  ORDER_SEED,
  LOGISTICS_SEED,
  COUPON_SEED,
} from './seed-data';

/**
 * 应用启动时自动初始化电商测试数据（仅当 orders 表为空时）。
 * 这样「模型调用」即可直接命中真实 DB 数据，无需再依赖 mock。
 */
@Injectable()
export class EcommerceSeedService implements OnModuleInit {
  private readonly logger = new Logger(EcommerceSeedService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Logistics)
    private readonly logisticsRepo: Repository<Logistics>,
    @InjectRepository(Coupon)
    private readonly couponRepo: Repository<Coupon>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seed();
  }

  async seed(): Promise<void> {
    const orderCount = await this.orderRepo.count();
    if (orderCount > 0) {
      this.logger.log('电商测试数据已存在，跳过初始化');
      return;
    }

    this.logger.log('开始初始化电商测试数据（orders / logistics / coupons）...');
    await this.orderRepo.save(buildOrderEntities());
    await this.logisticsRepo.save(buildLogisticsEntities());
    await this.couponRepo.save(buildCouponEntities());
    this.logger.log(
      `电商测试数据初始化完成：订单 ${ORDER_SEED.length} 条、物流 ${LOGISTICS_SEED.length} 条、优惠券 ${COUPON_SEED.length} 张`,
    );
  }
}

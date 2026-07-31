/**
 * 独立电商测试数据初始化脚本。
 *
 * 用法：
 *   pnpm seed:ecommerce            # 表为空时写入；已存在则跳过
 *   FORCE_SEED=1 pnpm seed:ecommerce  # 先清空再写入（重建测试数据）
 *
 * 依赖 .env 中的 DB_HOST / DB_PORT / DB_USERNAME / DB_PASSWORD / DB_DATABASE。
 */
import * as dotenv from 'dotenv';
dotenv.config();

import { DataSource } from 'typeorm';
import { Order } from '../src/ecommerce/entities/order.entity';
import { OrderItem } from '../src/ecommerce/entities/order-item.entity';
import { Logistics } from '../src/ecommerce/entities/logistics.entity';
import { LogisticsTrack } from '../src/ecommerce/entities/logistics-track.entity';
import { Coupon } from '../src/ecommerce/entities/coupon.entity';
import {
  buildOrderEntities,
  buildLogisticsEntities,
  buildCouponEntities,
  ORDER_SEED,
  LOGISTICS_SEED,
  COUPON_SEED,
} from '../src/ecommerce/seed-data';

async function run(): Promise<void> {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'mastra_app',
    entities: [Order, OrderItem, Logistics, LogisticsTrack, Coupon],
    synchronize: true,
  });

  await dataSource.initialize();
  console.log('✅ 数据库连接成功');

  const force = process.env.FORCE_SEED === '1';
  const orderRepo = dataSource.getRepository(Order);
  const logisticsRepo = dataSource.getRepository(Logistics);
  const couponRepo = dataSource.getRepository(Coupon);

  if (force) {
    console.log('🧹 FORCE_SEED=1：清空已有测试数据...');
    await couponRepo.clear();
    await logisticsRepo.clear();
    await orderRepo.clear();
  } else if ((await orderRepo.count()) > 0) {
    console.log(
      'ℹ️  电商测试数据已存在，跳过（设置 FORCE_SEED=1 可强制重建）',
    );
    await dataSource.destroy();
    return;
  }

  await orderRepo.save(buildOrderEntities());
  await logisticsRepo.save(buildLogisticsEntities());
  await couponRepo.save(buildCouponEntities());

  console.log(
    `🎉 初始化完成：订单 ${ORDER_SEED.length} 条、物流 ${LOGISTICS_SEED.length} 条、优惠券 ${COUPON_SEED.length} 张`,
  );
  await dataSource.destroy();
}

run().catch((error) => {
  console.error('❌ 初始化失败：', error);
  process.exit(1);
});

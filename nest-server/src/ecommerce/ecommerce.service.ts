import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { Logistics } from './entities/logistics.entity';
import { Coupon } from './entities/coupon.entity';
import { OrderQueryDto } from './dto/order-query.dto';
import { CouponQueryDto } from './dto/coupon-query.dto';

@Injectable()
export class EcommerceService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Logistics)
    private readonly logisticsRepo: Repository<Logistics>,
    @InjectRepository(Coupon)
    private readonly couponRepo: Repository<Coupon>,
  ) {}

  /**
   * 查询订单列表（数据源为 PostgreSQL，替换原 mock 数据）。
   * 支持按 userId / orderId（模糊）/ status 过滤。
   */
  async getOrders(query: OrderQueryDto) {
    const qb = this.orderRepo.createQueryBuilder('order');

    if (query.userId) {
      qb.andWhere('order.userId = :userId', { userId: query.userId });
    }
    if (query.orderId) {
      qb.andWhere('LOWER(order.orderId) LIKE LOWER(:oid)', {
        oid: `%${query.orderId}%`,
      });
    }
    if (query.status && query.status !== 'all') {
      qb.andWhere('order.status = :status', { status: query.status });
    }

    const orders = await qb.orderBy('order.createdAt', 'DESC').getMany();
    return { orders, totalCount: orders.length };
  }

  /**
   * 查询订单物流轨迹。无记录时返回与 mock 一致的「暂无物流信息」。
   */
  async getLogistics(orderId: string) {
    const logistics = await this.logisticsRepo.findOne({
      where: { orderId },
      relations: ['trackingHistory'],
    });

    if (!logistics) {
      return {
        orderId,
        carrier: '顺丰速运',
        trackNumber:
          'SF' + Math.random().toString(36).substring(2, 15).toUpperCase(),
        status: 'not_found',
        statusText: '暂无物流信息',
        estimatedDelivery: '预计3-5个工作日送达',
        trackingHistory: [
          {
            time: new Date().toISOString().slice(0, 19).replace('T', ' '),
            description: '订单已创建，等待发货',
            location: '仓库',
          },
        ],
      };
    }

    return logistics;
  }

  /**
   * 查询优惠券列表。status 根据 expireDate 与当前时间实时计算（available/expired）。
   */
  async getCoupons(query: CouponQueryDto) {
    const coupons = await this.couponRepo.find();
    const now = new Date();

    let result = coupons.map((c) => ({
      ...c,
      status: new Date(c.expireDate) < now ? 'expired' : 'available',
    }));

    if (query.type === 'available') {
      result = result.filter((c) => c.status === 'available');
    } else if (query.type === 'expired') {
      result = result.filter((c) => c.status === 'expired');
    }

    return { coupons: result, totalCount: result.length };
  }
}

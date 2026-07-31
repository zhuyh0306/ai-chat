import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Logistics } from './entities/logistics.entity';
import { LogisticsTrack } from './entities/logistics-track.entity';
import { Coupon } from './entities/coupon.entity';

/**
 * 电商测试数据（与智能客服 ecommerce-tools 的 mock 保持一致）。
 * 应用启动时若表为空会自动写入；也可通过 `pnpm seed:ecommerce` 手动初始化。
 */

interface OrderSeed {
  orderId: string;
  userId: string;
  status: string;
  statusText: string;
  totalAmount: number;
  createdAt: string;
  items: Array<{ name: string; quantity: number; price: number }>;
}

interface LogisticsSeed {
  orderId: string;
  carrier: string;
  trackNumber: string;
  status: string;
  statusText: string;
  estimatedDelivery: string;
  trackingHistory: Array<{ time: string; description: string; location?: string }>;
}

interface CouponSeed {
  id: string;
  name: string;
  amount: number;
  minPurchase: number;
  expireDate: string;
  status: string;
  conditions: string;
}

export const ORDER_SEED: OrderSeed[] = [
  {
    orderId: 'ORD20260728001',
    userId: 'user_001',
    status: 'shipped',
    statusText: '已发货',
    totalAmount: 299.0,
    createdAt: '2026-07-28 10:30:00',
    items: [{ name: '无线蓝牙耳机 Pro', quantity: 1, price: 299.0 }],
  },
  {
    orderId: 'ORD20260727002',
    userId: 'user_001',
    status: 'paid',
    statusText: '已付款',
    totalAmount: 1580.0,
    createdAt: '2026-07-27 14:20:00',
    items: [
      { name: '智能手表 S5', quantity: 1, price: 1299.0 },
      { name: '硅胶表带', quantity: 1, price: 89.0 },
      { name: '钢化膜', quantity: 2, price: 96.0 },
    ],
  },
  {
    orderId: 'ORD20260726003',
    userId: 'user_001',
    status: 'completed',
    statusText: '已完成',
    totalAmount: 699.0,
    createdAt: '2026-07-26 09:15:00',
    items: [
      { name: '便携充电宝 20000mAh', quantity: 1, price: 299.0 },
      { name: 'USB-C 快充线', quantity: 2, price: 39.0 },
    ],
  },
  {
    orderId: 'ORD20260725004',
    userId: 'user_001',
    status: 'pending',
    statusText: '待付款',
    totalAmount: 4599.0,
    createdAt: '2026-07-25 16:45:00',
    items: [
      { name: '机械键盘 Pro', quantity: 1, price: 3999.0 },
      { name: '键帽套装', quantity: 1, price: 399.0 },
      { name: '键盘清洁套装', quantity: 1, price: 199.0 },
    ],
  },
  {
    orderId: 'ORD20260720005',
    userId: 'user_001',
    status: 'cancelled',
    statusText: '已取消',
    totalAmount: 299.0,
    createdAt: '2026-07-20 11:00:00',
    items: [
      { name: '手机壳', quantity: 1, price: 99.0 },
      { name: '屏幕保护膜', quantity: 2, price: 100.0 },
    ],
  },
];

export const LOGISTICS_SEED: LogisticsSeed[] = [
  {
    orderId: 'ORD20260728001',
    carrier: '顺丰速运',
    trackNumber: 'SF1234567890123',
    status: 'in_transit',
    statusText: '运输中',
    estimatedDelivery: '2026-07-30',
    trackingHistory: [
      {
        time: '2026-07-28 18:30:00',
        description: '快件已到达【上海浦东集散中心】',
        location: '上海市',
      },
      {
        time: '2026-07-28 14:20:00',
        description: '快件已从【上海嘉定营业部】发出',
        location: '上海市',
      },
      {
        time: '2026-07-28 10:30:00',
        description: '快件已揽收',
        location: '上海嘉定营业部',
      },
    ],
  },
  {
    orderId: 'ORD20260727002',
    carrier: '京东物流',
    trackNumber: 'JD9876543210987',
    status: 'delivered',
    statusText: '已送达',
    estimatedDelivery: '2026-07-28',
    trackingHistory: [
      {
        time: '2026-07-28 09:15:00',
        description: '快件已送达，签收人：本人签收',
        location: '北京市朝阳区',
      },
      {
        time: '2026-07-28 07:30:00',
        description: '快件已到达【北京朝阳配送站】',
        location: '北京市',
      },
      {
        time: '2026-07-27 22:00:00',
        description: '快件已从【北京转运中心】发出',
        location: '北京市',
      },
    ],
  },
];

export const COUPON_SEED: CouponSeed[] = [
  {
    id: 'CP001',
    name: '满200减30元',
    amount: 30,
    minPurchase: 200,
    expireDate: '2026-08-31',
    status: 'available',
    conditions: '全场商品可用',
  },
  {
    id: 'CP002',
    name: '新人专享50元',
    amount: 50,
    minPurchase: 100,
    expireDate: '2026-08-15',
    status: 'available',
    conditions: '仅限新用户首单',
  },
  {
    id: 'CP003',
    name: '品类满减券',
    amount: 100,
    minPurchase: 500,
    expireDate: '2026-09-30',
    status: 'available',
    conditions: '仅限数码品类',
  },
  {
    id: 'CP004',
    name: '限时折扣券',
    amount: 20,
    minPurchase: 0,
    expireDate: '2026-07-29',
    status: 'available',
    conditions: '全场商品9折优惠',
  },
  {
    id: 'CP005',
    name: '已过期优惠券',
    amount: 15,
    minPurchase: 100,
    expireDate: '2026-06-30',
    status: 'expired',
    conditions: '全场商品可用',
  },
];

// ---- 构建实体实例（供 onModuleInit 与独立 seed 脚本复用）----

export function buildOrderEntities(): Order[] {
  return ORDER_SEED.map((o) => {
    const order = new Order();
    order.orderId = o.orderId;
    order.userId = o.userId;
    order.status = o.status;
    order.statusText = o.statusText;
    order.totalAmount = o.totalAmount;
    order.createdAt = o.createdAt;
    order.items = o.items.map((it) => {
      const item = new OrderItem();
      item.name = it.name;
      item.quantity = it.quantity;
      item.price = it.price;
      return item;
    });
    return order;
  });
}

export function buildLogisticsEntities(): Logistics[] {
  return LOGISTICS_SEED.map((l) => {
    const logistics = new Logistics();
    logistics.orderId = l.orderId;
    logistics.carrier = l.carrier;
    logistics.trackNumber = l.trackNumber;
    logistics.status = l.status;
    logistics.statusText = l.statusText;
    logistics.estimatedDelivery = l.estimatedDelivery;
    logistics.trackingHistory = l.trackingHistory.map((t) => {
      const track = new LogisticsTrack();
      track.time = t.time;
      track.description = t.description;
      track.location = t.location ?? null;
      return track;
    });
    return logistics;
  });
}

export function buildCouponEntities(): Coupon[] {
  return COUPON_SEED.map((c) => {
    const coupon = new Coupon();
    coupon.id = c.id;
    coupon.name = c.name;
    coupon.amount = c.amount;
    coupon.minPurchase = c.minPurchase;
    coupon.expireDate = c.expireDate;
    coupon.status = c.status;
    coupon.conditions = c.conditions;
    return coupon;
  });
}

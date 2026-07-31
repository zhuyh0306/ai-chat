import {
  Entity,
  Column,
  PrimaryColumn,
  OneToMany,
} from 'typeorm';
import { OrderItem } from './order-item.entity';

@Entity('orders')
export class Order {
  @PrimaryColumn({ length: 50 })
  orderId: string;

  @Column({ length: 50, default: 'user_001' })
  userId: string;

  @Column({ length: 20 })
  status: string;

  @Column({ length: 20 })
  statusText: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value == null ? value : parseFloat(value)),
    },
  })
  totalAmount: number;

  // 与模型期望一致的 'YYYY-MM-DD HH:mm:ss' 字符串格式
  @Column({ length: 30 })
  createdAt: string;

  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
    eager: true,
  })
  items: OrderItem[];
}

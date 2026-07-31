import {
  Entity,
  Column,
  PrimaryColumn,
} from 'typeorm';

@Entity('coupons')
export class Coupon {
  @PrimaryColumn({ length: 20 })
  id: string;

  @Column({ length: 50 })
  name: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value == null ? value : parseFloat(value)),
    },
  })
  amount: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value == null ? value : parseFloat(value)),
    },
  })
  minPurchase: number;

  @Column({ length: 20 })
  expireDate: string;

  @Column({ length: 20 })
  status: string;

  @Column({ type: 'text', nullable: true })
  conditions: string;
}

import {
  Entity,
  Column,
  PrimaryColumn,
  OneToMany,
} from 'typeorm';
import { LogisticsTrack } from './logistics-track.entity';

@Entity('logistics')
export class Logistics {
  @PrimaryColumn({ length: 50 })
  orderId: string;

  @Column({ length: 50 })
  carrier: string;

  @Column({ length: 50 })
  trackNumber: string;

  @Column({ length: 20 })
  status: string;

  @Column({ length: 20 })
  statusText: string;

  @Column({ length: 30 })
  estimatedDelivery: string;

  @OneToMany(() => LogisticsTrack, (track) => track.logistics, {
    cascade: true,
    eager: true,
  })
  trackingHistory: LogisticsTrack[];
}

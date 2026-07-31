import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Logistics } from './logistics.entity';

@Entity('logistics_tracks')
export class LogisticsTrack {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 30 })
  time: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  location: string | null;

  @ManyToOne(() => Logistics, (logistics) => logistics.trackingHistory, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'orderId' })
  logistics: Logistics;
}

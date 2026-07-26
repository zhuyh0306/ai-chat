import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('model_configs')
export class ModelConfig {
  @PrimaryColumn({ length: 100 })
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 50 })
  provider: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

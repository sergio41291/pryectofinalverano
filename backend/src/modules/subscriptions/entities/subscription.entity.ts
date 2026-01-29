import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('subscriptions')
@Index(['userId', 'status'])
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 20, default: 'free' })
  plan: 'free' | 'pro' | 'enterprise';

  @Column({ type: 'varchar', length: 50, nullable: true })
  stripeCustomerId?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  stripeSubscriptionId?: string;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: 'active' | 'inactive' | 'cancelled' | 'paused';

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  monthlyPrice: number;

  @Column({ type: 'integer', default: 0 })
  documentLimit: number;

  @Column({ type: 'integer', default: 0 })
  documentUsage: number;

  @Column({ type: 'integer', default: 0 })
  storageLimit: number;

  @Column({ type: 'integer', default: 0 })
  storageUsage: number;

  @Column({ type: 'boolean', default: true })
  autoRenew: boolean;

  @Column({ type: 'timestamp', nullable: true })
  startDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  renewalDate?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.subscriptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}

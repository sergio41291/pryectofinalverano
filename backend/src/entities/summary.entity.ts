import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../modules/users/entities/user.entity';

@Entity('summaries')
export class Summary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('varchar', { length: 500 })
  title: string;

  @Column('text')
  sourceText: string;

  @Column('text')
  summaryContent: string;

  @Column('varchar', { length: 50 })
  language: string;

  @Column('varchar', { length: 50 })
  style: 'bullet-points' | 'paragraph' | 'executive';

  @Column('varchar', { length: 255, nullable: true })
  sourceFileName?: string;

  @Column('integer', { nullable: true })
  sourceCharCount?: number;

  @Column('integer', { nullable: true })
  summaryCharCount?: number;

  @Column('varchar', { length: 255, nullable: true })
  minionPath?: string; // Path en MinIO

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

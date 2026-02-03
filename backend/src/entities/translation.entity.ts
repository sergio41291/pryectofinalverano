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

@Entity('translations')
export class Translation {
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
  originalText: string;

  @Column('text')
  translatedText: string;

  @Column('varchar', { length: 10 })
  sourceLanguage: string;

  @Column('varchar', { length: 10 })
  targetLanguage: string;

  @Column('varchar', { length: 255, nullable: true })
  sourceFileName?: string;

  @Column('integer', { nullable: true })
  originalCharCount?: number;

  @Column('integer', { nullable: true })
  translatedCharCount?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

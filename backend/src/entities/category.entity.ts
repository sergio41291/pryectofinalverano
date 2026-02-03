import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../modules/users/entities/user.entity';
import { Upload } from '../modules/uploads/entities/upload.entity';
import { Group } from './group.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 7, default: '#6366f1' }) // Indigo por defecto
  color: string;

  @Column({ length: 50, nullable: true })
  icon: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  sharedWithGroupId: string;

  @ManyToOne(() => Group, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'sharedWithGroupId' })
  sharedWithGroup: Group;

  @OneToMany(() => Upload, (upload) => upload.category)
  uploads: Upload[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

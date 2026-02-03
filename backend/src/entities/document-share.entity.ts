import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../modules/users/entities/user.entity';
import { Upload } from '../modules/uploads/entities/upload.entity';

export enum SharePermission {
  VIEW = 'view',
  EDIT = 'edit',
}

@Entity('document_shares')
@Index(['uploadId', 'sharedWithUserId'], { unique: true })
@Index(['sharedByUserId'])
@Index(['sharedWithUserId'])
export class DocumentShare {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  uploadId: string;

  @ManyToOne(() => Upload, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'uploadId' })
  upload: Upload;

  @Column({ type: 'uuid' })
  sharedByUserId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sharedByUserId' })
  sharedBy: User;

  @Column({ type: 'uuid' })
  sharedWithUserId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sharedWithUserId' })
  sharedWith: User;

  @Column({
    type: 'enum',
    enum: SharePermission,
    default: SharePermission.VIEW,
  })
  permission: SharePermission;

  @CreateDateColumn()
  sharedAt: Date;
}

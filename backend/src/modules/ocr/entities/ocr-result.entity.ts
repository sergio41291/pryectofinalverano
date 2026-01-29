import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Upload } from '../../uploads/entities/upload.entity';

@Entity('ocr_results')
@Index(['userId', 'uploadId'])
@Index(['status', 'createdAt'])
export class OcrResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  uploadId: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Upload, (upload) => upload.ocrResults, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'uploadId' })
  upload: Upload;

  @Column('simple-json', { nullable: true })
  extractedText: {
    text: string;
    confidence: number;
    language: string;
  };

  @Column('simple-json', { nullable: true })
  metadata: {
    processedPages: number;
    totalPages: number;
    processingTime: number;
    modelVersion: string;
  };

  @Column('simple-json', { nullable: true })
  pageResults: Array<{
    pageNumber: number;
    text: string;
    confidence: number;
  }>;

  @Column({
    type: 'enum',
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  })
  status: 'pending' | 'processing' | 'completed' | 'failed';

  @Column({ nullable: true })
  errorMessage: string;

  @Column({ nullable: true })
  jobId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;
}

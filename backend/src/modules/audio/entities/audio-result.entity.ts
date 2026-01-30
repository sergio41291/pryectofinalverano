import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum AudioResultStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('audio_results')
@Index(['uploadId', 'userId'])
@Index(['userId'])
export class AudioResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  uploadId: string;

  @Column('uuid')
  userId: string;

  @Column('text', { nullable: true })
  transcription: string;

  @Column('text', { nullable: true })
  summary: string;

  @Column('varchar', { nullable: true })
  transcriptionMinioPath: string;

  @Column('varchar', { nullable: true })
  summaryMinioPath: string;

  @Column('varchar', { nullable: true })
  audioMinioPath: string;

  @Column('jsonb', { nullable: true, default: {} })
  metadata: Record<string, any>;

  @Column('jsonb', { nullable: true, default: [] })
  languageDetails: {
    detected: string;
    confidence: number;
  } | null;

  @Column({
    type: 'enum',
    enum: AudioResultStatus,
    default: AudioResultStatus.PENDING,
  })
  status: AudioResultStatus;

  @Column('text', { nullable: true })
  errorMessage: string;

  @Column('varchar', { nullable: true })
  jobId: string;

  @Column('varchar', { nullable: true })
  assemblyAiId: string;

  @Column('varchar', { nullable: true })
  language: string;

  @Column('simple-json', { nullable: true })
  assemblyAiResponse: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column('timestamp', { nullable: true })
  completedAt: Date;
}

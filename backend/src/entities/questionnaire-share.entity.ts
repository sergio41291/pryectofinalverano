import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Questionnaire } from './questionnaire.entity';

@Entity('questionnaire_shares')
export class QuestionnaireShare {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  questionnaireId: string;

  @ManyToOne(() => Questionnaire, questionnaire => questionnaire.shareConfigs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'questionnaireId' })
  questionnaire: Questionnaire;

  @Column('varchar', { length: 50, default: 'private' })
  shareType: 'public' | 'password' | 'email' | 'private';

  @Column('varchar', { length: 255, nullable: true })
  sharePassword: string;

  @Column('text', { array: true, default: () => "'{}'", nullable: true })
  allowedEmails: string[];

  @Column('varchar', { length: 30, nullable: true })
  validFrom: string;

  @Column('varchar', { length: 30, nullable: true })
  validUntil: string;

  @Column('varchar', { length: 255, unique: true, nullable: true })
  shareToken: string;

  @Column('integer', { default: 0 })
  accessCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

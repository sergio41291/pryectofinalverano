import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Questionnaire } from './questionnaire.entity';

export interface ResponseAnswer {
  questionId: string;
  selectedIndex: number;
  isCorrect: boolean;
}

@Entity('questionnaire_responses')
export class QuestionnaireResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  questionnaireId: string;

  @ManyToOne(() => Questionnaire, questionnaire => questionnaire.responses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'questionnaireId' })
  questionnaire: Questionnaire;

  @Column('varchar', { length: 255, nullable: true })
  respondentName: string;

  @Column('varchar', { length: 255, nullable: true })
  respondentEmail: string;

  @Column('jsonb')
  answers: ResponseAnswer[];

  @Column('integer')
  totalQuestions: number;

  @Column('integer')
  correctAnswers: number;

  @Column('decimal', { precision: 5, scale: 2 })
  score: number;

  @Column('varchar', { length: 255, nullable: true })
  ipAddress: string;

  @Column('text', { nullable: true })
  userAgent: string;

  @CreateDateColumn()
  answeredAt: Date;
}

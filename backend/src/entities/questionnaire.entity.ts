import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../modules/users/entities/user.entity';
import { Group } from './group.entity';

export interface QuestionData {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

@Entity('questionnaires')
export class Questionnaire {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('jsonb')
  questions: QuestionData[];

  @Column('varchar', { length: 50, default: 'draft' })
  status: 'draft' | 'published' | 'archived';

  @Column('integer', { default: 0 })
  totalResponses: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  averageScore: number;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, (user: User) => user.questionnaires)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('uuid', { nullable: true })
  groupId: string | null;

  @ManyToOne(() => Group, { nullable: true })
  @JoinColumn({ name: 'groupId' })
  group: Group;

  @OneToMany('QuestionnaireResponse', 'questionnaire')
  responses: any[];

  @OneToMany('QuestionnaireShare', 'questionnaire')
  shareConfigs: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

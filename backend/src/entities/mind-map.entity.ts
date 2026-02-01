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

/**
 * Estructura de nodos para mapas mentales
 */
export interface MindMapNode {
  id: string;
  label: string;
  type?: 'root' | 'branch' | 'leaf';
  level?: number;
  position?: { x: number; y: number };
  style?: {
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
  };
}

/**
 * Estructura de conexiones entre nodos
 */
export interface MindMapEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: 'default' | 'straight' | 'smoothstep';
}

/**
 * Estructura completa del mapa mental
 */
export interface MindMapStructure {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  metadata?: {
    totalNodes: number;
    totalEdges: number;
    maxLevel: number;
    generatedAt: Date;
  };
}

@Entity('mind_maps')
export class MindMap {
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

  @Column('jsonb')
  structure: MindMapStructure;

  @Column('varchar', { length: 50, default: 'es' })
  language: string;

  @Column('integer', { nullable: true })
  sourceCharCount?: number;

  @Column('integer', { nullable: true })
  nodeCount?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

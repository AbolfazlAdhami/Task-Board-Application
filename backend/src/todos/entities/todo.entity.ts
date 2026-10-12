import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TodoPriority, TodoStatus } from '../types/todo.enums';
import type { TiptapDocument } from '../types/tiptap-document';

@Entity({ name: 'todos' })
export class TodoEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({
    type: 'enum',
    enum: TodoStatus,
    enumName: 'todo_status_enum',
    default: TodoStatus.TODO,
  })
  status!: TodoStatus;

  @Column({
    type: 'enum',
    enum: TodoPriority,
    enumName: 'todo_priority_enum',
    default: TodoPriority.MEDIUM,
  })
  priority!: TodoPriority;

  @Column({ name: 'assigned_to', type: 'uuid', nullable: true })
  assignedTo!: string | null;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate!: string | null;

  @Column({
    type: 'jsonb',
    default: () => `'{ "type": "doc", "content": [] }'::jsonb`,
  })
  description!: TiptapDocument;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

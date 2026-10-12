import {
  IsDateString,
  IsEnum,
  IsObject,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  Validate,
  ValidateIf,
} from 'class-validator';
import { type TiptapDocument } from '../types/tiptap-document';
import { TodoPriority, TodoStatus } from '../types/todo.enums';
import { TiptapDocumentValidator } from './tiptap-document.validator';

export class CreateTodoDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Matches(/\S/)
  title!: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsEnum(TodoStatus)
  status?: TodoStatus;

  @ValidateIf((_object, value) => value !== undefined)
  @IsEnum(TodoPriority)
  priority?: TodoPriority;

  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dueDate?: string | null;

  @ValidateIf((_object, value) => value !== undefined)
  @IsObject()
  @Validate(TiptapDocumentValidator)
  description?: TiptapDocument;

  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsUUID()
  assignedTo?: string | null;
}

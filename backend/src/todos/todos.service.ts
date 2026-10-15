import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, UserRole } from '../users/entities/user.entity';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { TodoEntity } from './entities/todo.entity';
import { TodoPriority, TodoStatus } from './types/todo.enums';
import { EMPTY_TIPTAP_DOCUMENT } from './types/tiptap-document';

type AuthenticatedUser = {
  userId: string;
  role: UserRole;
};

@Injectable()
export class TodosService {
  constructor(
    @InjectRepository(TodoEntity)
    private readonly todosRepository: Repository<TodoEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  findAll(user: AuthenticatedUser): Promise<TodoEntity[]> {
    if (user.role !== UserRole.MEMBER) {
      return this.todosRepository.find({
        order: { createdAt: 'DESC' },
      });
    }

    return this.todosRepository.find({
      where: [{ createdBy: user.userId }, { assignedTo: user.userId }],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, user: AuthenticatedUser): Promise<TodoEntity> {
    const todo = await this.findTodoOrThrow(id);
    this.assertCanAccess(todo, user);
    return todo;
  }

  async create(
    dto: CreateTodoDto,
    user: AuthenticatedUser,
  ): Promise<TodoEntity> {
    const title = this.normalizeTitle(dto.title);

    this.assertMemberAssignment(dto.assignedTo, user);
    await this.ensureActiveAssignee(dto.assignedTo);

    const todo = this.todosRepository.create({
      title,
      status: dto.status ?? TodoStatus.TODO,
      priority: dto.priority ?? TodoPriority.MEDIUM,
      dueDate: dto.dueDate ?? null,
      description: dto.description ?? EMPTY_TIPTAP_DOCUMENT,
      createdBy: user.userId,
      assignedTo: dto.assignedTo ?? null,
    });
    return this.todosRepository.save(todo);
  }

  async update(
    id: string,
    dto: UpdateTodoDto,
    user: AuthenticatedUser,
  ): Promise<TodoEntity> {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('Provide at least one field to update');
    }

    const todo = await this.findTodoOrThrow(id);
    this.assertCanAccess(todo, user);

    if (dto.assignedTo !== undefined) {
      this.assertMemberAssignment(dto.assignedTo, user);
      await this.ensureActiveAssignee(dto.assignedTo);
      todo.assignedTo = dto.assignedTo;
    }

    if (dto.title !== undefined) {
      todo.title = this.normalizeTitle(dto.title);
    }
    if (dto.status !== undefined) todo.status = dto.status;
    if (dto.priority !== undefined) todo.priority = dto.priority;
    if (dto.dueDate !== undefined) todo.dueDate = dto.dueDate;
    if (dto.description !== undefined) todo.description = dto.description;

    return this.todosRepository.save(todo);
  }

  async remove(id: string, user: AuthenticatedUser): Promise<void> {
    const todo = await this.findTodoOrThrow(id);

    if (user.role === UserRole.MEMBER) {
      this.assertCanAccess(todo, user);

      if (todo.createdBy !== user.userId) {
        throw new ForbiddenException(
          'Members can delete only tasks they created',
        );
      }
    }

    await this.todosRepository.remove(todo);
  }

  private async findTodoOrThrow(id: string): Promise<TodoEntity> {
    const todo = await this.todosRepository.findOne({ where: { id } });

    if (!todo) {
      throw new NotFoundException('Task not found');
    }

    return todo;
  }

  private assertCanAccess(todo: TodoEntity, user: AuthenticatedUser): void {
    if (
      user.role === UserRole.MEMBER &&
      todo.createdBy !== user.userId &&
      todo.assignedTo !== user.userId
    ) {
      throw new NotFoundException('Task not found');
    }
  }

  private assertMemberAssignment(
    assignedTo: string | null | undefined,
    user: AuthenticatedUser,
  ): void {
    if (
      user.role === UserRole.MEMBER &&
      assignedTo &&
      assignedTo !== user.userId
    ) {
      throw new ForbiddenException('Members cannot assign tasks to others');
    }
  }

  private async ensureActiveAssignee(
    assignedTo: string | null | undefined,
  ): Promise<void> {
    if (!assignedTo) return;

    const assignee = await this.usersRepository.findOne({
      where: { id: assignedTo },
      select: { id: true, isActive: true },
    });

    if (!assignee?.isActive) {
      throw new BadRequestException('Assignee must be an active user');
    }
  }

  private normalizeTitle(title: string): string {
    const normalized = title.trim();

    if (!normalized) {
      throw new BadRequestException('Title cannot be empty');
    }

    return normalized;
  }
}

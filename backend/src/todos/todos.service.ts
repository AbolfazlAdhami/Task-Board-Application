import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../users/entities/user.entity/user.entity';
import { CreateTodoDto } from './dto/create-todo.dto';
import { TodoEntity } from './entities/todo.entity/todo.entity';

type AuthenticatedUser = {
  userId: string;
  role: UserRole;
};

@Injectable()
export class TodosService {
  constructor(
    @InjectRepository(TodoEntity)
    private readonly todosRepository: Repository<TodoEntity>,
  ) {}

  create(dto: CreateTodoDto, user: AuthenticatedUser): Promise<TodoEntity> {
    if (
      user.role === UserRole.MEMBER &&
      dto.assignedTo &&
      dto.assignedTo !== user.userId
    ) {
      throw new ForbiddenException('Members cannot assign tasks to others');
    }

    const todo = this.todosRepository.create({
      title: dto.title,
      description: dto.description ?? null,
      createdBy: user.userId,
      assignedTo: dto.assignedTo ?? null,
    });

    return this.todosRepository.save(todo);
  }
}

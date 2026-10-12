import { NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { UserEntity, UserRole } from '../users/entities/user.entity';
import { TodoEntity } from './entities/todo.entity';
import { TodosService } from './todos.service';

describe('TodosService member access', () => {
  const member = {
    userId: 'member-id',
    role: UserRole.MEMBER,
  };

  const otherMemberTodo = {
    id: 'todo-id',
    createdBy: 'another-member-id',
    assignedTo: null,
  } as unknown as TodoEntity;

  let todosRepository: { findOne: jest.Mock; find: jest.Mock };
  let usersRepository: { findOne: jest.Mock };
  let service: TodosService;

  beforeEach(() => {
    todosRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
    };
    usersRepository = { findOne: jest.fn() };

    service = new TodosService(
      todosRepository as unknown as Repository<TodoEntity>,
      usersRepository as unknown as Repository<UserEntity>,
    );
  });

  it('hides another member’s task when requested by ID', async () => {
    todosRepository.findOne.mockResolvedValue(otherMemberTodo);

    await expect(
      service.findOne(otherMemberTodo.id, member),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('limits a member’s task list to created or assigned tasks', async () => {
    todosRepository.find.mockResolvedValue([]);

    await service.findAll(member);

    expect(todosRepository.find).toHaveBeenCalledWith({
      where: [
        { createdBy: member.userId },
        { assignedTo: member.userId },
      ],
      order: { createdAt: 'DESC' },
    });
  });
});

import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '../users/entities/user.entity';
import { CreateTodoDto } from './dto/create-todo.dto';
import { TodosService } from './todos.service';

type AuthenticatedRequest = {
  user: {
    userId: string;
    name: string;
    email: string;
    role: UserRole;
  };
};

@Controller('todos')
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateTodoDto, @Req() request: AuthenticatedRequest) {
    return this.todosService.create(dto, request.user);
  }
}

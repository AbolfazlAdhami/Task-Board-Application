import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TodoEntity } from './entities/todo.entity/todo.entity';
import { TodosController } from './todos.controller';
import { TodosService } from './todos.service';

@Module({
  imports: [TypeOrmModule.forFeature([TodoEntity]), AuthModule],
  controllers: [TodosController],
  providers: [TodosService, RolesGuard],
})
export class TodosModule {}

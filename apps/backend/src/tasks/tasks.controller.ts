import { Body, Controller, Delete, Get, Headers, Param, Patch, Post } from '@nestjs/common';
import { userIdFromAuthorization } from '../common/auth-token';
import { TaskDto } from '../common/dtos';
import { TasksService } from './tasks.service';

@Controller('api/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  list(@Headers('authorization') authorization?: string) {
    return this.tasksService.list(userIdFromAuthorization(authorization));
  }

  @Post()
  create(
    @Headers('authorization') authorization: string | undefined,
    @Body() input: TaskDto,
  ) {
    return this.tasksService.create(userIdFromAuthorization(authorization), input);
  }

  @Patch(':id')
  update(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() input: Partial<TaskDto>,
  ) {
    return this.tasksService.update(userIdFromAuthorization(authorization), id, input);
  }

  @Delete(':id')
  remove(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    return this.tasksService.remove(userIdFromAuthorization(authorization), id);
  }
}

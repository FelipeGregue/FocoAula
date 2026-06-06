import { Body, Controller, Delete, Get, Headers, Param, Patch, Post } from '@nestjs/common';
import { userIdFromAuthorization } from '../common/auth-token';
import { GradeDto } from '../common/dtos';
import { GradesService } from './grades.service';

@Controller('api/grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Get()
  list(@Headers('authorization') authorization?: string) {
    return this.gradesService.list(userIdFromAuthorization(authorization));
  }

  @Post()
  create(
    @Headers('authorization') authorization: string | undefined,
    @Body() input: GradeDto,
  ) {
    return this.gradesService.create(userIdFromAuthorization(authorization), input);
  }

  @Patch(':id')
  update(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() input: Partial<GradeDto>,
  ) {
    return this.gradesService.update(userIdFromAuthorization(authorization), id, input);
  }

  @Delete(':id')
  remove(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    return this.gradesService.remove(userIdFromAuthorization(authorization), id);
  }
}

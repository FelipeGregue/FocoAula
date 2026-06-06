import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { userIdFromAuthorization } from '../common/auth-token';
import { SubjectDto } from '../common/dtos';
import { SubjectsService } from './subjects.service';

@Controller('api/subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  list(@Headers('authorization') authorization?: string) {
    return this.subjectsService.list(userIdFromAuthorization(authorization));
  }

  @Post()
  create(
    @Headers('authorization') authorization: string | undefined,
    @Body() input: SubjectDto,
  ) {
    return this.subjectsService.create(userIdFromAuthorization(authorization), input);
  }
}

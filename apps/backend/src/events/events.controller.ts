import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { userIdFromAuthorization } from '../common/auth-token';
import { EventDto } from '../common/dtos';
import { EventsService } from './events.service';

@Controller('api/events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  list(@Headers('authorization') authorization?: string) {
    return this.eventsService.list(userIdFromAuthorization(authorization));
  }

  @Post()
  create(
    @Headers('authorization') authorization: string | undefined,
    @Body() input: EventDto,
  ) {
    return this.eventsService.create(userIdFromAuthorization(authorization), input);
  }
}

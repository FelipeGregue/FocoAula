import { Body, Controller, Get, Headers, Patch } from '@nestjs/common';
import { userIdFromAuthorization } from '../common/auth-token';
import { ReminderDto } from '../common/dtos';
import { RemindersService } from './reminders.service';

@Controller('api/reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get()
  get(@Headers('authorization') authorization?: string) {
    return this.remindersService.get(userIdFromAuthorization(authorization));
  }

  @Patch()
  update(
    @Headers('authorization') authorization: string | undefined,
    @Body() input: ReminderDto,
  ) {
    return this.remindersService.update(userIdFromAuthorization(authorization), input);
  }
}

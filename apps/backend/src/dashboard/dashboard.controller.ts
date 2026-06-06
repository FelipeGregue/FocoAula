import { Controller, Get, Headers } from '@nestjs/common';
import { userIdFromAuthorization } from '../common/auth-token';
import { DashboardService } from './dashboard.service';

@Controller('api/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  get(@Headers('authorization') authorization?: string) {
    return this.dashboardService.get(userIdFromAuthorization(authorization));
  }
}

import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { userIdFromAuthorization } from '../common/auth-token';
import { LoginDto, RegisterDto } from '../common/dtos';
import { AuthService } from './auth.service';

@Controller('api')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('auth/register')
  register(@Body() input: RegisterDto) {
    return this.authService.register(input);
  }

  @Post('auth/login')
  login(@Body() input: LoginDto) {
    return this.authService.login(input);
  }

  @Get('me')
  me(@Headers('authorization') authorization?: string) {
    return this.authService.getMe(userIdFromAuthorization(authorization));
  }
}

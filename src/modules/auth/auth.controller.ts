import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoginRequest } from 'src/modules/auth/dto/auth.dto';
import { AuthService } from './auth.service';

@ApiTags('Auths')
@Controller('auths')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login' })
  login(@Body() body: LoginRequest) {
    return this.service.login(body);
  }
}

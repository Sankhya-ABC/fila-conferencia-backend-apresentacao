import { Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthAppService } from './auth-app.service';
import { NoAuthApp } from './no-auth-app.decorator';

@ApiTags('App')
@Controller('auth-app')
export class AuthAppController {
  constructor(private readonly authAppService: AuthAppService) {}

  @NoAuthApp()
  @Post('authenticate')
  @ApiOperation({ summary: 'Autentica a aplicação na API Sankhya' })
  @ApiResponse({
    status: 201,
    description: 'Token obtido com sucesso',
  })
  authenticate() {
    return this.authAppService.getValidToken();
  }
}

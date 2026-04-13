import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUserGuard } from 'src/core/guards/auth-user/auth-user.guard';
import { SincronizacaoService } from './sincronizacao.service';

@UseGuards(AuthUserGuard)
@ApiTags('Sincronizacões')
@Controller('sincronizacoes')
export class SincronizacaoController {
  constructor(private readonly service: SincronizacaoService) {}

  @Get()
  @ApiOperation({ summary: 'Sincronizar Usuários' })
  getSincronizacaos() {
    return this.service.popularUsuarios();
  }
}

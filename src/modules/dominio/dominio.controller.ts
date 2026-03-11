import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUserGuard } from 'src/guards/auth-user/auth-user.guard';
import { DominioService } from './dominio.service';

@UseGuards(AuthUserGuard)
@ApiTags('Domínio')
@Controller('dominios')
export class DominioController {
  constructor(private readonly service: DominioService) {}

  @Get('status')
  @ApiOperation({ summary: 'Listar Status' })
  getStatus() {
    return this.service.getStatus();
  }

  @Get('tipo-movimento')
  @ApiOperation({ summary: 'Listar Tipo Movimento' })
  getTipoMovimento() {
    return this.service.getTipoMovimento();
  }

  @Get('tipo-operacao')
  @ApiOperation({ summary: 'Listar Tipo Operacao' })
  getTipoOperacao() {
    return this.service.getTipoOperacao();
  }

  @Get('tipo-entrega')
  @ApiOperation({ summary: 'Listar Tipo Entrega' })
  getTipoEntrega() {
    return this.service.getTipoEntrega();
  }
}

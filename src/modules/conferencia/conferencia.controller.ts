import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthUserGuard } from 'src/auth-user/auth-user.guard';
import { ConferenciaService } from './conferencia.service';
import { FilaConferenciaFilter } from './dto/conferencia.dto';

@UseGuards(AuthUserGuard)
@ApiTags('Conferências')
@Controller('conferencias')
export class ConferenciaController {
  constructor(private readonly service: ConferenciaService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas Filas de Conferências com Filtro' })
  @ApiQuery({ type: FilaConferenciaFilter })
  getFilaConferencias(@Query() queryParams: FilaConferenciaFilter) {
    return this.service.getFilaConferencias(queryParams);
  }

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

import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FilaConferenciaFilter } from './dto/fila-conferencia.dto';
import { FilaConferenciaService } from './fila-conferencia.service';

@ApiTags('Fila de Conferências')
@Controller('fila-conferencias')
export class FilaConferenciaController {
  constructor(private readonly service: FilaConferenciaService) {}

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

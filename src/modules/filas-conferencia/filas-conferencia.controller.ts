import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FilaConferenciaFilter } from './dto/filas-conferencia.dto';
import { FilasConferenciaService } from './filas-conferencia.service';

@ApiTags('Filas de Conferência')
@Controller('filas-conferencia')
export class FilasConferenciaController {
  constructor(private readonly service: FilasConferenciaService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas Filas de Conferência com Filtro' })
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

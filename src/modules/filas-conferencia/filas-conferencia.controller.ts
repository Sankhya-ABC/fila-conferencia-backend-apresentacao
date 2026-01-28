import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FilasConferenciaService } from './filas-conferencia.service';

@ApiTags('Filas de Conferência')
@Controller('filas-conferencia')
export class FilasConferenciaController {
  constructor(private readonly service: FilasConferenciaService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas Filas de Conferência com Filtro' })
  findAll() {
    return this.service.findAll();
  }
}

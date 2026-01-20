import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { FilasConferenciaService } from './filas-conferencia.service';
import { FilaConferenciaDTO } from './dto/filas-conferencia.dto';

@ApiTags('Filas de Conferência')
@Controller('filas-conferencia')
export class FilasConferenciaController {
  constructor(private readonly service: FilasConferenciaService) {}

  @Post()
  @ApiOperation({ summary: 'Criar Fila de Conferência' })
  @ApiResponse({
    status: 201,
    description: 'Fila de Conferência criada com sucesso',
  })
  create(@Body() dto: FilaConferenciaDTO) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas Filas de Conferência' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar Fila de Conferência por ID' })
  @ApiParam({ name: 'id', example: 'uuid' })
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar Fila de Conferência' })
  update(@Param('id') id: string, @Body() dto: FilaConferenciaDTO) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar Fila de Conferência' })
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}

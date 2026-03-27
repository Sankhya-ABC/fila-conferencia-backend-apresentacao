import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthUserGuard } from 'src/core/guards/auth-user/auth-user.guard';
import { ConferenciaService } from './conferencia.service';
import {
  FilaConferenciaFilter,
  IniciarConferenciaBody,
} from './dto/conferencia.dto';

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

  @Post('iniciar-conferencia')
  @ApiOperation({ summary: 'Iniciar Conferência de um Pedido' })
  postIniciarConferencia(@Body() body: IniciarConferenciaBody) {
    return this.service.postIniciarConferencia(body);
  }
}

import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUserGuard } from 'src/auth-user/auth-user.guard';
import {
  IniciarConferenciaBody,
  NumeroConferenciaFilter,
  NumeroUnicoFilter,
  PostItemConferidoVolume,
} from './dto/separacao.dto';
import { SeparacaoService } from './separacao.service';

@UseGuards(AuthUserGuard)
@ApiTags('Separacoes')
@Controller('separacoes')
export class SeparacaoController {
  constructor(private readonly service: SeparacaoService) {}

  @Post('iniciar-conferencia')
  @ApiOperation({ summary: 'Iniciar Conferência de um Pedido' })
  postIniciarConferencia(@Body() body: IniciarConferenciaBody) {
    return this.service.postIniciarConferencia(body);
  }

  @Post('item-conferido-volume')
  @ApiOperation({ summary: 'Iniciar Conferência de um Pedido' })
  postItemConferidoVolume(
    @Body()
    body: PostItemConferidoVolume,
  ) {
    return this.service.postItemConferidoVolume(body);
  }

  @Get('dados-basicos')
  @ApiOperation({ summary: 'Dados básicos do pedido' })
  getDadosBasicos(@Query() queryParam: NumeroUnicoFilter) {
    return this.service.getDadosBasicos(queryParam);
  }

  @Get('itens-pedidos')
  @ApiOperation({ summary: 'Listar Itens Pedidos' })
  getItensPedido(@Query() queryParam: NumeroUnicoFilter) {
    return this.service.getItensPedido(queryParam);
  }

  @Get('itens-conferidos')
  @ApiOperation({ summary: 'Listar Itens Conferidos' })
  getItensConferidos(@Query() queryParam: NumeroConferenciaFilter) {
    return this.service.getItensConferidos(queryParam);
  }

  @Get('volumes')
  @ApiOperation({ summary: 'Listar Volumes' })
  getVolumes(@Query() queryParam: NumeroConferenciaFilter) {
    return this.service.getVolumes(queryParam);
  }
}

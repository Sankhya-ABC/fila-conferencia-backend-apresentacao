import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthUserGuard } from 'src/auth-user/auth-user.guard';
import { SeparacaoService } from './separacao.service';
import {
  IdAndControleProdutoFilter,
  NumeroUnicoFilter,
  IniciarConferenciaBody,
  NumeroConferenciaFilter,
} from './dto/separacao.dto';

@UseGuards(AuthUserGuard)
@ApiTags('Separacoes')
@Controller('separacoes')
export class SeparacaoController {
  constructor(private readonly service: SeparacaoService) {}

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

  @Get('codigos-barra')
  @ApiOperation({ summary: 'Listar Códigos de Barra de um Produto' })
  getCodigosDeBarra(@Query() queryParam: IdAndControleProdutoFilter) {
    return this.service.getCodigosDeBarra(queryParam);
  }

  @Post('iniciar-conferencia')
  @ApiOperation({ summary: 'Iniciar Conferência de um Pedido' })
  postIniciarConferencia(@Body() body: IniciarConferenciaBody) {
    return this.service.postIniciarConferencia(body);
  }
}

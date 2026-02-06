import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUserGuard } from 'src/auth-user/auth-user.guard';
import { SeparacaoService } from './separacao.service';
import {
  IdAndControleProdutoFilter,
  NumeroUnicoFilter,
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

  @Get('codigos-barra')
  @ApiOperation({ summary: 'Listar Códigos de Barra de um Produto' })
  getCodigosDeBarra(@Query() queryParam: IdAndControleProdutoFilter) {
    return this.service.getCodigosDeBarra(queryParam);
  }
}

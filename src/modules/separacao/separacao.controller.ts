import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUserGuard } from 'src/core/guards/auth-user/auth-user.guard';
import {
  PostAtualizarDimensoesVolumeParams,
  PostDevolverItemConferido,
  PostItemConferidoVolume,
  PostRemoverVolumeParams,
} from './dto/separacao.dto';
import { SeparacaoService } from './separacao.service';
import { NumeroConferenciaFilter, NumeroUnicoFilter } from '../dto/model';

@UseGuards(AuthUserGuard)
@ApiTags('Separacoes')
@Controller('separacoes')
export class SeparacaoController {
  constructor(private readonly service: SeparacaoService) {}

  @Post('item-conferido-volume')
  @ApiOperation({ summary: 'Iniciar Conferência de um Pedido' })
  postItemConferidoVolume(
    @Body()
    body: PostItemConferidoVolume,
  ) {
    return this.service.postItemConferidoVolume(body);
  }

  @Post('remover-volume')
  @ApiOperation({ summary: 'Remover Volume' })
  postRemoverVolume(
    @Body()
    body: PostRemoverVolumeParams,
  ) {
    return this.service.postRemoverVolume(body);
  }

  @Post('devolver-item-conferido')
  postDevolverItemConferido(@Body() body: PostDevolverItemConferido) {
    return this.service.postDevolverItemConferido(body);
  }

  @Post('dimensoes-volume')
  postAtualizarDimensoesVolume(
    @Body() body: PostAtualizarDimensoesVolumeParams,
  ) {
    return this.service.postAtualizarDimensoesVolume(body);
  }

  @Post('deletar-volume-lote')
  @ApiOperation({ summary: 'Deletar volume lote' })
  postDeletarVolumeLote(@Body() body: any) {
    return this.service.deletarVolumeLote(body);
  }

  @Post('dimensoes-volume-lote')
  @ApiOperation({ summary: 'Atualizar dimensões de lote de volumes' })
  postAtualizarDimensoesVolumeLote(@Body() body: any) {
    return this.service.salvarDimensoesVolumeLote(body);
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
}

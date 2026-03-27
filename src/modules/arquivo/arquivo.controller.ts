import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';
import { AuthUserGuard } from 'src/core/guards/auth-user/auth-user.guard';
import { NumeroConferenciaFilter } from '../dto/model';
import { ArquivoService } from './arquivo.service';

@UseGuards(AuthUserGuard)
@ApiTags('Arquivos')
@Controller('arquivos')
export class ArquivoController {
  constructor(private readonly service: ArquivoService) {}

  @Get('etiqueta/download')
  @ApiOperation({ summary: 'Baixar Etiquetas' })
  async downloadEtiqueta(
    @Query() queryParam: NumeroConferenciaFilter,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    const pdfBuffer = await this.service.downloadEtiqueta(queryParam);

    if (!pdfBuffer) {
      reply.status(404).send('Nenhuma etiqueta encontrada');
      return;
    }

    reply
      .type('application/pdf')
      .header(
        'Content-Disposition',
        `attachment; filename=etiquetas_conferencia_${queryParam.numeroConferencia}.pdf`,
      )
      .send(pdfBuffer);
  }
}

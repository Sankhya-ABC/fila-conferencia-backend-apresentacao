import { BadRequestException, Injectable } from '@nestjs/common';
import { SankhyaDBExplorerSPClient } from 'src/http-client/db-explorer-sp/db-explorer-sp.client';
import { NumeroConferenciaFilter, NumeroUnicoFilter } from '../dto/model';
import { SankhyaDatasetSPClient } from 'src/http-client/dataset-sp/dataset-sp.client';
import {
  AtualizarCabecalhoConferenciaParams,
  AtualizarCabecalhoNotaParams,
} from './dto/conferencia.dto';

@Injectable()
export class ConferenciaHelper {
  constructor(
    private readonly dbExplorerClient: SankhyaDBExplorerSPClient,
    private readonly datasetSP: SankhyaDatasetSPClient,
  ) {}

  async verificarStatus({ numeroUnico }: NumeroUnicoFilter) {
    let status: string;

    try {
      const res = await this.dbExplorerClient.executeQuery(`
      SELECT sankhya.SNK_GET_SATUSCONFERENCIA(${numeroUnico}) AS STATUS
      FROM DUAL
    `);
      status = res?.[0]?.STATUS;
    } catch {
      throw new BadRequestException('Erro ao consultar status da conferência.');
    }

    if (status !== 'AC') {
      throw new BadRequestException(
        'Para iniciar a conferência, o pedido deve estar com status "Aguardando Conferência".',
      );
    }
  }

  async verificarConferencia({ numeroUnico }: NumeroUnicoFilter) {
    const existente = await this.dbExplorerClient.executeQuery(`
      SELECT NUCONF
      FROM TGFCON2
      WHERE NUNOTAORIG = ${numeroUnico}
        AND NUCONF IS NOT NULL
        AND STATUS = 'A'
    `);

    if (existente.length > 0) {
      throw new BadRequestException(
        `Já existe conferência em andamento (NUCONF ${existente[0].NUCONF}).`,
      );
    }
  }

  async obterNumeroConferencia() {
    try {
      const res = await this.dbExplorerClient.executeQuery(`
        SELECT ULTCOD
        FROM TGFNUM
        WHERE ARQUIVO = 'TGFCON2'
          AND CODEMP = 1
          AND SERIE = '.'
      `);

      return res[0].ULTCOD + 1;
    } catch {
      throw new BadRequestException('Erro ao obter número de conferência.');
    }
  }

  async atualizarNumeroConferencia({
    numeroConferencia,
  }: NumeroConferenciaFilter) {
    try {
      await this.datasetSP.save({
        entityName: 'ControleNumeracao',
        pk: {
          ARQUIVO: 'TGFCON2',
          CODEMP: 1,
          SERIE: '.',
          CODMODDOC: 0,
        },
        fieldsAndValues: {
          ULTCOD: numeroConferencia,
        },
      });
    } catch {
      throw new BadRequestException('Erro ao atualizar controle de numeração.');
    }
  }

  async atualizarCabecalhoConferencia({
    numeroUnico,
    numeroConferencia,
    idUsuario,
  }: AtualizarCabecalhoConferenciaParams) {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).split('-').reverse().join('/');
    const hour = now.toISOString().slice(11, 16);

    try {
      await this.datasetSP.save({
        entityName: 'CabecalhoConferencia',
        fieldsAndValues: {
          NUCONF: numeroConferencia,
          CODUSUCONF: idUsuario,
          DHINICONF: `${date} ${hour}`,
          DHFINCONF: null,
          NUNOTAORIG: numeroUnico,
          QTDVOL: 0,
          STATUS: 'A',
        },
      });
    } catch {
      throw new BadRequestException('Erro ao criar cabeçalho da conferência.');
    }
  }

  async atualizarCabecalhoNota({
    numeroUnico,
    numeroConferencia,
  }: AtualizarCabecalhoNotaParams) {
    try {
      await this.datasetSP.save({
        entityName: 'CabecalhoNota',
        pk: {
          NUNOTA: numeroUnico,
        },
        fieldsAndValues: {
          NUCONFATUAL: numeroConferencia,
        },
      });
    } catch {
      throw new BadRequestException(
        'Erro ao vincular conferência ao cabeçalho da nota.',
      );
    }
  }
}

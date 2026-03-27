import { BadRequestException, Injectable } from '@nestjs/common';
import { SankhyaDBExplorerSPClient } from 'src/http-client/db-explorer-sp/db-explorer-sp.client';
import { NumeroConferenciaFilter } from '../dto/model';

@Injectable()
export class ArquivoHelper {
  constructor(private readonly dbExplorerClient: SankhyaDBExplorerSPClient) {}

  async isCubagemNaoDetalhada({ numeroConferencia }: NumeroConferenciaFilter) {
    try {
      const sql = `
      SELECT 
      CAB.TIPMOV AS codigoTipoMovimento, 
      TPO.DESCROPER AS descricaoTipoOperacao 

      FROM TGFCAB CAB 

      LEFT JOIN TGFTOP TPO 
      ON TPO.CODTIPOPER = CAB.CODTIPOPER 
      AND TPO.DHALTER = CAB.DHTIPOPER 

      WHERE CAB.NUCONFATUAL = ${numeroConferencia} 
    `;
      const response = await this.dbExplorerClient.executeQuery(sql);

      const { codigoTipoMovimento, descricaoTipoOperacao } =
        response?.[0] || {};

      const isCubagemNaoDetalhadaFlag =
        codigoTipoMovimento === 'P' &&
        descricaoTipoOperacao === 'CUBAGEM DE PEDIDO';

      return isCubagemNaoDetalhadaFlag;
    } catch {
      throw new BadRequestException(
        'Erro ao obter informações da conferência.',
      );
    }
  }

  async obterCubagemNaoDetalhada({
    numeroConferencia,
  }: NumeroConferenciaFilter) {
    try {
      const sql = `
      SELECT
        CUB.SEQVOL AS seqVol,

        CAB.NUNOTA AS numeroUnico,
        CAB.NUMNOTA AS notaFiscal,
        CAB.UFADQUIRENTE AS uf,

        PAR.RAZAOSOCIAL AS cliente

      FROM AD_CUBAGEM CUB

      JOIN TGFCON2 CON
        ON CON.NUCONF = CUB.NUCONF

      JOIN TGFCAB CAB
        ON CAB.NUNOTA = CON.NUNOTAORIG

      JOIN TGFPAR PAR
        ON PAR.CODPARC = CAB.CODPARC

      WHERE CUB.NUCONF = ${numeroConferencia}
        AND CUB.ALTURA IS NOT NULL
        AND CUB.LARGURA IS NOT NULL
        AND CUB.COMPRIMENTO IS NOT NULL
        AND CUB.PESO IS NOT NULL

      ORDER BY CUB.SEQVOL ASC
    `;
      const response = await this.dbExplorerClient.executeQuery(sql);
      return response;
    } catch {
      throw new BadRequestException(
        'Erro ao obter informações da cubagem não detalhada.',
      );
    }
  }

  async obterCubagemDetalhada({ numeroConferencia }: NumeroConferenciaFilter) {
    try {
      const sql = `
      SELECT DISTINCT
        IVC.SEQVOL AS seqVol,

        CAB.NUNOTA AS numeroUnico,
        CAB.NUMNOTA AS notaFiscal,
        CAB.UFADQUIRENTE AS uf,

        PAR.RAZAOSOCIAL AS cliente

      FROM TGFIVC IVC

      JOIN TGFCON2 CON
        ON CON.NUCONF = IVC.NUCONF

      JOIN TGFCAB CAB
        ON CAB.NUNOTA = CON.NUNOTAORIG

      JOIN TGFPAR PAR
        ON PAR.CODPARC = CAB.CODPARC

      WHERE IVC.NUCONF = ${numeroConferencia}
        AND IVC.QTD > 0

      ORDER BY IVC.SEQVOL ASC
    `;
      const response = await this.dbExplorerClient.executeQuery(sql);
      return response;
    } catch {
      throw new BadRequestException(
        'Erro ao obter informações da cubagem detalhada.',
      );
    }
  }
}

import { BadRequestException, Injectable } from '@nestjs/common';
import { SankhyaDBExplorerSPClient } from 'src/http-client/db-explorer-sp/db-explorer-sp.client';
import { ArquivoHelper } from '../arquivo/arquivo.helper';
import { NumeroConferenciaFilter } from '../dto/model';

@Injectable()
export class VolumeHelper {
  constructor(
    private readonly dbExplorerClient: SankhyaDBExplorerSPClient,
    private readonly arquivoHelper: ArquivoHelper,
  ) {}

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

  async obterVolumesNaoDetalhados({
    numeroConferencia,
  }: NumeroConferenciaFilter) {
    const sql = `
    SELECT
      COUNT(*) AS quantidadeLote,
      CUB.ALTURA AS altura,
      CUB.LARGURA AS largura,
      CUB.COMPRIMENTO AS comprimento,
      CUB.PESO AS peso
    FROM AD_CUBAGEM CUB
    WHERE CUB.NUCONF = ${numeroConferencia}
    AND (
      ALTURA IS NOT NULL
      OR LARGURA IS NOT NULL
      OR COMPRIMENTO IS NOT NULL
      OR PESO IS NOT NULL
    )
    GROUP BY
      CUB.ALTURA,
      CUB.LARGURA,
      CUB.COMPRIMENTO,
      CUB.PESO
  `;

    const rows = await this.dbExplorerClient.executeQuery(sql);

    if (!rows?.length) return [];

    return rows.map((row) => ({
      numeroVolume: null,
      quantidadeLote: Number(row.quantidadeLote) || 0,
      altura: row.altura ?? null,
      largura: row.largura ?? null,
      comprimento: row.comprimento ?? null,
      peso: row.peso ?? null,
      itens: [],
    }));
  }

  async obterVolumesDetalhados({ numeroConferencia }: NumeroConferenciaFilter) {
    const sql = `
    SELECT 
      IVC.SEQVOL AS numeroVolume,
      IVC.CODPROD AS idProduto,
      PRO.DESCRPROD AS descricaoProduto,
      IVC.QTD AS quantidadeConvertida,
      IVC.CODVOL AS unidade,
      COALESCE(IVC.CONTROLE,' ') AS controle,

      ITE.QTDNEG,

      CASE 
        WHEN VOA.DIVIDEMULTIPLICA IS NULL THEN ITE.QTDNEG
        WHEN VOA.DIVIDEMULTIPLICA = 'D' THEN ITE.QTDNEG * VOA.QUANTIDADE
        WHEN VOA.DIVIDEMULTIPLICA = 'M' THEN ITE.QTDNEG / VOA.QUANTIDADE
        ELSE ITE.QTDNEG
      END AS QTD_CONVERTIDA_PEDIDO,

      CUB.ALTURA      AS altura,
      CUB.LARGURA     AS largura,
      CUB.COMPRIMENTO AS comprimento,
      CUB.PESO        AS peso

    FROM TGFIVC IVC

    JOIN TGFPRO PRO
      ON PRO.CODPROD = IVC.CODPROD

    JOIN TGFCON2 CON
      ON CON.NUCONF = IVC.NUCONF

    JOIN TGFITE ITE
      ON ITE.NUNOTA = CON.NUNOTAORIG
    AND ITE.CODPROD = IVC.CODPROD

    LEFT JOIN TGFVOA VOA
      ON VOA.CODPROD = ITE.CODPROD
    AND VOA.CODVOL = ITE.CODVOL
    AND COALESCE(VOA.CONTROLE,' ') = COALESCE(ITE.CONTROLE,' ')

    LEFT JOIN (
      SELECT
        NUCONF,
        SEQVOL,
        MAX(ALTURA) AS ALTURA,
        MAX(LARGURA) AS LARGURA,
        MAX(COMPRIMENTO) AS COMPRIMENTO,
        MAX(PESO) AS PESO
      FROM AD_CUBAGEM
      GROUP BY NUCONF, SEQVOL
    ) CUB
      ON CUB.NUCONF = IVC.NUCONF
    AND CUB.SEQVOL = IVC.SEQVOL

    WHERE IVC.NUCONF = ${numeroConferencia}
      AND IVC.QTD > 0

    ORDER BY IVC.SEQVOL DESC, IVC.SEQITEM
`;

    let response = await this.dbExplorerClient.executeQuery(sql);

    response = await Promise.all(
      response?.map(async (data) => {
        const { idProduto } = data;

        let imagem = null;
        try {
          imagem = await this.arquivoHelper.obterImagemProduto(idProduto);
        } catch {}

        let fatorConversao = 1;

        if (data.QTD_CONVERTIDA_PEDIDO && data.QTD_CONVERTIDA_PEDIDO !== 0) {
          fatorConversao = data.QTDNEG / data.QTD_CONVERTIDA_PEDIDO;
        }

        const quantidadeBase = Number(
          (data.quantidadeConvertida * fatorConversao).toFixed(5),
        );

        return {
          ...data,
          quantidadeBase,
          imagem,
        };
      }),
    );

    const volumeMap = new Map<number, any>();

    for (const item of response) {
      if (!volumeMap.has(item.numeroVolume)) {
        volumeMap.set(item.numeroVolume, {
          numeroVolume: item.numeroVolume,
          altura: item.altura ?? null,
          largura: item.largura ?? null,
          comprimento: item.comprimento ?? null,
          peso: item.peso ?? null,
          itens: [],
        });
      }

      volumeMap.get(item.numeroVolume).itens.push({
        idProduto: item.idProduto,
        descricaoProduto: item.descricaoProduto,
        imagem: item.imagem,
        quantidadeConvertida: item.quantidadeConvertida,
        quantidadeBase: item.quantidadeBase,
        unidade: item.unidade,
        controle: item.controle ?? '',
      });
    }

    return Array.from(volumeMap.values());
  }
}

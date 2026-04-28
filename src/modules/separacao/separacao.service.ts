import { Injectable } from '@nestjs/common';
import { SankhyaDatasetSPClient } from 'src/http-client/dataset-sp/dataset-sp.client';
import { SankhyaDBExplorerSPClient } from 'src/http-client/db-explorer-sp/db-explorer-sp.client';
import { ArquivoHelper } from '../arquivo/arquivo.helper';
import { NumeroConferenciaFilter, NumeroUnicoFilter } from '../dto/model';
import { PostItemConferidoVolume } from './dto/separacao.dto';
import { SeparacaoHelper } from './separacao.helper';

@Injectable()
export class SeparacaoService {
  constructor(
    private readonly dbExplorerClient: SankhyaDBExplorerSPClient,
    private readonly datasetSP: SankhyaDatasetSPClient,
    private readonly arquivoHelper: ArquivoHelper,
    private readonly separacaoHelper: SeparacaoHelper,
  ) {}

  async postItemConferidoVolume({
    numeroConferencia,
    numeroVolume,
    idProduto,
    controle,
    quantidadeConvertida,
    unidade,
  }: PostItemConferidoVolume) {
    await this.separacaoHelper.garantirVolume({
      numeroConferencia,
      numeroVolume,
    });

    const { existe, qtdAtual, seqItem } =
      await this.separacaoHelper.verificarItemConferidoVolume({
        numeroConferencia,
        numeroVolume,
        idProduto,
        controle,
      });

    if (existe) {
      await this.separacaoHelper.atualizarItemConferidoVolume({
        numeroConferencia,
        numeroVolume,
        seqItem: seqItem,
        quantidadeConvertida: qtdAtual + quantidadeConvertida,
      });
    } else {
      await this.separacaoHelper.inserirItemConferidoVolume({
        numeroConferencia,
        numeroVolume,
        idProduto,
        controle,
        quantidadeConvertida,
        unidade,
      });
    }

    await this.separacaoHelper.normalizarVolumes(numeroConferencia);
  }

  async postRemoverVolume({
    numeroConferencia,
    numeroVolume,
  }: {
    numeroConferencia: number;
    numeroVolume: number;
  }) {
    const itensVolume = await this.dbExplorerClient.executeQuery(`
    SELECT SEQITEM, CODPROD, CONTROLE, QTD
    FROM TGFIVC
    WHERE NUCONF = ${numeroConferencia}
      AND SEQVOL = ${numeroVolume}
  `);

    if (!itensVolume?.length) {
      return;
    }

    for (const item of itensVolume) {
      await this.datasetSP.save({
        entityName: 'ItemVolumeConferencia',
        pk: {
          NUCONF: numeroConferencia,
          SEQVOL: numeroVolume,
          SEQITEM: item.SEQITEM,
        },
        fieldsAndValues: {
          CODPROD: null,
          CONTROLE: null,
          QTD: null,
          CODVOL: null,
        },
      });
    }

    const existenteCubagem = await this.dbExplorerClient.executeQuery(`
    SELECT NUCUBAGEM
    FROM AD_CUBAGEM
    WHERE NUCONF = ${numeroConferencia}
      AND SEQVOL = ${numeroVolume}
  `);

    if (existenteCubagem.length > 0) {
      await this.datasetSP.save({
        entityName: 'AD_CUBAGEM',
        pk: {
          NUCUBAGEM: existenteCubagem[0].NUCUBAGEM,
        },
        fieldsAndValues: {
          ALTURA: null,
          LARGURA: null,
          COMPRIMENTO: null,
          PESO: null,
        },
      });

      return;
    }

    await this.separacaoHelper.normalizarVolumes(numeroConferencia);
  }

  async postDevolverItemConferido({
    numeroConferencia,
    idProduto,
    controle,
  }: {
    numeroConferencia: number;
    idProduto: number;
    controle: string;
  }) {
    const controleNormalizado = controle?.trim() || ' ';

    const itensVolumes = await this.dbExplorerClient.executeQuery(`
    SELECT SEQVOL, SEQITEM
    FROM TGFIVC
    WHERE NUCONF = ${numeroConferencia}
      AND CODPROD = ${idProduto}
      AND COALESCE(CONTROLE, ' ') = '${controleNormalizado}'
      AND QTD > 0
  `);

    if (!itensVolumes.length) return;

    for (const item of itensVolumes) {
      await this.datasetSP.save({
        entityName: 'ItemVolumeConferencia',
        pk: {
          NUCONF: numeroConferencia,
          SEQVOL: item.SEQVOL,
          SEQITEM: item.SEQITEM,
        },
        fieldsAndValues: {
          CODPROD: null,
          CONTROLE: null,
          QTD: null,
          CODVOL: null,
        },
      });
    }

    await this.separacaoHelper.normalizarVolumes(numeroConferencia);
  }

  async getItensPedido({ numeroUnico }: NumeroUnicoFilter) {
    const sql = `
    SELECT 
        ITE.CODPROD AS "idProduto",
        PRO.DESCRPROD AS "nomeProduto",

        ROUND(ITE.QTDNEG,5) AS "quantidadeBase",

        ROUND(
          CASE 
            WHEN VOA.DIVIDEMULTIPLICA IS NULL THEN ITE.QTDNEG
            WHEN VOA.DIVIDEMULTIPLICA = 'D' THEN ITE.QTDNEG * VOA.QUANTIDADE
            WHEN VOA.DIVIDEMULTIPLICA = 'M' THEN ITE.QTDNEG / VOA.QUANTIDADE
            ELSE ITE.QTDNEG
          END
        ,5) AS "quantidadeConvertida",

        ROUND(COALESCE(ITE.QTDCONFERIDA,0),5) AS "quantidadeBaseConferida",

        ROUND(
          CASE 
            WHEN VOA.DIVIDEMULTIPLICA IS NULL THEN COALESCE(ITE.QTDCONFERIDA,0)
            WHEN VOA.DIVIDEMULTIPLICA = 'D' THEN COALESCE(ITE.QTDCONFERIDA,0) * VOA.QUANTIDADE
            WHEN VOA.DIVIDEMULTIPLICA = 'M' THEN COALESCE(ITE.QTDCONFERIDA,0) / VOA.QUANTIDADE
            ELSE COALESCE(ITE.QTDCONFERIDA,0)
          END
        ,5) AS "quantidadeConvertidaConferida",

        ITE.CODVOL AS "unidade",

        PRO.CODMARCA AS "idMarca",
        PRO.MARCA AS "nomeMarca",

        PAR.CODPARC AS "idFornecedor",
        PAR.NOMEPARC AS "nomeFornecedor",

        COALESCE(ITE.CONTROLE,' ') AS "controle",
        PRO.COMPLDESC AS "complemento"

    FROM TGFITE ITE

    LEFT JOIN TGFPRO PRO 
      ON PRO.CODPROD = ITE.CODPROD

    LEFT JOIN TGFPAR PAR 
      ON PAR.CODPARC = PRO.CODPARCFORN

    LEFT JOIN TGFVOA VOA 
      ON VOA.CODPROD = ITE.CODPROD
    AND VOA.CODVOL = ITE.CODVOL
    AND COALESCE(VOA.CONTROLE,' ') = COALESCE(ITE.CONTROLE,' ')

    WHERE ITE.NUNOTA = ${numeroUnico}
      AND (ITE.QTDNEG - COALESCE(ITE.QTDCONFERIDA, 0)) > 0
  `;

    let response = await this.dbExplorerClient.executeQuery(sql);

    response = await Promise.all(
      response?.map(async (data) => {
        const { idProduto, controle } = data;

        let imagem = null;
        try {
          imagem = await this.arquivoHelper.obterImagemProduto(idProduto);
        } catch (error) {
          //
        }

        let codigoBarras = [];
        try {
          const codigos = await this.separacaoHelper.obterCodigosDeBarra({
            idProduto,
            controle,
          });

          codigoBarras = codigos?.map((codigoBarra) =>
            codigoBarra.CODIGO?.trim(),
          );
        } catch (error) {
          //
        }

        return { ...data, codigoBarras, imagem };
      }),
    );

    return response;
  }

  async getItensConferidos({ numeroConferencia }: NumeroConferenciaFilter) {
    const sql = `
    SELECT
      CODPROD AS "idProduto",
      CONTROLE AS "controle",
      SUM(QTD) AS "quantidadeConvertida"

    FROM TGFIVC

    WHERE NUCONF = ${numeroConferencia}
      AND QTD > 0
    GROUP BY CODPROD, CONTROLE
  `;
    const response = await this.dbExplorerClient.executeQuery(sql);
    return response;
  }
}

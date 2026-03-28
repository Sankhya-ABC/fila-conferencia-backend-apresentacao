import { Injectable } from '@nestjs/common';
import { SankhyaDatasetSPClient } from 'src/http-client/dataset-sp/dataset-sp.client';
import { SankhyaDBExplorerSPClient } from 'src/http-client/db-explorer-sp/db-explorer-sp.client';
import { ArquivoHelper } from '../arquivo/arquivo.helper';
import { NumeroConferenciaFilter, NumeroUnicoFilter } from '../dto/model';
import {
  IdAndControleProdutoFilter,
  PostAtualizarDimensoesVolumeNaoDetalhadoLoteParams,
  PostItemConferidoVolume,
} from './dto/separacao.dto';

@Injectable()
export class SeparacaoService {
  constructor(
    private readonly dbExplorerClient: SankhyaDBExplorerSPClient,
    private readonly datasetSP: SankhyaDatasetSPClient,
    private readonly arquivoHelper: ArquivoHelper,
  ) {}

  async postItemConferidoVolume({
    numeroConferencia,
    numeroVolume,
    idProduto,
    controle,
    quantidadeConvertida,
    unidade,
  }: PostItemConferidoVolume) {
    await this.garantirVolume({ numeroConferencia, numeroVolume });

    const { existe, qtdAtual, seqItem } =
      await this.verificarItemConferidoVolume({
        numeroConferencia,
        numeroVolume,
        idProduto,
        controle,
      });

    if (existe) {
      await this.atualizarItemConferidoVolume({
        numeroConferencia,
        numeroVolume,
        seqItem: seqItem,
        quantidadeConvertida: qtdAtual + quantidadeConvertida,
      });
    } else {
      await this.inserirItemConferidoVolume({
        numeroConferencia,
        numeroVolume,
        idProduto,
        controle,
        quantidadeConvertida,
        unidade,
      });
    }

    await this.normalizarVolumes(numeroConferencia);
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

    await this.normalizarVolumes(numeroConferencia);
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

    const restante = await this.dbExplorerClient.executeQuery(`
    SELECT SUM(QTD) AS TOTAL
    FROM TGFIVC
    WHERE NUCONF = ${numeroConferencia}
      AND CODPROD = ${idProduto}
      AND COALESCE(CONTROLE, ' ') = '${controleNormalizado}'
      AND QTD > 0
  `);

    const novoTotal = Number(restante?.[0]?.TOTAL || 0);

    await this.normalizarVolumes(numeroConferencia);
  }

  async getItensPedido({ numeroUnico }: NumeroUnicoFilter) {
    const sql = `
    SELECT 
        ITE.CODPROD AS idProduto,
        PRO.DESCRPROD AS nomeProduto,

        ROUND(ITE.QTDNEG,5) AS quantidadeBase,

        ROUND(
          CASE 
            WHEN VOA.DIVIDEMULTIPLICA IS NULL THEN ITE.QTDNEG
            WHEN VOA.DIVIDEMULTIPLICA = 'D' THEN ITE.QTDNEG * VOA.QUANTIDADE
            WHEN VOA.DIVIDEMULTIPLICA = 'M' THEN ITE.QTDNEG / VOA.QUANTIDADE
            ELSE ITE.QTDNEG
          END
        ,5) AS quantidadeConvertida,

        ROUND(COALESCE(ITE.QTDCONFERIDA,0),5) AS quantidadeBaseConferida,

        ROUND(
          CASE 
            WHEN VOA.DIVIDEMULTIPLICA IS NULL THEN COALESCE(ITE.QTDCONFERIDA,0)
            WHEN VOA.DIVIDEMULTIPLICA = 'D' THEN COALESCE(ITE.QTDCONFERIDA,0) * VOA.QUANTIDADE
            WHEN VOA.DIVIDEMULTIPLICA = 'M' THEN COALESCE(ITE.QTDCONFERIDA,0) / VOA.QUANTIDADE
            ELSE COALESCE(ITE.QTDCONFERIDA,0)
          END
        ,5) AS quantidadeConvertidaConferida,

        ITE.CODVOL AS unidade,

        PRO.CODMARCA AS idMarca,
        PRO.MARCA AS nomeMarca,

        PAR.CODPARC AS idFornecedor,
        PAR.NOMEPARC AS nomeFornecedor,

        COALESCE(ITE.CONTROLE,' ') AS controle,
        PRO.COMPLDESC AS complemento

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
          const codigos = await this.obterCodigosDeBarra({
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
      CODPROD AS idProduto,
      CONTROLE AS controle,
      SUM(QTD) AS quantidadeConvertida

    FROM TGFIVC

    WHERE NUCONF = ${numeroConferencia}
      AND QTD > 0
    GROUP BY CODPROD, CONTROLE
  `;
    const response = await this.dbExplorerClient.executeQuery(sql);
    return response;
  }

  async deletarVolumeLote({
    numeroConferencia,
    altura,
    largura,
    comprimento,
    peso,
  }) {
    const sql = `
    SELECT NUCUBAGEM
    FROM AD_CUBAGEM
    WHERE NUCONF = ${numeroConferencia}
      AND ALTURA = ${altura}
      AND LARGURA = ${largura}
      AND COMPRIMENTO = ${comprimento}
      AND PESO = ${peso}
  `;

    const rows = await this.dbExplorerClient.executeQuery(sql);

    for (const row of rows) {
      await this.datasetSP.save({
        entityName: 'AD_CUBAGEM',
        pk: {
          NUCUBAGEM: row.NUCUBAGEM,
        },
        fieldsAndValues: {
          ALTURA: null,
          LARGURA: null,
          COMPRIMENTO: null,
          PESO: null,
        },
      });
    }
  }

  async postAtualizarDimensoesVolumeNaoDetalhadoLote({
    numeroConferencia,
    alturaAntiga,
    larguraAntiga,
    comprimentoAntigo,
    pesoAntigo,
    altura,
    largura,
    comprimento,
    peso,
  }: PostAtualizarDimensoesVolumeNaoDetalhadoLoteParams) {
    const sql = `
    SELECT NUCUBAGEM
    FROM AD_CUBAGEM
    WHERE NUCONF = ${numeroConferencia}
      AND ALTURA = ${alturaAntiga}
      AND LARGURA = ${larguraAntiga}
      AND COMPRIMENTO = ${comprimentoAntigo}
      AND PESO = ${pesoAntigo}
  `;

    const rows = await this.dbExplorerClient.executeQuery(sql);

    for (const row of rows) {
      await this.datasetSP.save({
        entityName: 'AD_CUBAGEM',
        pk: {
          NUCUBAGEM: row.NUCUBAGEM,
        },
        fieldsAndValues: {
          ALTURA: altura,
          LARGURA: largura,
          COMPRIMENTO: comprimento,
          PESO: peso,
        },
      });
    }
  }

  // auxiliares
  async obterCodigosDeBarra({
    idProduto,
    controle,
  }: IdAndControleProdutoFilter) {
    const sql = `
    SELECT 
    DISTINCT 
    VW_CP.CODIGO 

    FROM VW_CODIGOS_PRODUTO VW_CP 

    WHERE VW_CP.CODPROD = ${idProduto} AND VW_CP.CONTROLE = '${controle}' 
    `;
    const response = await this.dbExplorerClient.executeQuery(sql);
    return response;
  }

  async garantirVolume({
    numeroConferencia,
    numeroVolume,
  }: {
    numeroConferencia: number;
    numeroVolume: number;
  }) {
    const existe = await this.dbExplorerClient.executeQuery(`
    SELECT 1
    FROM TGFVCF
    WHERE NUCONF = ${numeroConferencia}
      AND SEQVOL = ${numeroVolume}
  `);

    if (existe.length === 0) {
      await this.datasetSP.save({
        entityName: 'VolumeConferencia',
        fieldsAndValues: {
          NUCONF: numeroConferencia,
          SEQVOL: numeroVolume,
        },
      });
    }
  }

  async verificarItemConferidoVolume({
    numeroConferencia,
    numeroVolume,
    idProduto,
    controle,
  }: {
    numeroConferencia: number;
    numeroVolume: number;
    idProduto: number;
    controle: string;
  }) {
    const resp = await this.dbExplorerClient.executeQuery(`
    SELECT SEQITEM, QTD
    FROM TGFIVC
    WHERE NUCONF = ${numeroConferencia}
      AND SEQVOL = ${numeroVolume}
      AND CODPROD = ${idProduto}
      AND COALESCE(CONTROLE, ' ') = '${controle ?? ' '}'
  `);

    if (resp.length > 0) {
      return {
        existe: true,
        seqItem: resp[0].SEQITEM,
        qtdAtual: resp[0].QTD,
      };
    }

    return {
      existe: false,
      seqItem: null,
      qtdAtual: null,
    };
  }

  async atualizarItemConferidoVolume({
    numeroConferencia,
    numeroVolume,
    seqItem,
    quantidadeConvertida,
  }: {
    numeroConferencia: number;
    numeroVolume: number;
    seqItem: number;
    quantidadeConvertida: number;
  }) {
    await this.datasetSP.save({
      entityName: 'ItemVolumeConferencia',
      pk: {
        NUCONF: numeroConferencia,
        SEQVOL: numeroVolume,
        SEQITEM: seqItem,
      },
      fieldsAndValues: {
        QTD: quantidadeConvertida,
      },
    });
  }

  async inserirItemConferidoVolume({
    numeroConferencia,
    numeroVolume,
    idProduto,
    controle,
    quantidadeConvertida,
    unidade,
  }: {
    numeroConferencia: number;
    numeroVolume: number;
    idProduto: number;
    controle: string;
    quantidadeConvertida: number;
    unidade: string;
  }) {
    const slot = await this.dbExplorerClient.executeQuery(`
    SELECT 
      SEQITEM,
      CODPROD
    FROM TGFIVC
    WHERE NUCONF = ${numeroConferencia}
      AND SEQVOL = ${numeroVolume}
    ORDER BY SEQITEM
  `);

    let seqItemLivre = null;

    for (const row of slot) {
      if (row.CODPROD === null) {
        seqItemLivre = row.SEQITEM;
        break;
      }
    }

    if (seqItemLivre) {
      return await this.datasetSP.save({
        entityName: 'ItemVolumeConferencia',
        pk: {
          NUCONF: numeroConferencia,
          SEQVOL: numeroVolume,
          SEQITEM: seqItemLivre,
        },
        fieldsAndValues: {
          CODPROD: idProduto,
          CONTROLE: controle,
          QTD: quantidadeConvertida,
          CODVOL: unidade,
        },
      });
    }

    const prox = await this.dbExplorerClient.executeQuery(`
    SELECT COALESCE(MAX(SEQITEM),0) + 1 AS SEQITEM
    FROM TGFIVC
    WHERE NUCONF = ${numeroConferencia}
      AND SEQVOL = ${numeroVolume}
  `);

    const seqItemNovo = prox[0].SEQITEM;

    return await this.datasetSP.save({
      entityName: 'ItemVolumeConferencia',
      fieldsAndValues: {
        NUCONF: numeroConferencia,
        SEQVOL: numeroVolume,
        SEQITEM: seqItemNovo,
        CODPROD: idProduto,
        CONTROLE: controle,
        QTD: quantidadeConvertida,
        CODVOL: unidade,
      },
    });
  }

  async normalizarVolumes(numeroConferencia: number) {
    const volumes = await this.dbExplorerClient.executeQuery(`
    SELECT DISTINCT SEQVOL
    FROM TGFIVC
    WHERE NUCONF = ${numeroConferencia}
      AND QTD > 0
    ORDER BY SEQVOL
  `);

    if (!volumes?.length) return;

    let seqVolAtual = 1;

    for (const vol of volumes) {
      const seqVolOrigem = vol.SEQVOL;

      if (seqVolOrigem === seqVolAtual) {
        seqVolAtual++;
        continue;
      }

      const itensOrigem = await this.dbExplorerClient.executeQuery(`
      SELECT SEQITEM, CODPROD, CONTROLE, QTD, CODVOL
      FROM TGFIVC
      WHERE NUCONF = ${numeroConferencia}
        AND SEQVOL = ${seqVolOrigem}
        AND QTD > 0
      ORDER BY SEQITEM
    `);

      for (const item of itensOrigem) {
        const controleNormalizado = item.CONTROLE?.trim() || ' ';

        const existente = await this.dbExplorerClient.executeQuery(`
        SELECT SEQITEM, QTD
        FROM TGFIVC
        WHERE NUCONF = ${numeroConferencia}
          AND SEQVOL = ${seqVolAtual}
          AND CODPROD = ${item.CODPROD}
          AND COALESCE(CONTROLE, ' ') = '${controleNormalizado}'
      `);

        if (existente.length > 0) {
          await this.datasetSP.save({
            entityName: 'ItemVolumeConferencia',
            pk: {
              NUCONF: numeroConferencia,
              SEQVOL: seqVolAtual,
              SEQITEM: existente[0].SEQITEM,
            },
            fieldsAndValues: {
              QTD: Number(existente[0].QTD || 0) + Number(item.QTD || 0),
            },
          });
        } else {
          const menorSlotVazio = await this.dbExplorerClient.executeQuery(`
          SELECT MIN(SEQITEM) AS SEQITEM
          FROM TGFIVC
          WHERE NUCONF = ${numeroConferencia}
            AND SEQVOL = ${seqVolAtual}
            AND CODPROD IS NULL
            AND (CONTROLE IS NULL OR CONTROLE = ' ')
            AND (QTD IS NULL OR QTD = 0)
            AND CODVOL IS NULL
        `);

          const seqItemDestino = menorSlotVazio[0]?.SEQITEM ?? null;

          let req: any = {
            entityName: 'ItemVolumeConferencia',
            fieldsAndValues: {
              NUCONF: numeroConferencia,
              SEQVOL: seqVolAtual,
              SEQITEM: seqItemDestino ?? item.SEQITEM,
              CODPROD: item.CODPROD,
              CONTROLE: controleNormalizado,
              QTD: item.QTD,
              CODVOL: item.CODVOL,
            },
          };

          if (seqItemDestino) {
            req.pk = {
              NUCONF: numeroConferencia,
              SEQVOL: seqVolAtual,
              SEQITEM: seqItemDestino,
            };
          }

          await this.datasetSP.save(req);
        }

        await this.datasetSP.save({
          entityName: 'ItemVolumeConferencia',
          pk: {
            NUCONF: numeroConferencia,
            SEQVOL: seqVolOrigem,
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

      const cubagemDestino = await this.dbExplorerClient.executeQuery(`
      SELECT NUCUBAGEM
      FROM AD_CUBAGEM
      WHERE NUCONF = ${numeroConferencia}
        AND SEQVOL = ${seqVolAtual}
    `);

      if (cubagemDestino.length > 0) {
        await this.datasetSP.save({
          entityName: 'AD_CUBAGEM',
          pk: {
            NUCUBAGEM: cubagemDestino[0].NUCUBAGEM,
          },
          fieldsAndValues: {
            ALTURA: null,
            LARGURA: null,
            COMPRIMENTO: null,
            PESO: null,
          },
        });
      }

      seqVolAtual++;
    }

    const qtdVolumes = await this.dbExplorerClient.executeQuery(`
    SELECT COUNT(DISTINCT SEQVOL) AS TOTAL
    FROM TGFIVC
    WHERE NUCONF = ${numeroConferencia}
      AND QTD > 0
  `);

    await this.datasetSP.save({
      entityName: 'CabecalhoConferencia',
      pk: {
        NUCONF: numeroConferencia,
      },
      fieldsAndValues: {
        QTDVOL: qtdVolumes[0]?.TOTAL || 0,
      },
    });

    await this.sincronizarDetalhesConferencia(numeroConferencia);
  }

  async sincronizarDetalhesConferencia(numeroConferencia: number) {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).split('-').reverse().join('/');
    const hour = now.toISOString().slice(11, 16);
    const dh = `${date} ${hour}`;

    const itens = await this.dbExplorerClient.executeQuery(`
    SELECT
      IVC.CODPROD,
      COALESCE(IVC.CONTROLE,' ') AS CONTROLE,
      SUM(IVC.QTD) AS QTD_CONFERIDA,
      ITE.QTDNEG,
      ITE.QTDCONFERIDA
    FROM TGFIVC IVC
    JOIN TGFCON2 CON 
      ON CON.NUCONF = IVC.NUCONF
    JOIN TGFITE ITE 
      ON ITE.NUNOTA = CON.NUNOTAORIG
     AND ITE.CODPROD = IVC.CODPROD
    WHERE IVC.NUCONF = ${numeroConferencia}
      AND IVC.QTD > 0
    GROUP BY
      IVC.CODPROD,
      IVC.CONTROLE,
      ITE.QTDNEG,
      ITE.QTDCONFERIDA
  `);

    const existentes = await this.dbExplorerClient.executeQuery(`
    SELECT SEQCONF, CODPROD, CONTROLE
    FROM TGFCOI2
    WHERE NUCONF = ${numeroConferencia}
  `);

    // Zera antes de recalcular
    for (const antigo of existentes) {
      await this.datasetSP.save({
        entityName: 'DetalhesConferencia',
        pk: {
          NUCONF: numeroConferencia,
          SEQCONF: antigo.SEQCONF,
        },
        fieldsAndValues: {
          QTDCONFVOLPAD: null,
        },
      });
    }

    const usados = new Set<number>();

    for (const item of itens) {
      let fator = 1;

      if (item.QTDNEG && item.QTDNEG !== 0) {
        fator = item.QTDCONFERIDA / item.QTDNEG;
      }

      const qtdBase = Number((item.QTD_CONFERIDA * fator).toFixed(5));

      let seq = existentes.find(
        (e) =>
          e.CODPROD === item.CODPROD && (e.CONTROLE ?? ' ') === item.CONTROLE,
      )?.SEQCONF;

      if (!seq) {
        const seqLivre = await this.dbExplorerClient.executeQuery(`
        SELECT MIN(SEQCONF) AS SEQCONF
        FROM TGFCOI2
        WHERE NUCONF = ${numeroConferencia}
          AND CODPROD IS NULL
      `);

        const seqLivreValor = seqLivre?.[0]?.SEQCONF;

        if (seqLivreValor) {
          seq = seqLivreValor;
        } else {
          const prox = await this.dbExplorerClient.executeQuery(`
          SELECT COALESCE(MAX(SEQCONF),0) + 1 AS SEQCONF
          FROM TGFCOI2
          WHERE NUCONF = ${numeroConferencia}
        `);

          seq = prox[0].SEQCONF;
        }
      }

      usados.add(seq);

      await this.datasetSP.save({
        entityName: 'DetalhesConferencia',
        pk: {
          NUCONF: numeroConferencia,
          SEQCONF: seq,
        },
        fieldsAndValues: {
          CODPROD: item.CODPROD,
          CODBARRA: item.CODPROD,
          CODVOL: null,
          CONTROLE: item.CONTROLE,
          QTDCONF: qtdBase,
          QTDCONFVOLPAD: qtdBase,
          COPIA: null,
          DHALTER: dh,
        },
      });
    }
  }
}

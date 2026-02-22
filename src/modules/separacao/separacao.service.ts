import { BadRequestException, Injectable } from '@nestjs/common';
import { SankhyaDatasetSPClient } from 'src/http-client/dataset-sp/dataset-sp.client';
import { SankhyaDBExplorerSPClient } from 'src/http-client/db-explorer-sp/db-explorer-sp.client';
import {
  AtualizarCabecalhoConferenciaParams,
  AtualizarCabecalhoNotaParams,
  CacheItem,
  IdAndControleProdutoFilter,
  IniciarConferenciaBody,
  NumeroConferenciaFilter,
  NumeroUnicoFilter,
  PostItemConferidoVolume,
} from './dto/separacao.dto';

@Injectable()
export class SeparacaoService {
  constructor(
    private readonly dbExplorerClient: SankhyaDBExplorerSPClient,
    private readonly datasetSP: SankhyaDatasetSPClient,
  ) {}

  private imagemCache = new Map<number, CacheItem>();

  // posts
  async postIniciarConferencia({
    idUsuario,
    numeroUnico,
  }: IniciarConferenciaBody) {
    await this.verificarStatus({ numeroUnico });

    await this.verificarConferencia({ numeroUnico });

    let numeroConferencia: number = await this.obterNumeroConferencia();
    await this.atualizarNumeroConferencia({ numeroConferencia });

    await this.atualizarCabecalhoConferencia({
      numeroUnico,
      numeroConferencia,
      idUsuario,
    });

    await this.atualizarCabecalhoNota({ numeroUnico, numeroConferencia });

    return { numeroConferencia };
  }

  async postItemConferidoVolume({
    numeroConferencia,
    numeroVolume,
    idProduto,
    controle,
    quantidade,
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
        quantidade: qtdAtual + quantidade,
      });
    } else {
      await this.inserirItemConferidoVolume({
        numeroConferencia,
        numeroVolume,
        seqItem,
        idProduto,
        controle,
        quantidade,
        unidade,
      });
    }
  }

  async postRemoverVolume({
    numeroConferencia,
    numeroVolume,
    numeroUnico,
  }: {
    numeroConferencia: number;
    numeroVolume: number;
    numeroUnico: number;
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
      const controle = (item.CONTROLE ?? ' ').trim() || ' ';

      const restante = await this.dbExplorerClient.executeQuery(`
      SELECT SUM(QTD) AS TOTAL
      FROM TGFIVC
      WHERE NUCONF = ${numeroConferencia}
        AND CODPROD = ${item.CODPROD}
        AND COALESCE(CONTROLE, ' ') = '${controle}'
        AND SEQVOL <> ${numeroVolume}
    `);

      const novoTotal = Number(restante?.[0]?.TOTAL || 0);

      await this.datasetSP.save({
        entityName: 'ItemNota',
        pk: {
          NUNOTA: numeroUnico,
          CODPROD: item.CODPROD,
          CONTROLE: controle,
        },
        fieldsAndValues: {
          QTDCONFERIDA: novoTotal,
        },
      });

      await this.datasetSP.save({
        entityName: 'ItemVolumeConferencia',
        pk: {
          NUCONF: numeroConferencia,
          SEQVOL: numeroVolume,
          SEQITEM: item.SEQITEM,
        },
        fieldsAndValues: {
          QTD: 0,
        },
      });
    }
  }

  async postDevolverItemConferido({
    numeroConferencia,
    numeroUnico,
    idProduto,
    controle,
  }: {
    numeroConferencia: number;
    numeroUnico: number;
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
          QTD: 0,
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

    await this.datasetSP.save({
      entityName: 'ItemNota',
      pk: {
        NUNOTA: numeroUnico,
        CODPROD: idProduto,
        CONTROLE: controleNormalizado,
      },
      fieldsAndValues: {
        QTDCONFERIDA: novoTotal,
      },
    });
  }

  // gets
  async getDadosBasicos({ numeroUnico }: NumeroUnicoFilter) {
    const sql = `
    SELECT 
    CAB.NUNOTA AS numeroUnico, 
    CAB.NUMNOTA AS numeroNota, 
    CAB.AD_NUMTALAO AS numeroModial, 
    CAB.NUCONFATUAL AS numeroConferencia, 

    sankhya.SNK_GET_SATUSCONFERENCIA(CAB.NUNOTA) AS codigoStatus, 
    CAB.TIPMOV AS codigoTipoMovimento, 

    PAR.CODPARC AS idParceiro, 
    PAR.RAZAOSOCIAL AS nomeParceiro, 

    VEN.CODVEND AS idVendedor, 
    VEN.APELIDO AS nomeVendedor 

    FROM TGFCAB CAB 

    LEFT JOIN TGFPAR PAR 
    ON PAR.CODPARC = CAB.CODPARC 

    LEFT JOIN TGFVEN VEN 
    ON VEN.CODVEND = CAB.CODVEND 

    WHERE CAB.NUNOTA = ${numeroUnico} 
    `;
    const response = await this.dbExplorerClient.executeQuery(sql);
    return response?.[0];
  }

  async getItensPedido({ numeroUnico }: NumeroUnicoFilter) {
    const sql = `
    SELECT 
      ITE.CODPROD AS idProduto,
      PRO.DESCRPROD AS nomeProduto,

      ITE.QTDNEG AS quantidade, 
      ITE.CODVOL AS unidade,

      PRO.CODMARCA AS idMarca,
      PRO.MARCA AS nomeMarca,

      PAR.CODPARC AS idFornecedor,
      PAR.NOMEPARC AS nomeFornecedor,

      ITE.CONTROLE AS controle,
      PRO.COMPLDESC AS complemento

    FROM TGFITE ITE

    LEFT JOIN TGFPRO PRO ON PRO.CODPROD = ITE.CODPROD
    LEFT JOIN TGFPAR PAR ON PAR.CODPARC = PRO.CODPARCFORN

    WHERE ITE.NUNOTA = ${numeroUnico}
      AND (ITE.QTDNEG - COALESCE(ITE.QTDCONFERIDA, 0)) > 0
  `;

    let response = await this.dbExplorerClient.executeQuery(sql);

    response = await Promise.all(
      response?.map(async (data) => {
        const { idProduto, controle } = data;

        let imagem = await this.obterImagemProduto(idProduto);

        let codigoBarras = await this.obterCodigosDeBarra({
          idProduto,
          controle,
        });

        codigoBarras = codigoBarras?.map((codigoBarra) =>
          codigoBarra.CODIGO?.trim(),
        );

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
      SUM(QTD) AS quantidade

    FROM TGFIVC

    WHERE NUCONF = ${numeroConferencia}
      AND QTD > 0
    GROUP BY CODPROD, CONTROLE
  `;
    const response = await this.dbExplorerClient.executeQuery(sql);
    return response;
  }

  async getVolumes({ numeroConferencia }: NumeroConferenciaFilter) {
    const sql = `
    SELECT 
      IVC.SEQVOL AS numeroVolume, 
      IVC.CODPROD AS idProduto, 
      PRO.DESCRPROD AS descricaoProduto, 
      IVC.QTD AS quantidade, 
      IVC.CODVOL AS unidade, 
      IVC.CONTROLE AS controle

    FROM TGFIVC IVC

    JOIN TGFPRO PRO 
    ON PRO.CODPROD = IVC.CODPROD 
    WHERE IVC.NUCONF = ${numeroConferencia}
      AND IVC.QTD > 0
    ORDER BY IVC.SEQVOL, IVC.SEQITEM
  `;

    let response = await this.dbExplorerClient.executeQuery(sql);

    response = await Promise.all(
      response?.map(async (data) => {
        const { idProduto } = data;

        let imagem = await this.obterImagemProduto(idProduto);

        return { ...data, imagem };
      }),
    );

    const volumeMap = new Map<number, any>();

    for (const item of response) {
      const { numeroVolume } = item;

      if (!volumeMap.has(numeroVolume)) {
        volumeMap.set(numeroVolume, {
          numeroVolume,
          itens: [],
        });
      }

      volumeMap.get(numeroVolume).itens.push({
        idProduto: item.idProduto,
        descricaoProduto: item.descricaoProduto,
        imagem: item.imagem,
        quantidade: item.quantidade,
        unidade: item.unidade,
        controle: item.controle ?? '',
      });
    }

    const result = Array.from(volumeMap.values());

    return result;
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

  async obterImagemProduto(idProduto: number) {
    const cache = this.imagemCache.get(idProduto);

    if (cache && cache.expiresAt > Date.now()) {
      return cache.value;
    }

    const response = await this.dbExplorerClient.executeQuery(`
    SELECT IMAGEM
    FROM TGFPRO
    WHERE CODPROD = ${idProduto};
  `);

    let imagem = response?.[0]?.IMAGEM || null;

    if (imagem) {
      imagem = Buffer.from(imagem, 'hex').toString('base64');
    }

    const MINUTOS = 60 * 3;
    this.imagemCache.set(idProduto, {
      value: imagem,
      expiresAt: Date.now() + 1000 * 60 * MINUTOS,
    });

    return imagem;
  }

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
    FETCH FIRST 1 ROWS ONLY
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

    const ultimo = await this.dbExplorerClient.executeQuery(`
    SELECT COALESCE(MAX(SEQITEM), 0) AS ULTIMO
    FROM TGFIVC
    WHERE NUCONF = ${numeroConferencia}
      AND SEQVOL = ${numeroVolume}
  `);

    return {
      existe: false,
      seqItem: ultimo[0].ULTIMO + 1,
      qtdAtual: 0,
    };
  }

  async obterProximoSeqItem({
    numeroConferencia,
    numeroVolume,
  }: {
    numeroConferencia: number;
    numeroVolume: number;
  }) {
    const sql = `
    SELECT COALESCE(MAX(SEQITEM), 0) + 1 AS PROX_SEQITEM
    FROM TGFIVC
    WHERE NUCONF = ${numeroConferencia}
      AND SEQVOL = ${numeroVolume}
  `;

    const res = await this.dbExplorerClient.executeQuery(sql);

    return res?.[0]?.PROX_SEQITEM;
  }

  async atualizarItemConferidoVolume({
    numeroConferencia,
    numeroVolume,
    seqItem,
    quantidade,
  }: {
    numeroConferencia: number;
    numeroVolume: number;
    seqItem: number;
    quantidade: number;
  }) {
    await this.datasetSP.save({
      entityName: 'ItemVolumeConferencia',
      pk: {
        NUCONF: numeroConferencia,
        SEQVOL: numeroVolume,
        SEQITEM: seqItem,
      },
      fieldsAndValues: {
        QTD: quantidade,
      },
    });
  }

  async inserirItemConferidoVolume({
    numeroConferencia,
    numeroVolume,
    seqItem,
    idProduto,
    controle,
    quantidade,
    unidade,
  }: {
    numeroConferencia: number;
    numeroVolume: number;
    seqItem: number;
    idProduto: number;
    controle: string;
    quantidade: number;
    unidade: string;
  }) {
    return await this.datasetSP.save({
      entityName: 'ItemVolumeConferencia',
      fieldsAndValues: {
        NUCONF: numeroConferencia,
        SEQVOL: numeroVolume,
        SEQITEM: seqItem,
        CODPROD: idProduto,
        CONTROLE: controle,
        QTD: quantidade,
        CODVOL: unidade,
      },
    });
  }
}

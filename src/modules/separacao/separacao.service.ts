import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as Handlebars from 'handlebars';
import * as path from 'path';
import * as puppeteer from 'puppeteer';
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
  PostAtualizarDimensoesVolumeParams,
  PostItemConferidoVolume,
} from './dto/separacao.dto';
import type { Logger } from 'pino';

@Injectable()
export class SeparacaoService {
  constructor(
    private readonly dbExplorerClient: SankhyaDBExplorerSPClient,
    private readonly datasetSP: SankhyaDatasetSPClient,
    @Inject('LOGGER') private readonly logger: Logger,
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

  async postAtualizarDimensoesVolume({
    numeroConferencia,
    numeroVolume,
    largura,
    comprimento,
    altura,
    peso,
  }: PostAtualizarDimensoesVolumeParams) {
    const existente = await this.dbExplorerClient.executeQuery(`
    SELECT NUCUBAGEM
    FROM AD_CUBAGEM
    WHERE NUCONF = ${numeroConferencia}
      AND SEQVOL = ${numeroVolume}
  `);

    if (existente.length > 0) {
      await this.datasetSP.save({
        entityName: 'AD_CUBAGEM',
        pk: {
          NUCUBAGEM: existente[0].NUCUBAGEM,
        },
        fieldsAndValues: {
          ALTURA: altura,
          LARGURA: largura,
          COMPRIMENTO: comprimento,
          PESO: peso,
        },
      });

      return;
    }
    const prox = await this.dbExplorerClient.executeQuery(`
    SELECT COALESCE(MAX(NUCUBAGEM), 0) + 1 AS PROX
    FROM AD_CUBAGEM
  `);

    const nucubagem = prox[0].PROX;

    await this.datasetSP.save({
      entityName: 'AD_CUBAGEM',
      fieldsAndValues: {
        NUCUBAGEM: nucubagem,
        NUCONF: numeroConferencia,
        SEQVOL: numeroVolume,
        ALTURA: altura,
        LARGURA: largura,
        COMPRIMENTO: comprimento,
        PESO: peso,
      },
    });
  }

  async postFinalizarConferencia({
    numeroConferencia,
  }: NumeroConferenciaFilter) {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).split('-').reverse().join('/');
    const hour = now.toISOString().slice(11, 16);

    await this.datasetSP.save({
      entityName: 'CabecalhoConferencia',
      pk: {
        NUCONF: numeroConferencia,
      },
      fieldsAndValues: {
        STATUS: 'F',
        DHFINCONF: `${date} ${hour}`,
      },
    });

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
        QTDVOL: qtdVolumes[0].TOTAL,
      },
    });
  }

  // gets
  async downloadEtiqueta({
    numeroConferencia,
  }: NumeroConferenciaFilter): Promise<Buffer | null> {
    const sql = `
    SELECT
      IVC.SEQVOL AS seqVol,
      IVC.SEQITEM AS seqItem,

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

    ORDER BY IVC.SEQVOL ASC, IVC.SEQITEM ASC
  `;

    const rows = await this.dbExplorerClient.executeQuery(sql);

    if (!rows?.length) {
      return null;
    }

    const filePath = path.join(
      process.cwd(),
      'src/templates/template-etiqueta.html',
    );

    const html = fs.readFileSync(filePath, 'utf-8');

    const template = Handlebars.compile(html);

    const logoPath = path.join(process.cwd(), 'src/templates/modial-logo.png');

    const logoBase64 = `data:image/png;base64,${fs
      .readFileSync(logoPath)
      .toString('base64')}`;

    const volumes = rows.map((row) => {
      const seqVol = String(row.seqVol).padStart(2, '0');
      const seqItem = String(row.seqItem).padStart(2, '0');

      return {
        cliente: row.cliente,
        numeroUnico: row.numeroUnico,
        notaFiscal: String(row.notaFiscal),
        uf: row.uf ?? '',

        seqVol,
        seqItem,

        notaFiscalDigitos: String(row.notaFiscal).split(''),
        seqVolDigitos: seqVol.split(''),
        seqItemDigitos: seqItem.split(''),

        logoBase64,
      };
    });

    const finalHtml = template({ volumes });

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setContent(finalHtml, {
      waitUntil: 'networkidle0',
    });

    const pdfUint8 = await page.pdf({
      format: 'A4',
      printBackground: true,
    });

    await browser.close();

    return Buffer.from(pdfUint8);
  }

  async getDadosBasicos({ numeroUnico }: NumeroUnicoFilter) {
    const sql = `
    SELECT 
    CAB.NUNOTA AS numeroUnico, 
    CAB.NUMNOTA AS numeroNota, 
    CAB.AD_NUMTALAO AS numeroModial, 
    CAB.NUCONFATUAL AS numeroConferencia, 

    sankhya.SNK_GET_SATUSCONFERENCIA(CAB.NUNOTA) AS codigoStatus, 
    CAB.TIPMOV AS codigoTipoMovimento, 
    TPO.DESCROPER AS descricaoTipoOperacao, 

    PAR.CODPARC AS idParceiro, 
    PAR.RAZAOSOCIAL AS nomeParceiro, 

    VEN.CODVEND AS idVendedor, 
    VEN.APELIDO AS nomeVendedor 

    FROM TGFCAB CAB 

    LEFT JOIN TGFPAR PAR 
    ON PAR.CODPARC = CAB.CODPARC 

    LEFT JOIN TGFVEN VEN 
    ON VEN.CODVEND = CAB.CODVEND 

    LEFT JOIN TGFTOP TPO 
    ON TPO.CODTIPOPER = CAB.CODTIPOPER 
    AND TPO.DHALTER = CAB.DHTIPOPER 

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
          imagem = await this.obterImagemProduto(idProduto);
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

  async getVolumes({ numeroConferencia }: NumeroConferenciaFilter) {
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

    CUB.ALTURA,
    CUB.LARGURA,
    CUB.COMPRIMENTO,
    CUB.PESO

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
          imagem = await this.obterImagemProduto(idProduto);
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

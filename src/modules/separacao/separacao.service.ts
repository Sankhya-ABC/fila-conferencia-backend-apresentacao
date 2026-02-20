import { BadRequestException, Injectable } from '@nestjs/common';
import { SankhyaDatasetSPClient } from 'src/http-client/dataset-sp/dataset-sp.client';
import { SankhyaDBExplorerSPClient } from 'src/http-client/db-explorer-sp/db-explorer-sp.client';
import {
  AtualizarCabecalhoConferenciaParams,
  AtualizarCabecalhoNotaParams,
  AtualizarItemConferidoVolumeParams,
  IdAndControleProdutoFilter,
  IniciarConferenciaBody,
  InserirItemConferidoVolumeParams,
  NumeroConferenciaFilter,
  NumeroUnicoFilter,
  VerificarItemConferidoVolumeParams,
} from './dto/separacao.dto';

@Injectable()
export class SeparacaoService {
  constructor(
    private readonly dbExplorerClient: SankhyaDBExplorerSPClient,
    private readonly datasetSP: SankhyaDatasetSPClient,
  ) {}

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
  }: InserirItemConferidoVolumeParams) {
    const exists = await this.verificarItemConferidoVolume({
      numeroConferencia,
      numeroVolume,
      idProduto,
      controle,
    });

    if (exists) {
      await this.atualizarItemConferidoVolume({
        numeroConferencia,
        numeroVolume,
        idProduto,
        controle,
        quantidade,
      });
    } else {
      await this.inserirItemConferidoVolume({
        numeroConferencia,
        numeroVolume,
        idProduto,
        controle,
        quantidade,
        unidade,
      });
    }
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
    PRO.IMAGEM AS imagem, 

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

    INNER JOIN TGFPRO PRO ON PRO.CODPROD = ITE.CODPROD 
    LEFT JOIN TGFPAR PAR ON PAR.CODPARC = PRO.CODPARCFORN 

    WHERE NUNOTA = ${numeroUnico} 
    `;
    let response = await this.dbExplorerClient.executeQuery(sql);

    response = await Promise.all(
      response?.map(async (data) => {
        const { idProduto, controle, imagem } = data;
        let imagemBase64: string | null = null;
        if (imagem) {
          imagemBase64 = Buffer.from(imagem, 'hex').toString('base64');
        }

        let codigoBarras = await this.getCodigosDeBarra({
          idProduto,
          controle,
        });
        codigoBarras = codigoBarras?.map((codigoBarra) =>
          codigoBarra.CODIGO?.trim(),
        );
        return { ...data, codigoBarras, imagem: imagemBase64 };
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
      PRO.IMAGEM AS imagem, 
      IVC.QTD AS quantidade, 
      IVC.CODVOL AS unidade 
    FROM TGFIVC IVC 
    JOIN TGFPRO PRO 
      ON PRO.CODPROD = IVC.CODPROD 
    WHERE IVC.NUCONF = ${numeroConferencia} 
    ORDER BY IVC.SEQVOL, IVC.SEQITEM; 
  `;

    const response = await this.dbExplorerClient.executeQuery(sql);

    const rows = await Promise.all(
      response?.map(async (data) => {
        const { imagem } = data;
        let imagemBase64: string | null = null;
        if (imagem) {
          imagemBase64 = Buffer.from(imagem, 'hex').toString('base64');
        }

        return { ...data, imagem: imagemBase64 };
      }),
    );

    const volumeMap = new Map<number, any>();

    for (const item of rows) {
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
      });
    }

    const result = Array.from(volumeMap.values());

    return result;
  }

  // auxiliares
  async getCodigosDeBarra({ idProduto, controle }: IdAndControleProdutoFilter) {
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

  async verificarItemConferidoVolume({
    numeroConferencia,
    numeroVolume,
    idProduto,
    controle,
  }: VerificarItemConferidoVolumeParams) {
    const existente = await this.dbExplorerClient.executeQuery(`
    SELECT 
      SEQITEM,
      QTD
    FROM TGFIVC
    WHERE NUCONF = ${numeroConferencia}
      AND SEQVOL = ${numeroVolume}
      AND CODPROD = ${idProduto}
      AND NVL(CONTROLE, ' ') = NVL('${controle ?? ' '}', ' ')
  `);

    return existente.length > 0;
  }

  async atualizarItemConferidoVolume({
    numeroConferencia,
    numeroVolume,
    idProduto,
    controle,
    quantidade,
  }: AtualizarItemConferidoVolumeParams) {
    try {
      await this.datasetSP.save({
        entityName: 'ItemVolumeConferencia',
        pk: {
          NUCONF: numeroConferencia,
          SEQVOL: numeroVolume,
          CODPROD: idProduto,
          CONTROLE: controle,
        },
        fieldsAndValues: {
          QTD: quantidade,
        },
      });
    } catch {
      throw new BadRequestException('Erro ao atualizar item conferido/volume.');
    }
  }

  async inserirItemConferidoVolume({
    numeroConferencia,
    numeroVolume,
    idProduto,
    controle,
    quantidade,
    unidade,
  }: InserirItemConferidoVolumeParams) {
    try {
      await this.datasetSP.save({
        entityName: 'ItemVolumeConferencia',
        pk: {
          NUCONF: numeroConferencia,
          SEQVOL: numeroVolume,
          SEQITEM: 'COALESCE(MAX(SEQITEM), 0) + 1',
          CODPROD: idProduto,
          CONTROLE: controle,
          QTD: quantidade,
          CODVOL: unidade,
        },
        fieldsAndValues: {
          QTD: quantidade,
        },
      });
    } catch {
      throw new BadRequestException('Erro ao atualizar item conferido/volume.');
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

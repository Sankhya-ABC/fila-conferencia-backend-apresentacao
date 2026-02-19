import { BadRequestException, Injectable } from '@nestjs/common';
import { SankhyaDatasetSPClient } from 'src/http-client/dataset-sp/dataset-sp.client';
import { SankhyaDBExplorerSPClient } from 'src/http-client/db-explorer-sp/db-explorer-sp.client';
import {
  IdAndControleProdutoFilter,
  IniciarConferenciaBody,
  NumeroConferenciaFilter,
  NumeroUnicoFilter,
} from './dto/separacao.dto';

@Injectable()
export class SeparacaoService {
  constructor(
    private readonly dbExplorerClient: SankhyaDBExplorerSPClient,
    private readonly datasetSP: SankhyaDatasetSPClient,
  ) {}

  async postIniciarConferencia({
    idUsuario,
    numeroNota,
    numeroUnico,
  }: IniciarConferenciaBody) {
    // consulta o status
    let status = null;
    try {
      const statusResponse = await this.dbExplorerClient.executeQuery(`
      SELECT 
      sankhya.SNK_GET_SATUSCONFERENCIA(CAB.NUNOTA) AS codigoStatus 
      FROM TGFCAB CAB 
      WHERE CAB.NUNOTA = ${numeroUnico} 
    `);
      status = statusResponse?.[0]?.codigoStatus;
      console.log(1, statusResponse);
    } catch (error) {
      throw new BadRequestException('Erro ao consultar status da conferência.');
    }

    if (status !== 'AC') {
      throw new BadRequestException(
        'Para iniciar a conferência, o pedido deve estar com status "Aguardando Conferência"',
      );
    }

    // obter último número de conferência
    let numeroConferencia = null;
    let codmoddoc = null;
    try {
      const numeroConferenciaResponse = await this.dbExplorerClient
        .executeQuery(`
        SELECT ULTCOD AS numeroConferencia, 
        CODMODDOC AS codmoddoc 
        FROM TGFNUM 
        WHERE ARQUIVO = 'TGFCON2' AND CODEMP = 1 AND SERIE = '.' 
        `);

      numeroConferencia = numeroConferenciaResponse[0].numeroConferencia + 1;
      codmoddoc = numeroConferenciaResponse[0].codmoddoc;

      console.log(2, numeroConferenciaResponse, {
        numeroConferencia,
        codmoddoc,
      });
    } catch (error) {
      throw new BadRequestException('Erro ao obter número de conferência.');
    }

    // atualizar número de conferência
    try {
      const responseControleNumeracao = await this.datasetSP.save({
        entityName: 'ControleNumeracao',
        fieldsAndValues: { ULTCOD: numeroConferencia },
        pk: { ARQUIVO: 'TGFCON2', CODEMP: 1, SERIE: '.', CODMODDOC: 0 },
      });
      console.log(
        3,
        responseControleNumeracao,
        responseControleNumeracao.responseBody.result,
      );
    } catch (error) {
      throw new BadRequestException('Erro ao atualizar número de conferência.');
    }

    // atualizar tgfcab com o novo número de conferência
    try {
      const responseCabecalhoNota = await this.datasetSP.save({
        entityName: 'CabecalhoNota',
        fieldsAndValues: { NUCONFATUAL: numeroConferencia },
        pk: { NUNOTA: numeroUnico },
      });
      console.log(4, responseCabecalhoNota);
    } catch (error) {
      throw new BadRequestException(
        'Erro ao atualizar número de conferência no cabeçalho da nota.',
      );
    }

    // inserir nova conferência na tabela de conferências
    let [date, hour] = new Date().toISOString().slice(0, 19).split('T');
    date = date.split('-').reverse().join('/');
    hour = hour.slice(0, 5);

    try {
      const responseCabecalhoConferencia = await this.datasetSP.save({
        entityName: 'CabecalhoConferencia',
        fieldsAndValues: {
          CODUSUCONF: idUsuario,
          DHFINCONF: null,
          DHINICONF: `${date} ${hour}`,
          NUCONFORIG: null,
          NUNOTADEV: null,
          NUNOTAORIG: numeroNota,
          NUPEDCOMP: null,
          QTDVOL: 0,
          STATUS: 'A',
        },
      });
      console.log(5, responseCabecalhoConferencia);
    } catch (error) {
      try {
        const responseCabecalhoNotaUndo = await this.datasetSP.save({
          entityName: 'CabecalhoNota',
          fieldsAndValues: { NUCONFATUAL: null },
          pk: { NUNOTA: numeroUnico },
        });
        console.log(6, responseCabecalhoNotaUndo);
        throw new BadRequestException(
          'Erro ao iniciar andamento dessa conferência.',
        );
      } catch (error) {
        throw new BadRequestException(
          'Erro ao iniciar andamento dessa conferência. E erro ao desfazer atualização do número de conferência no cabeçalho da nota.',
        );
      }
    }

    return { numeroConferencia };
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
    SUM(QTD) AS quantidade 

    FROM TGFIVC 

    WHERE NUCONF = ${numeroConferencia}  
    GROUP BY CODPROD
    `;
    const response = await this.dbExplorerClient.executeQuery(sql);
    return response;
  }

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
}

import { BadRequestException, Injectable } from '@nestjs/common';
import { SankhyaDBExplorerSPClient } from 'src/http-client/db-explorer-sp/db-explorer-sp.client';
import {
  IdAndControleProdutoFilter,
  IniciarConferenciaParams,
  NumeroUnicoFilter,
} from './dto/separacao.dto';

@Injectable()
export class SeparacaoService {
  constructor(private readonly dbExplorerClient: SankhyaDBExplorerSPClient) {}

  async postIniciarConferencia({
    idUsuario,
    numeroNota,
    numeroUnico,
  }: IniciarConferenciaParams) {
    const statusResponse = await this.dbExplorerClient.executeQuery(`
      SELECT 
      sankhya.SNK_GET_SATUSCONFERENCIA(CAB.NUNOTA) AS codigoStatus 
      FROM TGFCAB CAB 
      WHERE CAB.NUNOTA = ${numeroUnico} 
    `);

    const status = statusResponse?.[0]?.codigoStatus;

    if (status !== 'AC') {
      throw new BadRequestException(
        'Para iniciar a conferência, o pedido deve estar com status "Aguardando Conferência"',
      );
    }

    const numeroConferenciaResponse = await this.dbExplorerClient.executeQuery(`
    SELECT ULTCOD + 1 AS numeroConferencia 
    FROM TGFNUM 
    WHERE ARQUIVO = 'TGFCON2' AND CODEMP = 1 AND SERIE = '.' 
    `);

    const numeroConferencia = numeroConferenciaResponse[0].numeroConferencia;

    await this.dbExplorerClient.executeQuery(`
      UPDATE TGFNUM
      SET ULTCOD = ${numeroConferencia}
      WHERE ARQUIVO = 'TGFCON2'
        AND CODEMP = 1
        AND SERIE = '.'
    `);

    await this.dbExplorerClient.executeQuery(`
      UPDATE TGFCAB CAB
      SET NUCONFATUAL = ${numeroConferencia}
      WHERE CAB.NUNOTA = ${numeroUnico}
    `);

    const aaa = {
      serviceName: 'DatasetSP.save',
      requestBody: {
        entityName: 'CabecalhoConferencia',
        standAlone: false,
        fields: ['CODUSUCONF', 'NUCONF', 'QTDVOL', 'STATUS'],
        records: [
          {
            pk: {
              NUNOTAORIG: numeroUnico,
            },
            values: {
              '0': idUsuario,
              '1': numeroConferencia,
              '2': 0,
              '3': 'A',
            },
          },
        ],
      },
    };

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
        const { idProduto, controle } = data;
        let codigoBarras = await this.getCodigosDeBarra({
          idProduto,
          controle,
        });
        codigoBarras = codigoBarras?.map((codigoBarra) =>
          codigoBarra.CODIGO?.trim(),
        );
        return { ...data, codigoBarras };
      }),
    );

    const teste = {
      serviceName: 'DatasetSP.save',
      requestBody: {
        entityName: 'CabecalhoConferencia',
        standAlone: false,
        fields: ['CODUSUCONF', 'NUCONF', 'QTDVOL', 'STATUS'],
        records: [
          {
            pk: {
              NUNOTAORIG: 61854,
            },
            values: {
              '0': 0,
              '1': 6701,
              '2': 0,
              '3': 'A',
            },
          },
        ],
      },
    };

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

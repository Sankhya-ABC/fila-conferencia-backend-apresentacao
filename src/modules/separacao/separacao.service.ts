import { Injectable } from '@nestjs/common';
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
    const status = await this.dbExplorerClient.executeQuery(`
    SELECT 
    sankhya.SNK_GET_SATUSCONFERENCIA(CAB.NUNOTA) AS codigoStatus, 

    WHERE CAB.NUNOTA = ${numeroUnico} 
    `);

    if (status === 'AC') {
      const numeroConferencia = await this.dbExplorerClient.executeQuery(`
    SELECT ultcod FROM TGFNUM WHERE arquivo = 'tgfcon2'
    `);

      await this.dbExplorerClient.executeQuery(`
    UPDATE TGFCAB
    SET NUCONFATUAL = ${numeroConferencia}
    WHERE NUNOTA = ${numeroNota};
    `);

      const sql = `
    INSERT INTO TGFCON2 ( 
    CODUSUCONF, 
    DHFINCONF, 
    DHINICONF, 
    NUCONF, 
    NUCONFORIG, 
    NUNOTADEV, 
    NUNOTAORIG, 
    NUPEDCOMP, 
    QTDVOL, 
    STATUS 
    ) VALUES ( 
    ${idUsuario}, 
    NULL, 
    '${new Date().toISOString().slice(0, 19).replace('T', ' ')}', 
    ${numeroConferencia}, 
    NULL, 
    NULL, 
    ${numeroNota}, 
    NULL, 
    0, 
    'A' 
    ); 
    `;
      const response = await this.dbExplorerClient.executeQuery(sql);
      return response;
    }
    throw new Error(
      'para iniciar a conferência, o pedido deve estar com status "Aguardando Conferência"',
    );
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

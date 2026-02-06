import { Injectable } from '@nestjs/common';
import { SankhyaDBExplorerSPClient } from 'src/http-client/db-explorer-sp/db-explorer-sp.client';
import {
  IdAndControleProdutoFilter,
  NumeroUnicoFilter,
} from './dto/separacao.dto';

@Injectable()
export class SeparacaoService {
  constructor(private readonly dbExplorerClient: SankhyaDBExplorerSPClient) {}

  async getDadosBasicos({ numeroUnico }: NumeroUnicoFilter) {
    const sql = `
    SELECT 
    CAB.NUCONFATUAL AS numeroConferencia, 
    CAB.NUMNOTA AS numeroNota, 

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

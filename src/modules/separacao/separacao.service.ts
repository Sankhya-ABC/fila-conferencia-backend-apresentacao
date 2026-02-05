import { Injectable } from '@nestjs/common';
import { SankhyaDBExplorerSPClient } from 'src/http-client/db-explorer-sp/db-explorer-sp.client';
import {
  IdAndControleProdutoFilter,
  NumeroNotaFilter,
} from './dto/separacao.dto';

@Injectable()
export class SeparacaoService {
  constructor(private readonly dbExplorerClient: SankhyaDBExplorerSPClient) {}

  async getDadosBasicos({ numeroNota }: NumeroNotaFilter) {
    const sql = `
    SELECT 
    CAB.NUCONFATUAL AS numeroConferencia, 

    PAR.CODPARC AS idParceiro, 
    PAR.RAZAOSOCIAL AS nomeParceiro, 

    VEN.CODVEND AS idVendedor, 
    VEN.APELIDO AS nomeVendedor 

    FROM TGFCAB CAB 

    LEFT JOIN TGFPAR PAR 
    ON PAR.CODPARC = CAB.CODPARC 

    LEFT JOIN TGFVEN VEN 
    ON VEN.CODVEND = CAB.CODVEND 

    WHERE CAB.NUMNOTA = ${numeroNota} 
    `;
    const response = await this.dbExplorerClient.executeQuery(sql);
    return response;
  }

  async getItensPedido({ numeroNota }: NumeroNotaFilter) {
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

    WHERE NUNOTA = ${numeroNota} 
    `;
    let response = await this.dbExplorerClient.executeQuery(sql);

    response = await Promise.all(
      response?.map(async (data) => {
        const { idProduto, controle } = data;
        const codigosBarra = await this.getCodigosDeBarra({
          idProduto,
          controle,
        });
        return { ...data, codigosBarra };
      }),
    );

    return response;
  }

  async getCodigosDeBarra({ idProduto, controle }: IdAndControleProdutoFilter) {
    const sql = `
    SELECT 
    VW_CP.CODIGO 

    FROM VW_CODIGOS_PRODUTO VW_CP 

    WHERE VW_CP.CODPROD = ${idProduto} AND VW_CP.CONTROLE = '${controle}' 
    `;
    const response = await this.dbExplorerClient.executeQuery(sql);
    return response;
  }
}

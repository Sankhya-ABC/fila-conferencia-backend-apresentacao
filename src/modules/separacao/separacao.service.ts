import { BadRequestException, Injectable } from '@nestjs/common';
import { SankhyaDBExplorerSPClient } from 'src/http-client/db-explorer-sp/db-explorer-sp.client';
import {
  IdAndControleProdutoFilter,
  IniciarConferenciaParams,
  NumeroUnicoFilter,
} from './dto/separacao.dto';
import { SankhyaDatasetSPClient } from 'src/http-client/dataset-sp/dataset-sp.client';

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
  }: IniciarConferenciaParams) {
    // consulta o status
    const statusResponse = await this.dbExplorerClient.executeQuery(`
      SELECT 
      sankhya.SNK_GET_SATUSCONFERENCIA(CAB.NUNOTA) AS codigoStatus 
      FROM TGFCAB CAB 
      WHERE CAB.NUNOTA = ${numeroUnico} 
    `);

    const status = statusResponse?.[0]?.codigoStatus;

    // se status for diferente de AC, lançar erro
    if (status !== 'AC') {
      throw new BadRequestException(
        'Para iniciar a conferência, o pedido deve estar com status "Aguardando Conferência"',
      );
    }

    // obter último número de conferência
    const numeroConferenciaResponse = await this.dbExplorerClient.executeQuery(`
    SELECT ULTCOD AS numeroConferencia, 
    CODMODDOC 
    FROM TGFNUM 
    WHERE ARQUIVO = 'TGFCON2' AND CODEMP = 1 AND SERIE = '.' 
    `);

    const numeroConferencia =
      numeroConferenciaResponse[0].numeroConferencia + 1;
    const codmoddoc = numeroConferenciaResponse[0].codmoddoc + 1;

    // atualizar número de conferência
    await this.datasetSP.save({
      entityName: 'ControleNumeracao',
      fieldsAndValues: { ULTCOD: numeroConferencia, CODMODDOC: codmoddoc },
      pk: { ARQUIVO: 'TGFCON2', CODEMP: 1, SERIE: '.' },
    });

    // atualizar tgfcab com o novo número de conferência
    await this.datasetSP.save({
      entityName: 'CabecalhoNota',
      fieldsAndValues: { NUCONFATUAL: numeroConferencia },
      pk: { NUNOTA: numeroUnico },
    });

    // inserir nova conferência na tabela de conferências
    await this.datasetSP.save({
      entityName: 'CabecalhoConferencia',
      fieldsAndValues: {
        CODUSUCONF: idUsuario,
        DHFINCONF: null,
        DHINICONF: new Date().toISOString().slice(0, 19).replace('T', ' '),
        NUCONFORIG: null,
        NUNOTADEV: null,
        NUNOTAORIG: numeroNota,
        NUPEDCOMP: null,
        QTDVOL: 0,
        STATUS: 'A',
      },
    });

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

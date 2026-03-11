import { Injectable } from '@nestjs/common';
import { SankhyaDBExplorerSPClient } from 'src/http-client/db-explorer-sp/db-explorer-sp.client';
import { FilaConferenciaFilter } from './dto/conferencia.dto';

@Injectable()
export class ConferenciaService {
  constructor(private readonly dbExplorerClient: SankhyaDBExplorerSPClient) {}

  async getFilaConferencias(queryParams: FilaConferenciaFilter) {
    const conditions: string[] = [];

    if (queryParams.codigoStatus) {
      const list = queryParams.codigoStatus
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (list.length) {
        conditions.push(`
          sankhya.SNK_GET_SATUSCONFERENCIA(CAB.NUNOTA)
          IN (${list.map((s) => `'${s}'`).join(',')})
        `);
      }
    }

    if (queryParams.numeroNota) {
      conditions.push(`CAB.NUMNOTA = ${queryParams.numeroNota}`);
    }

    if (queryParams.numeroModial) {
      conditions.push(`CAB.AD_NUMTALAO = ${queryParams.numeroModial}`);
    }

    if (queryParams.numeroUnico) {
      conditions.push(`CAB.NUNOTA = ${queryParams.numeroUnico}`);
    }

    if (queryParams.idParceiro) {
      conditions.push(`CAB.CODPARC = ${queryParams.idParceiro}`);
    }

    if (queryParams.idEmpresa) {
      conditions.push(`EMP.CODEMP = ${queryParams.idEmpresa}`);
    }

    if (queryParams.codigoTipoMovimento) {
      const list = queryParams.codigoTipoMovimento
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (list.length) {
        conditions.push(`
          CAB.TIPMOV IN (${list.map((s) => `'${s}'`).join(',')})
        `);
      }
    }

    if (queryParams.codigoTipoOperacao) {
      const list = queryParams.codigoTipoOperacao
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (list.length) {
        conditions.push(`
          CAB.CODTIPOPER IN (${list.join(',')})
        `);
      }
    }

    if (queryParams.codigoTipoEntrega) {
      const list = queryParams.codigoTipoEntrega
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (list.length) {
        conditions.push(`
          CAB.AD_TIPOENTREGA IN (${list.map((s) => `'${s}'`).join(',')})
        `);
      }
    }

    if (queryParams.dataInicio) {
      conditions.push(`
        CAST(CAB.DTMOV AS date) >= '${queryParams.dataInicio}'
      `);
    }

    if (queryParams.dataFim) {
      conditions.push(`
        CAST(CAB.DTMOV AS date) <= '${queryParams.dataFim}'
      `);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const sql = `
    SELECT 
    CAB.NUNOTA AS numeroUnico, 
    CAB.NUMNOTA AS numeroNota, 
    CAB.AD_NUMTALAO AS numeroModial, 
    CAB.NUCONFATUAL AS numeroConferencia, 

    CAB.VLRNOTA AS valorNota, 
    CAB.VOLUME AS volume, 
    CAB.DTMOV AS dataMovimento, 

    sankhya.SNK_GET_SATUSCONFERENCIA(CAB.NUNOTA) AS codigoStatus, 
    OPC_STATUSCONF.OPCAO AS descricaoStatus, 

    CAB.TIPMOV AS codigoTipoMovimento, 
    OPC_TIPMOV.OPCAO AS descricaoTipoMovimento, 

    TPO.CODTIPOPER AS codigoTipoOperacao, 
    TPO.DESCROPER AS descricaoTipoOperacao, 

    CAB.AD_TIPOENTREGA AS codigoTipoEntrega, 
    OPC_TIPOENTREGA.OPCAO AS descricaoTipoEntrega, 

    EMP.CODEMP AS idEmpresa, 
    EMP.RAZAOSOCIAL AS nomeEmpresa, 

    PAR.CODPARC AS idParceiro, 
    PAR.RAZAOSOCIAL AS nomeParceiro, 

    VEN.CODVEND AS idVendedor, 
    VEN.APELIDO AS nomeVendedor, 

    CAB.CODUSUINC AS idUsuarioInclusao, 
    USU_INC.NOMEUSU AS nomeUsuarioInclusao, 

    CAB.CODUSU AS idUsuarioAlteracao, 
    USU_ALT.NOMEUSU AS nomeUsuarioAlteracao 

    FROM TGFCAB CAB 
    
    LEFT JOIN TSIEMP EMP 
    ON EMP.CODEMP = CAB.CODEMP 

    LEFT JOIN TGFPAR PAR 
    ON PAR.CODPARC = CAB.CODPARC 

    LEFT JOIN TGFVEN VEN 
    ON VEN.CODVEND = CAB.CODVEND 

    LEFT JOIN TGFTOP TPO 
    ON TPO.CODTIPOPER = CAB.CODTIPOPER 
    AND TPO.DHALTER = CAB.DHTIPOPER 

    LEFT JOIN TSIUSU USU_INC 
    ON USU_INC.CODUSU = CAB.CODUSUINC 

    LEFT JOIN TSIUSU USU_ALT 
    ON USU_ALT.CODUSU = CAB.CODUSU 

    LEFT JOIN TDDOPC OPC_TIPMOV 
    ON OPC_TIPMOV.NUCAMPO = 739 
    AND OPC_TIPMOV.VALOR = CAB.TIPMOV 

    LEFT JOIN TDDOPC OPC_STATUSCONF 
    ON OPC_STATUSCONF.NUCAMPO = 64923 
    AND OPC_STATUSCONF.VALOR = sankhya.SNK_GET_SATUSCONFERENCIA(CAB.NUNOTA) 

    LEFT JOIN TDDOPC OPC_TIPOENTREGA 
    ON OPC_TIPOENTREGA.NUCAMPO = 9999990877 
    AND OPC_TIPOENTREGA.VALOR = CAB.AD_TIPOENTREGA 

    ${whereClause}
  `;
    const response = await this.dbExplorerClient.executeQuery(sql);
    return response;
  }
}

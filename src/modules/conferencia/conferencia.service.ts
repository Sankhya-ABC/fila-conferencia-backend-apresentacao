import { Injectable } from '@nestjs/common';
import { SankhyaDBExplorerSPClient } from 'src/http-client/db-explorer-sp/db-explorer-sp.client';
import { ConferenciaHelper } from './conferencia.helper';
import {
  FilaConferenciaFilter,
  IniciarConferenciaBody,
} from './dto/conferencia.dto';
import { NumeroConferenciaFilter, NumeroUnicoFilter } from '../dto/model';
import { SankhyaDatasetSPClient } from 'src/http-client/dataset-sp/dataset-sp.client';

@Injectable()
export class ConferenciaService {
  constructor(
    private readonly dbExplorerClient: SankhyaDBExplorerSPClient,
    private readonly conferenciaHelper: ConferenciaHelper,
    private readonly datasetSP: SankhyaDatasetSPClient,
  ) {}

  async getFilaConferencias(queryParams: FilaConferenciaFilter) {
    const conditions: string[] = [];
    const page = Number(queryParams.page ?? 0);
    const perPage = Number(queryParams.perPage ?? 15);
    const offset = page * perPage;

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

    ORDER BY CAB.NUNOTA DESC
    OFFSET ${offset} ROWS
    FETCH NEXT ${perPage} ROWS ONLY
  `;
    const data = await this.dbExplorerClient.executeQuery(sql);

    const countSql = `
      SELECT COUNT(*) as total
      FROM TGFCAB CAB
      ${whereClause}
    `;

    const totalResult = await this.dbExplorerClient.executeQuery(countSql);
    const total = totalResult[0]?.total ?? 0;

    return { data, total };
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

  async postIniciarConferencia({
    idUsuario,
    numeroUnico,
  }: IniciarConferenciaBody) {
    await this.conferenciaHelper.verificarStatus({ numeroUnico });

    await this.conferenciaHelper.verificarConferencia({ numeroUnico });

    let numeroConferencia: number =
      await this.conferenciaHelper.obterNumeroConferencia();

    await this.conferenciaHelper.atualizarNumeroConferencia({
      numeroConferencia,
    });

    await this.conferenciaHelper.atualizarCabecalhoConferencia({
      numeroUnico,
      numeroConferencia,
      idUsuario,
    });

    await this.conferenciaHelper.atualizarCabecalhoNota({
      numeroUnico,
      numeroConferencia,
    });

    return { numeroConferencia };
  }

  async postFinalizarConferencia({
    numeroConferencia,
  }: NumeroConferenciaFilter) {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).split('-').reverse().join('/');
    const hour = now.toISOString().slice(11, 16);

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
        STATUS: 'F',
        DHFINCONF: `${date} ${hour}`,
        QTDVOL: qtdVolumes[0].TOTAL,
      },
    });
  }
}

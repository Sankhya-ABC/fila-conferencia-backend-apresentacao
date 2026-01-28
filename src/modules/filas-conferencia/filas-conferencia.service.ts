import { Injectable } from '@nestjs/common';
import { SankhyaDBExplorerSPClient } from 'src/http-client/db-explorer-sp/db-explorer-sp.client';

@Injectable()
export class FilasConferenciaService {
  constructor(private readonly dbExplorerClient: SankhyaDBExplorerSPClient) {}

  async getFilaConferencias() {
    const sql = `
    SELECT 
    CAB.NUNOTA AS numeroUnico, 
    CAB.NUMNOTA AS numeroNota, 
    CAB.AD_NUMTALAO AS numeroModial, 

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
    CAB.CODUSU AS idUsuarioAlteracao 

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

    LEFT JOIN TDDOPC OPC_TIPMOV 
    ON OPC_TIPMOV.NUCAMPO = 739 
    AND OPC_TIPMOV.VALOR = CAB.TIPMOV 

    LEFT JOIN TDDOPC OPC_STATUSCONF 
    ON OPC_STATUSCONF.NUCAMPO = 64923 
    AND OPC_STATUSCONF.VALOR = sankhya.SNK_GET_SATUSCONFERENCIA(CAB.NUNOTA) 

    LEFT JOIN TDDOPC OPC_TIPOENTREGA 
    ON OPC_TIPOENTREGA.NUCAMPO = 9999990877 
    AND OPC_TIPOENTREGA.VALOR = CAB.AD_TIPOENTREGA 

    WHERE sankhya.SNK_GET_SATUSCONFERENCIA(CAB.NUNOTA) IN ('A', 'AC', 'R', 'RA', 'Z') 
    `;
    const response = await this.dbExplorerClient.executeQuery(sql);
    return response;
  }

  async getStatus() {
    const sql = `
    SELECT 
    OPC.VALOR AS codigo, 
    OPC.OPCAO AS descricao 

    FROM TDDOPC OPC 

    WHERE OPC.NUCAMPO = 64923 

    ORDER BY OPC.VALOR 
    `;
    const response = await this.dbExplorerClient.executeQuery(sql);
    return response;
  }

  async getTipoMovimento() {
    const sql = `
    SELECT 
    OPC.VALOR AS codigo, 
    OPC.OPCAO AS descricao 

    FROM TDDOPC OPC 

    WHERE OPC.NUCAMPO = 739 

    ORDER BY OPC.VALOR 
    `;
    const response = await this.dbExplorerClient.executeQuery(sql);
    return response;
  }

  async getTipoOperacao() {
    const sql = `
    SELECT 
    TPO.CODTIPOPER AS codigo, 
    TPO.DESCROPER AS descricao 

    FROM TGFTOP TPO 

    WHERE TPO.ATIVO = 'S' 
    AND TPO.DHALTER = ( 
    SELECT MAX(TPO2.DHALTER) 
    FROM TGFTOP TPO2 
    WHERE TPO2.CODTIPOPER = TPO.CODTIPOPER 
    ) 

    ORDER BY TPO.CODTIPOPER 
    `;
    const response = await this.dbExplorerClient.executeQuery(sql);
    return response;
  }

  async getTipoEntrega() {
    const sql = `
    SELECT 
    OPC.VALOR AS codigo, 
    OPC.OPCAO AS descricao 

    FROM TDDOPC OPC 

    WHERE OPC.NUCAMPO = 9999990877 
    
    ORDER BY OPC.VALOR 
    `;
    const response = await this.dbExplorerClient.executeQuery(sql);
    return response;
  }
}

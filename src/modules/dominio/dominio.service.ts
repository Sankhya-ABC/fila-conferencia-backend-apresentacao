import { Injectable } from '@nestjs/common';
import { SankhyaDBExplorerSPClient } from 'src/http-client/db-explorer-sp/db-explorer-sp.client';

@Injectable()
export class DominioService {
  constructor(private readonly dbExplorerClient: SankhyaDBExplorerSPClient) {}

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

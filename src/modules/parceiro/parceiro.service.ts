import { Injectable } from '@nestjs/common';
import { SankhyaDBExplorerSPClient } from 'src/http-client/db-explorer-sp/db-explorer-sp.client';
import { ParceiroFilter } from './dto/parceiro.dto';

@Injectable()
export class ParceiroService {
  constructor(private readonly dbExplorerClient: SankhyaDBExplorerSPClient) {}

  async getParceiros(queryParams: ParceiroFilter) {
    const { search } = queryParams;
    const sql = `
    SELECT 
    PAR.CODPARC AS "id", 
    PAR.RAZAOSOCIAL AS "nome", 
    PAR.CGC_CPF AS "cpfCnpj" 
    FROM TGFPAR PAR 
    WHERE 
    UPPER(PAR.RAZAOSOCIAL) LIKE UPPER('%${search}%') 
    OR REPLACE(REPLACE(REPLACE(PAR.CGC_CPF, '.', ''), '-', ''), '/', '') 
    LIKE REPLACE(REPLACE(REPLACE('%${search}%', '.', ''), '-', ''), '/', '') 
    ORDER BY PAR.RAZAOSOCIAL 
  `;
    const response = await this.dbExplorerClient.executeQuery(sql);
    return response;
  }
}

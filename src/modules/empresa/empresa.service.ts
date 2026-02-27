import { Injectable } from '@nestjs/common';
import { SankhyaDBExplorerSPClient } from 'src/http-client/db-explorer-sp/db-explorer-sp.client';
import { EmpresaFilter } from './dto/empresa.dto';

@Injectable()
export class EmpresaService {
  constructor(private readonly dbExplorerClient: SankhyaDBExplorerSPClient) {}

  async getEmpresas(queryParams: EmpresaFilter) {
    const { search } = queryParams;
    const sql = `
      SELECT 
        EMP.CODEMP AS id,
        EMP.RAZAOSOCIAL AS nome,
        EMP.CGC AS cpfCnpj
      FROM TSIEMP EMP
      WHERE
        UPPER(EMP.RAZAOSOCIAL) LIKE UPPER('%${search}%')
        OR REPLACE(REPLACE(REPLACE(EMP.CGC, '.', ''), '-', ''), '/', '')
        LIKE REPLACE(REPLACE(REPLACE('%${search}%', '.', ''), '-', ''), '/', '')
      ORDER BY EMP.RAZAOSOCIAL
    `;
    const response = await this.dbExplorerClient.executeQuery(sql);
    return response;
  }
}

import { Injectable } from '@nestjs/common';
import { SankhyaDBExplorerSPClient } from 'src/http-client/db-explorer-sp/db-explorer-sp.client';
import { GatewayClient } from 'src/http-client/gateway/gateway.client';

@Injectable()
export class FilasConferenciaService {
  constructor(
    private readonly gateway: GatewayClient,
    private readonly dbExplorerClient: SankhyaDBExplorerSPClient,
  ) {}

  async findAll() {
    const sql = `
    SELECT CAB.NUNOTA AS numeroUnico, 
    CAB.NUMNOTA AS numeroNota, 
    EMP.CODEMP AS idEmpresa, 
    EMP.RAZAOSOCIAL AS nomeEmpresa, 
    OPC_TIPMOV.OPCAO AS tipoMovimento, 
    PAR.CODPARC AS idParceiro, 
    PAR.RAZAOSOCIAL AS nomeParceiro, 
    VEN.CODVEND AS idVendedor, 
    VEN.APELIDO AS nomeVendedor, 
    CAB.VLRNOTA AS valorNota, 
    CAB.CODUSUINC AS idUsuarioInclusao, 
    CAB.CODUSU AS idUsuarioAlteracao, 
    CAB.VOLUME AS volume, 
    CAB.DTMOV AS dataMovimento, 
    CAB.AD_NUMTALAO AS numeroModial, 
    CAB.CODTIPOPER AS codigoTipoOperacao, 
    OPC_STATUSCONF.OPCAO AS status 
    FROM TGFCAB CAB 
    LEFT JOIN TSIEMP EMP ON EMP.CODEMP = CAB.CODEMP 
    LEFT JOIN TGFPAR PAR ON PAR.CODPARC = CAB.CODPARC 
    LEFT JOIN TGFVEN VEN ON VEN.CODVEND = CAB.CODVEND 
    LEFT JOIN TDDOPC OPC_TIPMOV ON OPC_TIPMOV.NUCAMPO = 739 AND OPC_TIPMOV.VALOR = CAB.TIPMOV 
    LEFT JOIN TDDOPC OPC_STATUSCONF ON OPC_STATUSCONF.NUCAMPO = 64923 AND sankhya.SNK_GET_SATUSCONFERENCIA(CAB.NUNOTA) = OPC_STATUSCONF.VALOR 
    WHERE sankhya.SNK_GET_SATUSCONFERENCIA(CAB.NUNOTA) IN ('A', 'AC', 'R', 'RA', 'Z')
    `;
    const response = await this.dbExplorerClient.executeQuery(sql);
    return response;
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { SankhyaDBExplorerSPClient } from 'src/http-client/db-explorer-sp/db-explorer-sp.client';
import { LoginRequest } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(private readonly dbExplorerClient: SankhyaDBExplorerSPClient) {}

  async login(body: LoginRequest) {
    const { usuario, senha } = body;

    const senhaCriptografada = crypto
      .createHash('sha1')
      .update(senha)
      .digest('hex')
      .toUpperCase();

    const sql = `
    SELECT CODUSUARIO, USUARIO, NOME 

    FROM TGUSUARIO 

    WHERE USUARIO = ${usuario} 
    AND SENHA = ${senhaCriptografada} 
    AND ATIVO = 'S' 
    `;

    const result = await this.dbExplorerClient.executeQuery(sql);

    if (!result || result.length === 0) {
      throw new UnauthorizedException('Usuário ou senha inválidos');
    }

    const usuarioLogado = result[0];
    return {
      idUsuario: usuarioLogado.CODUSUARIO,
      usuario: usuarioLogado.USUARIO,
      nome: usuarioLogado.NOME,
    };
  }
}

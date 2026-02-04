import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuthUserService } from 'src/auth-user/auth-user.service';
import { SankhyaMobileLoginSPClient } from 'src/http-client/mobile-login-sp/mobile-login-sp.client';

@Injectable()
export class AuthService {
  constructor(
    private readonly mobileLoginClient: SankhyaMobileLoginSPClient,
    private readonly authUserService: AuthUserService,
  ) {}

  async login(body: { usuario: string; senha: string }) {
    const response = await this.mobileLoginClient.login(body);

    if (response.status !== '1') {
      throw new UnauthorizedException('Usuário ou senha inválidos');
    }

    const idUsuario = Buffer.from(
      response.responseBody.idusu.$.trim(),
      'base64',
    ).toString('utf-8');
    const token = randomUUID();
    const nome = body.usuario;

    await this.authUserService.set(idUsuario, { token, nome });

    return { token, nome, idUsuario };
  }
}

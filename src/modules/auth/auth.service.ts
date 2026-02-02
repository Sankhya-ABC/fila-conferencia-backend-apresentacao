import { HttpException, Injectable } from '@nestjs/common';
import { SankhyaMobileLoginSPClient } from 'src/http-client/mobile-login-sp/mobile-login-sp.client';
import { LoginRequest } from 'src/modules/auth/dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(private readonly mobileLoginClient: SankhyaMobileLoginSPClient) {}

  async login(body: LoginRequest) {
    const response = await this.mobileLoginClient.login(body);

    if (response.status === '0') {
      throw new HttpException({ message: 'Usuário ou senha inválidos' }, 401);
    }

    if (response.status === '1') {
      return {
        callID: response.responseBody.callID.$,
        jsessionid: response.responseBody.jsessionid.$,
        kID: response.responseBody.kID.$,
        idUsuario: response.responseBody.idusu.$,
      };
    }
  }
}

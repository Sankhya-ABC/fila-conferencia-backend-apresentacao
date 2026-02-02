import { Injectable } from '@nestjs/common';
import { LoginRequest } from 'src/modules/auth/dto/auth.dto';
import { SankhyaMobileLoginSPClient } from 'src/http-client/mobile-login-sp/mobile-login-sp.client';

@Injectable()
export class AuthService {
  constructor(private readonly mobileLoginClient: SankhyaMobileLoginSPClient) {}

  async login(body: LoginRequest) {
    const response = await this.mobileLoginClient.login(body);
    return response;
  }
}

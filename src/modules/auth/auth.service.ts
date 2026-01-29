import { Injectable } from '@nestjs/common';
import { SankhyaDBExplorerSPClient } from 'src/http-client/db-explorer-sp/db-explorer-sp.client';
import { LoginRequest } from './dto/auth.dto';
import { GatewayClient } from 'src/http-client/gateway/gateway.client';

@Injectable()
export class AuthService {
  constructor(
    private readonly dbExplorerClient: SankhyaDBExplorerSPClient,
    private readonly gateway: GatewayClient,
  ) {}

  async login(body: LoginRequest) {
    const response = this.gateway.client.post('/login', {
      headers: { Username: body.usuario, Password: body.senha },
    });
    return response;
  }
}

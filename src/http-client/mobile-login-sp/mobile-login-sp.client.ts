import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GatewayClient } from '../gateway/gateway.client';
import { LoginRequest } from 'src/modules/auth/dto/auth.dto';

@Injectable()
export class SankhyaMobileLoginSPClient {
  private readonly endpoint: string;

  constructor(
    private readonly gateway: GatewayClient,
    config: ConfigService,
  ) {
    this.endpoint = `/${config.getOrThrow('SNK_LOGIN')}`;
  }

  async login(login: LoginRequest): Promise<any> {
    const body = {
      serviceName: 'MobileLoginSP.login',
      requestBody: {
        NOMUSU: { $: login.usuario },
        INTERNO: { $: login.senha },
        KEEPCONNECTED: { $: 'S' },
      },
    };

    try {
      const response = await this.gateway.client.post(this.endpoint, body);
      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error?.response?.data || 'Erro ao executar MobileLoginSP.login',
        error?.response?.status || 500,
      );
    }
  }
}

import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GatewayClient } from '../gateway/gateway.client';

@Injectable()
export class SankhyaLoginClient {
  private readonly endpoint: string;

  constructor(
    private readonly gateway: GatewayClient,
    config: ConfigService,
  ) {
    this.endpoint = `/${config.getOrThrow('SNK_EXECUTE_QUERY')}`;
  }

  async login(login: { usuario: string; senha: string }): Promise<any> {
    const body = {
      serviceName: 'MobileLoginSP.login',
      requestBody: {
        NOMUSU: {
          $: login.usuario,
        },
        INTERNO: {
          $: login.senha,
        },
        KEEPCONNECTED: {
          $: 'S',
        },
      },
    };

    try {
      const response = await this.gateway.client.post(this.endpoint, body);
      return response;
    } catch (error: any) {
      throw new HttpException(
        error?.response?.data || 'Erro ao executar MobileLoginSP.login',
        error?.response?.status || 500,
      );
    }
  }
}

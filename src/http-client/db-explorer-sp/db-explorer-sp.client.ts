import { Injectable, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GatewayClient } from '../gateway/gateway.client';

type DbExplorerParam = {
  name: string;
  value: string | number;
  type?: 'S' | 'N' | 'D';
};

@Injectable()
export class SankhyaDBExplorerSPClient {
  private readonly endpoint: string;

  constructor(
    private readonly gateway: GatewayClient,
    configService: ConfigService,
  ) {
    this.endpoint = configService.getOrThrow('SNK_EXECUTE_QUERY');
  }

  async executeQuery(
    sql: string,
    params: DbExplorerParam[] = [],
  ): Promise<any[]> {
    const body = {
      serviceName: 'DbExplorerSP.executeQuery',
      requestBody: {
        sql,
        parameters: params.map((p) => ({
          name: p.name,
          value: {
            $: p.value,
            type: p.type ?? 'S',
          },
        })),
      },
    };

    try {
      const response = await this.gateway.client.post(this.endpoint, body);

      let rows = response.data?.responseBody?.rows?.row ?? [];

      if (!Array.isArray(rows)) {
        rows = [rows];
      }

      return rows;
    } catch (error: any) {
      throw new HttpException(
        error?.response?.data || 'Erro ao executar DbExplorerSP',
        error?.response?.status || 500,
      );
    }
  }
}

import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GatewayClient } from '../gateway/gateway.client';

@Injectable()
export class SankhyaDBExplorerSPClient {
  private readonly endpoint: string;

  constructor(
    private readonly gateway: GatewayClient,
    config: ConfigService,
  ) {
    this.endpoint = `/${config.getOrThrow('SNK_EXECUTE_QUERY')}`;
  }

  buildDbExplorerResponse(response: any): Array<Record<string, any>> {
    const fieldsMetadata = response?.responseBody?.fieldsMetadata;
    const rows = response?.responseBody?.rows;

    if (!Array.isArray(fieldsMetadata) || !Array.isArray(rows)) {
      return [];
    }

    return rows.map((row) => {
      return fieldsMetadata.reduce(
        (acc, field, index) => {
          acc[field.name] = row[index] ?? null;
          return acc;
        },
        {} as Record<string, any>,
      );
    });
  }

  async executeQuery(sql: string): Promise<any> {
    const body = {
      serviceName: 'DbExplorerSP.executeQuery',
      requestBody: { sql },
    };

    try {
      const response = await this.gateway.client.post(this.endpoint, body);
      return this.buildDbExplorerResponse(response.data);
    } catch (error: any) {
      throw new HttpException(
        error?.response?.data || 'Erro ao executar DbExplorerSP.executeQuery',
        error?.response?.status || 500,
      );
    }
  }
}

import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GatewayClient } from '../gateway/gateway.client';

interface DatasetSPBody {
  entityName: string;
  standAlone?: boolean;
  fieldsAndValues: Record<string, any>;
  pk?: Record<string, any>;
}

@Injectable()
export class SankhyaDatasetSPClient {
  private readonly endpoint: string;

  constructor(
    private readonly gateway: GatewayClient,
    config: ConfigService,
  ) {
    this.endpoint = `/${config.getOrThrow('SNK_SAVE')}`;
  }

  async save({
    entityName,
    standAlone = false,
    fieldsAndValues = {},
    pk,
  }: DatasetSPBody) {
    if (!entityName) {
      throw new HttpException('entityName é obrigatório', 400);
    }

    const fields = Object.keys(fieldsAndValues);

    if (!fields.length) {
      throw new HttpException('fieldsAndValues não pode ser vazio', 400);
    }

    const valuesMap: Record<string, any> = {};
    Object.values(fieldsAndValues).forEach((value, index) => {
      valuesMap[String(index)] = value;
    });

    const body: any = {
      serviceName: 'DatasetSP.save',
      requestBody: {
        entityName,
        standAlone,
        fields,
        records: [{ values: valuesMap }],
      },
    };

    if (pk) {
      body.requestBody.records[0].pk = pk;
    }

    const response = await this.gateway.client.post(this.endpoint, body);
    if (response.data?.status === '1') {
      return response.data;
    } else {
      throw new BadRequestException(
        response.data?.statusMessage || 'Erro ao executar consulta',
      );
    }
  }
}

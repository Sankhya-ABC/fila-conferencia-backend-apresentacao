import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GatewayClient } from '../gateway/gateway.client';

interface LoadRecordsParams {
  rootEntity: string;
  fieldset?: string;
  criteria?: {
    expression: string;
    parameters?: {
      value: string | number | boolean | Date;
      type: 'S' | 'I' | 'D' | 'B';
    }[];
  };
  joins?: {
    path: string;
    fieldset: string;
  }[];
  modifiedSince?: string;
  offsetPage?: number;
  limit?: number;
}

@Injectable()
export class SankhyaLoadRecordsClient {
  private readonly endpoint: string;

  constructor(
    private readonly gateway: GatewayClient,
    config: ConfigService,
  ) {
    this.endpoint = `/${config.getOrThrow('SNK_LOAD_RECORDS')}`;
  }

  async loadRecords({
    rootEntity,
    fieldset,
    criteria,
    joins = [],
    modifiedSince,
    offsetPage = 0,
    limit,
  }: LoadRecordsParams) {
    if (!rootEntity) {
      throw new HttpException('rootEntity é obrigatório', 400);
    }

    const body: any = {
      serviceName: 'CRUDServiceProvider.loadRecords',
      requestBody: {
        dataSet: {
          rootEntity,
          ignoreCalculatedFields: 'true',
          useFileBasedPagination: 'true',
          includePresentationFields: 'N',
          tryJoinedFields: 'true',
          offsetPage: String(offsetPage),
        },
      },
    };

    if (modifiedSince) {
      body.requestBody.dataSet.modifiedSince = modifiedSince;
    }

    if (criteria?.expression) {
      body.requestBody.dataSet.criteria = {
        expression: { $: criteria.expression },
        parameter:
          criteria.parameters?.map((param) => ({
            $: String(param.value),
            type: param.type,
          })) ?? [],
      };
    }

    const entityList: any[] = [];

    if (fieldset) {
      entityList.push({
        path: '',
        fieldset: { list: fieldset },
      });
    }

    joins.forEach((join) => {
      entityList.push({
        path: join.path,
        fieldset: { list: join.fieldset },
      });
    });

    if (entityList.length) {
      body.requestBody.dataSet.entity = entityList;
    }

    if (limit) {
      body.requestBody.dataSet.limit = String(limit);
    }

    try {
      const response = await this.gateway.client.post(this.endpoint, body);
      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error?.response?.data ||
          'Erro ao executar CRUDServiceProvider.loadRecords',
        error?.response?.status || 500,
      );
    }
  }
}

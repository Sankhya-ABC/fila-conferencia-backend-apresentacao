import { Injectable, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GatewayClient } from '../gateway/gateway.client';

type SankhyaCriteria = {
  field: string;
  value: string | number;
  operator?: string;
  type?: 'S' | 'N' | 'D';
};

@Injectable()
export class SankhyaLoadRecordsClient {
  private readonly endpoint: string;
  private readonly defaultPageSize = 500;

  constructor(
    private readonly gateway: GatewayClient,
    configService: ConfigService,
  ) {
    this.endpoint = configService.getOrThrow('SNK_LOAD_RECORDS');
  }

  async *fetchPaginated(
    entityName: string,
    fields: string[],
    criteria: SankhyaCriteria[] = [],
    pageSize: number = this.defaultPageSize,
  ): AsyncGenerator<{
    records: any[];
    startRow: number;
    endRow: number;
    hasMore: boolean;
  }> {
    let start = 0;
    let end = pageSize;
    let hasMore = true;

    while (hasMore) {
      const body = {
        serviceName: 'CRUDServiceProvider.loadRecords',
        requestBody: {
          dataSet: {
            rootEntity: entityName,
            includePresentationFields: 'S',
            offsetPage: start,
            pageSize,
            entity: [
              {
                path: '',
                field: fields.map((f) => ({ $: f })),
              },
            ],
            criteria: this.buildCriteria(criteria),
          },
        },
      };

      try {
        const response = await this.gateway.client.post(this.endpoint, body);

        let records =
          response.data?.responseBody?.entities?.entity?.[0]?.record ?? [];

        if (!Array.isArray(records)) {
          records = [records];
        }

        const count = records.length;
        hasMore = count === pageSize;

        yield {
          records,
          startRow: start,
          endRow: start + pageSize,
          hasMore,
        };

        start += pageSize;
      } catch (error: any) {
        throw new HttpException(
          error?.response?.data ||
            'Erro ao consultar CRUDServiceProvider.loadRecords',
          error?.response?.status || 500,
        );
      }
    }
  }

  private buildCriteria(criteria: SankhyaCriteria[]): any {
    if (!criteria.length) return {};

    const expressions: string[] = [];
    const parameters: any[] = [];

    for (const c of criteria) {
      expressions.push(`${c.field} ${c.operator ?? '='} ?`);
      parameters.push({
        $: c.value,
        type: c.type ?? 'S',
      });
    }

    return {
      expression: { $: expressions.join(' AND ') },
      parameter: parameters,
    };
  }
}

import { Injectable } from '@nestjs/common';
import { NumeroConferenciaFilter } from '../dto/model';
import { VolumeHelper } from './volume.helper';
import { SankhyaDBExplorerSPClient } from 'src/http-client/db-explorer-sp/db-explorer-sp.client';
import { SankhyaDatasetSPClient } from 'src/http-client/dataset-sp/dataset-sp.client';
import { PostAtualizarDimensoesVolumeDetalhadoParams } from './dto/volume.dto';

@Injectable()
export class VolumeService {
  constructor(
    private readonly volumeHelper: VolumeHelper,
    private readonly dbExplorerClient: SankhyaDBExplorerSPClient,
    private readonly datasetSP: SankhyaDatasetSPClient,
  ) {}

  async getVolumes({ numeroConferencia }: NumeroConferenciaFilter) {
    const isCubagemNaoDetalhada = await this.volumeHelper.isCubagemNaoDetalhada(
      {
        numeroConferencia,
      },
    );

    if (isCubagemNaoDetalhada) {
      return await this.volumeHelper.obterVolumesNaoDetalhados({
        numeroConferencia,
      });
    } else {
      return await this.volumeHelper.obterVolumesDetalhados({
        numeroConferencia,
      });
    }
  }

  async gerarVolumesLote({
    numeroConferencia,
    quantidadeLote,
    altura,
    largura,
    comprimento,
    peso,
  }) {
    const sql = `
    SELECT
      NUCUBAGEM,
      SEQVOL,
      ALTURA,
      LARGURA,
      COMPRIMENTO,
      PESO
    FROM AD_CUBAGEM
    WHERE NUCONF = ${numeroConferencia}
    ORDER BY SEQVOL
  `;

    const rows = await this.dbExplorerClient.executeQuery(sql);

    const linhasVazias = rows.filter(
      (r) =>
        r.ALTURA == null &&
        r.LARGURA == null &&
        r.COMPRIMENTO == null &&
        r.PESO == null,
    );

    let numeroVolume = rows.length
      ? Math.max(...rows.map((r) => r.SEQVOL || 0)) + 1
      : 1;

    let restante = quantidadeLote;

    for (const linha of linhasVazias) {
      if (restante <= 0) break;

      await this.datasetSP.save({
        entityName: 'AD_CUBAGEM',
        pk: {
          NUCUBAGEM: linha.NUCUBAGEM,
        },
        fieldsAndValues: {
          ALTURA: Number(altura),
          LARGURA: Number(largura),
          COMPRIMENTO: Number(comprimento),
          PESO: Number(peso),
        },
      });

      restante--;
    }

    while (restante > 0) {
      const nucubagem = await this.volumeHelper.obterProximoIdCubagem();

      await this.datasetSP.save({
        entityName: 'AD_CUBAGEM',
        fieldsAndValues: {
          NUCUBAGEM: nucubagem,
          NUCONF: numeroConferencia,
          SEQVOL: numeroVolume++,
          ALTURA: Number(altura),
          LARGURA: Number(largura),
          COMPRIMENTO: Number(comprimento),
          PESO: Number(peso),
        },
      });

      restante--;
    }
  }

  async postAtualizarDimensoesVolumeDetalhado({
    numeroConferencia,
    numeroVolume,
    largura,
    comprimento,
    altura,
    peso,
  }: PostAtualizarDimensoesVolumeDetalhadoParams) {
    const existente = await this.dbExplorerClient.executeQuery(`
      SELECT NUCUBAGEM
      FROM AD_CUBAGEM
      WHERE NUCONF = ${numeroConferencia}
        AND SEQVOL = ${numeroVolume}
    `);

    if (existente.length > 0) {
      await this.datasetSP.save({
        entityName: 'AD_CUBAGEM',
        pk: {
          NUCUBAGEM: existente[0].NUCUBAGEM,
        },
        fieldsAndValues: {
          ALTURA: altura,
          LARGURA: largura,
          COMPRIMENTO: comprimento,
          PESO: peso,
        },
      });

      return;
    }
    const prox = await this.dbExplorerClient.executeQuery(`
      SELECT COALESCE(MAX(NUCUBAGEM), 0) + 1 AS PROX
      FROM AD_CUBAGEM
    `);

    const nucubagem = prox[0].PROX;

    await this.datasetSP.save({
      entityName: 'AD_CUBAGEM',
      fieldsAndValues: {
        NUCUBAGEM: nucubagem,
        NUCONF: numeroConferencia,
        SEQVOL: numeroVolume,
        ALTURA: altura,
        LARGURA: largura,
        COMPRIMENTO: comprimento,
        PESO: peso,
      },
    });
  }
}

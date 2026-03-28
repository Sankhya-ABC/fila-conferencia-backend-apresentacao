import { Injectable } from '@nestjs/common';
import { NumeroConferenciaFilter } from '../dto/model';
import { VolumeHelper } from './volume.helper';
import { SankhyaDBExplorerSPClient } from 'src/http-client/db-explorer-sp/db-explorer-sp.client';
import { SankhyaDatasetSPClient } from 'src/http-client/dataset-sp/dataset-sp.client';
import { PostAtualizarDimensoesVolumeParams } from './dto/volume.dto';

@Injectable()
export class VolumeService {
  constructor(
    private readonly volumeHelper: VolumeHelper,
    private readonly dbExplorerClient: SankhyaDBExplorerSPClient,
    private readonly datasetSP: SankhyaDatasetSPClient,
  ) {}

  async getVolumes({ numeroConferencia }: NumeroConferenciaFilter) {
    const isCubagemNaoDetalhada = await this.volumeHelper.isCubagemNaoDetalhada(
      { numeroConferencia },
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

  async postAtualizarDimensoesVolume(
    params: PostAtualizarDimensoesVolumeParams,
  ) {
    const { numeroConferencia } = params;
    const isCubagemNaoDetalhada = await this.volumeHelper.isCubagemNaoDetalhada(
      { numeroConferencia },
    );

    if (isCubagemNaoDetalhada) {
      return await this.volumeHelper.postAtualizarDimensoesVolumeNaoDetalhadoLote(
        params,
      );
    } else {
      return await this.volumeHelper.postAtualizarDimensoesVolumeDetalhado(
        params,
      );
    }
  }
}

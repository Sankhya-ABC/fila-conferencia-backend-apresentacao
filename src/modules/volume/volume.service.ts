import { Injectable } from '@nestjs/common';
import { NumeroConferenciaFilter } from '../dto/model';
import { VolumeHelper } from './volume.helper';

@Injectable()
export class VolumeService {
  constructor(private readonly volumeHelper: VolumeHelper) {}

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
}

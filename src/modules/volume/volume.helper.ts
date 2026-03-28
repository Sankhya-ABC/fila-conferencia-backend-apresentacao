import { Injectable } from '@nestjs/common';
import { SankhyaDatasetSPClient } from 'src/http-client/dataset-sp/dataset-sp.client';
import { SankhyaDBExplorerSPClient } from 'src/http-client/db-explorer-sp/db-explorer-sp.client';

@Injectable()
export class VolumeHelper {
  constructor(
    private readonly dbExplorerClient: SankhyaDBExplorerSPClient,
    private readonly datasetSP: SankhyaDatasetSPClient,
  ) {}
  //
}

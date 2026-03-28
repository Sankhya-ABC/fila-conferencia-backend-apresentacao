import { Module } from '@nestjs/common';
import { AuthAppModule } from 'src/core/guards/auth-app/auth-app.module';
import { SankhyaDBExplorerSPClientModule } from 'src/http-client/db-explorer-sp/db-explorer-sp.module';
import { GatewayClientModule } from 'src/http-client/gateway/gateway.module';
import { VolumeController } from './volume.controller';
import { VolumeService } from './volume.service';
import { AuthUserModule } from 'src/core/guards/auth-user/auth-user.module';
import { SankhyaDatasetSPClientModule } from 'src/http-client/dataset-sp/dataset-sp.module';
import { VolumeHelper } from './volume.helper';
import { ArquivoHelper } from '../arquivo/arquivo.helper';
import { SeparacaoHelper } from '../separacao/separacao.helper';

@Module({
  controllers: [VolumeController],
  providers: [VolumeService, VolumeHelper, ArquivoHelper, SeparacaoHelper],
  imports: [
    GatewayClientModule,
    AuthAppModule,
    AuthUserModule,
    SankhyaDBExplorerSPClientModule,
    SankhyaDatasetSPClientModule,
  ],
})
export class VolumeModule {}

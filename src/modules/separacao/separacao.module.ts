import { Module } from '@nestjs/common';
import { AuthAppModule } from 'src/core/guards/auth-app/auth-app.module';
import { AuthUserModule } from 'src/core/guards/auth-user/auth-user.module';
import { SankhyaDatasetSPClientModule } from 'src/http-client/dataset-sp/dataset-sp.module';
import { SankhyaDBExplorerSPClientModule } from 'src/http-client/db-explorer-sp/db-explorer-sp.module';
import { GatewayClientModule } from 'src/http-client/gateway/gateway.module';
import { ArquivoHelper } from '../arquivo/arquivo.helper';
import { SeparacaoController } from './separacao.controller';
import { SeparacaoService } from './separacao.service';
import { SeparacaoHelper } from './separacao.helper';

@Module({
  controllers: [SeparacaoController],
  providers: [SeparacaoService, ArquivoHelper, SeparacaoHelper],
  imports: [
    GatewayClientModule,
    AuthAppModule,
    AuthUserModule,
    SankhyaDBExplorerSPClientModule,
    SankhyaDatasetSPClientModule,
  ],
})
export class SeparacaoModule {}

import { Module } from '@nestjs/common';
import { AuthAppModule } from 'src/core/guards/auth-app/auth-app.module';
import { AuthUserModule } from 'src/core/guards/auth-user/auth-user.module';
import { SankhyaDatasetSPClientModule } from 'src/http-client/dataset-sp/dataset-sp.module';
import { SankhyaDBExplorerSPClientModule } from 'src/http-client/db-explorer-sp/db-explorer-sp.module';
import { GatewayClientModule } from 'src/http-client/gateway/gateway.module';
import { SeparacaoController } from './separacao.controller';
import { SeparacaoService } from './separacao.service';

@Module({
  controllers: [SeparacaoController],
  providers: [SeparacaoService],
  imports: [
    GatewayClientModule,
    AuthAppModule,
    AuthUserModule,
    SankhyaDBExplorerSPClientModule,
    SankhyaDatasetSPClientModule,
  ],
})
export class SeparacaoModule {}

import { Module } from '@nestjs/common';
import { AuthAppModule } from 'src/core/guards/auth-app/auth-app.module';
import { AuthUserModule } from 'src/core/guards/auth-user/auth-user.module';
import { SankhyaDBExplorerSPClientModule } from 'src/http-client/db-explorer-sp/db-explorer-sp.module';
import { GatewayClientModule } from 'src/http-client/gateway/gateway.module';
import { ArquivoController } from './arquivo.controller';
import { ArquivoService } from './arquivo.service';
import { ArquivoHelper } from './arquivo.helper';

@Module({
  controllers: [ArquivoController],
  providers: [ArquivoService, ArquivoHelper],
  imports: [
    GatewayClientModule,
    AuthAppModule,
    AuthUserModule,
    SankhyaDBExplorerSPClientModule,
  ],
})
export class ArquivoModule {}

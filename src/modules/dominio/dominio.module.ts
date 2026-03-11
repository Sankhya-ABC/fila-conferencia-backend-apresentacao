import { Module } from '@nestjs/common';
import { AuthAppModule } from 'src/core/guards/auth-app/auth-app.module';
import { SankhyaDBExplorerSPClientModule } from 'src/http-client/db-explorer-sp/db-explorer-sp.module';
import { GatewayClientModule } from 'src/http-client/gateway/gateway.module';
import { DominioController } from './dominio.controller';
import { DominioService } from './dominio.service';
import { AuthUserModule } from 'src/core/guards/auth-user/auth-user.module';

@Module({
  controllers: [DominioController],
  providers: [DominioService],
  imports: [
    GatewayClientModule,
    AuthAppModule,
    AuthUserModule,
    SankhyaDBExplorerSPClientModule,
  ],
})
export class DominioModule {}

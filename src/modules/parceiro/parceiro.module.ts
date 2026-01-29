import { Module } from '@nestjs/common';
import { AuthAppModule } from 'src/auth-app/auth-app.module';
import { SankhyaDBExplorerSPClientModule } from 'src/http-client/db-explorer-sp/db-explorer-sp.module';
import { GatewayClientModule } from 'src/http-client/gateway/gateway.module';
import { ParceiroController } from './parceiro.controller';
import { ParceiroService } from './parceiro.service';

@Module({
  controllers: [ParceiroController],
  providers: [ParceiroService],
  imports: [
    GatewayClientModule,
    AuthAppModule,
    SankhyaDBExplorerSPClientModule,
  ],
})
export class ParceiroModule {}

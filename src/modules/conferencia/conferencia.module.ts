import { Module } from '@nestjs/common';
import { AuthAppModule } from 'src/guards/auth-app/auth-app.module';
import { SankhyaDBExplorerSPClientModule } from 'src/http-client/db-explorer-sp/db-explorer-sp.module';
import { GatewayClientModule } from 'src/http-client/gateway/gateway.module';
import { ConferenciaController } from './conferencia.controller';
import { ConferenciaService } from './conferencia.service';
import { AuthUserModule } from 'src/guards/auth-user/auth-user.module';

@Module({
  controllers: [ConferenciaController],
  providers: [ConferenciaService],
  imports: [
    GatewayClientModule,
    AuthAppModule,
    AuthUserModule,
    SankhyaDBExplorerSPClientModule,
  ],
})
export class ConferenciaModule {}

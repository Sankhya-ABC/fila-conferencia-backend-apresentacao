import { Module } from '@nestjs/common';
import { AuthAppModule } from 'src/auth-app/auth-app.module';
import { SankhyaDBExplorerSPClientModule } from 'src/http-client/db-explorer-sp/db-explorer-sp.module';
import { GatewayClientModule } from 'src/http-client/gateway/gateway.module';
import { FilaConferenciaController } from './fila-conferencia.controller';
import { FilaConferenciaService } from './fila-conferencia.service';
import { AuthUserModule } from 'src/auth-user/auth-user.module';

@Module({
  controllers: [FilaConferenciaController],
  providers: [FilaConferenciaService],
  imports: [
    GatewayClientModule,
    AuthAppModule,
    AuthUserModule,
    SankhyaDBExplorerSPClientModule,
  ],
})
export class FilaConferenciaModule {}

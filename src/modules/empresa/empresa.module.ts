import { Module } from '@nestjs/common';
import { AuthAppModule } from 'src/guards/auth-app/auth-app.module';
import { SankhyaDBExplorerSPClientModule } from 'src/http-client/db-explorer-sp/db-explorer-sp.module';
import { GatewayClientModule } from 'src/http-client/gateway/gateway.module';
import { EmpresaController } from './empresa.controller';
import { EmpresaService } from './empresa.service';
import { AuthUserModule } from 'src/guards/auth-user/auth-user.module';

@Module({
  controllers: [EmpresaController],
  providers: [EmpresaService],
  imports: [
    GatewayClientModule,
    AuthAppModule,
    AuthUserModule,
    SankhyaDBExplorerSPClientModule,
  ],
})
export class EmpresaModule {}

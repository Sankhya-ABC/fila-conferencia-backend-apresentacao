import { Module } from '@nestjs/common';
import { AuthAppModule } from 'src/guards/auth-app/auth-app.module';
import { SankhyaDBExplorerSPClientModule } from 'src/http-client/db-explorer-sp/db-explorer-sp.module';
import { GatewayClientModule } from 'src/http-client/gateway/gateway.module';
import { ParceiroController } from './parceiro.controller';
import { ParceiroService } from './parceiro.service';
import { AuthUserModule } from 'src/guards/auth-user/auth-user.module';

@Module({
  controllers: [ParceiroController],
  providers: [ParceiroService],
  imports: [
    GatewayClientModule,
    AuthAppModule,
    AuthUserModule,
    SankhyaDBExplorerSPClientModule,
  ],
})
export class ParceiroModule {}

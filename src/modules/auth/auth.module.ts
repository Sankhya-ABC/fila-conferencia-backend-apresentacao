import { Module } from '@nestjs/common';
import { AuthAppModule } from 'src/auth-app/auth-app.module';
import { SankhyaDBExplorerSPClientModule } from 'src/http-client/db-explorer-sp/db-explorer-sp.module';
import { GatewayClientModule } from 'src/http-client/gateway/gateway.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  imports: [
    GatewayClientModule,
    AuthAppModule,
    SankhyaDBExplorerSPClientModule,
  ],
})
export class AuthModule {}

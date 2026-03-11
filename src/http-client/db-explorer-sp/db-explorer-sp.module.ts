import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthAppModule } from 'src/core/guards/auth-app/auth-app.module';
import { SankhyaDBExplorerSPClient } from './db-explorer-sp.client';
import { GatewayClientModule } from '../gateway/gateway.module';

@Module({
  providers: [SankhyaDBExplorerSPClient],
  exports: [SankhyaDBExplorerSPClient],
  imports: [ConfigModule, AuthAppModule, GatewayClientModule],
})
export class SankhyaDBExplorerSPClientModule {}

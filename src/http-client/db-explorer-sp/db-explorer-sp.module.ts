import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthAppModule } from 'src/auth-app/auth-app.module';
import { SankhyaDBExplorerSPClient } from './db-explorer-sp.client';

@Module({
  providers: [SankhyaDBExplorerSPClient],
  exports: [SankhyaDBExplorerSPClient],
  imports: [ConfigModule, AuthAppModule],
})
export class SankhyaDBExplorerSPClientModule {}

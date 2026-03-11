import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthAppModule } from 'src/guards/auth-app/auth-app.module';
import { GatewayClientModule } from '../gateway/gateway.module';
import { SankhyaDatasetSPClient } from './dataset-sp.client';

@Module({
  providers: [SankhyaDatasetSPClient],
  exports: [SankhyaDatasetSPClient],
  imports: [ConfigModule, AuthAppModule, GatewayClientModule],
})
export class SankhyaDatasetSPClientModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthAppModule } from 'src/guards/auth-app/auth-app.module';
import { SankhyaLoadRecordsClient } from './load-records.client';
import { GatewayClientModule } from '../gateway/gateway.module';

@Module({
  providers: [SankhyaLoadRecordsClient],
  exports: [SankhyaLoadRecordsClient],
  imports: [ConfigModule, AuthAppModule, GatewayClientModule],
})
export class SankhyaLoadRecordsClientModule {}

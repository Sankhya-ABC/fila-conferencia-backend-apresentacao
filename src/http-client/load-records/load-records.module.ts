import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthAppModule } from 'src/auth-app/auth-app.module';
import { SankhyaLoadRecordsClient } from './load-records.client';

@Module({
  providers: [SankhyaLoadRecordsClient],
  exports: [SankhyaLoadRecordsClient],
  imports: [ConfigModule, AuthAppModule],
})
export class SankhyaLoadRecordsClientModule {}

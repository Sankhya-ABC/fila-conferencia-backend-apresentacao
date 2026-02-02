import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthAppModule } from 'src/auth-app/auth-app.module';
import { SankhyaLoginClient } from './login.client';
import { GatewayClientModule } from '../gateway/gateway.module';

@Module({
  providers: [SankhyaLoginClient],
  exports: [SankhyaLoginClient],
  imports: [ConfigModule, AuthAppModule, GatewayClientModule],
})
export class SankhyaLoginClientModule {}

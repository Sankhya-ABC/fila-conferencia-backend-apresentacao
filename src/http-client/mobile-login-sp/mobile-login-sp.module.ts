import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthAppModule } from 'src/guards/auth-app/auth-app.module';
import { GatewayClientModule } from '../gateway/gateway.module';
import { SankhyaMobileLoginSPClient } from './mobile-login-sp.client';

@Module({
  providers: [SankhyaMobileLoginSPClient],
  exports: [SankhyaMobileLoginSPClient],
  imports: [ConfigModule, AuthAppModule, GatewayClientModule],
})
export class SankhyaMobileLoginSPClientModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthAppModule } from 'src/guards/auth-app/auth-app.module';
import { GatewayClient } from './gateway.client';

@Module({
  providers: [GatewayClient],
  exports: [GatewayClient],
  imports: [ConfigModule, AuthAppModule],
})
export class GatewayClientModule {}

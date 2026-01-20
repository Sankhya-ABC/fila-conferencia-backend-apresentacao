import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthAppModule } from 'src/auth-app/auth-app.module';
import { HttpClient } from './http-client';

@Module({
  providers: [HttpClient],
  exports: [HttpClient],
  imports: [ConfigModule, AuthAppModule],
})
export class HttpClientModule {}

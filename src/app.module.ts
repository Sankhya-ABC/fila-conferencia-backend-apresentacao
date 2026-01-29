import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthAppGuard } from './auth-app/auth-app.guard';
import { AuthAppModule } from './auth-app/auth-app.module';
import { envMapping, envSchema } from './config/env.schema';
import { FilaConferenciaModule } from './modules/fila-conferencia/fila-conferencia.module';
import { ParceiroModule } from './modules/parceiro/parceiro.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    FilaConferenciaModule,
    AuthAppModule,
    ParceiroModule,
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envMapping],
      validationSchema: envSchema,
    }),
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: AuthAppGuard }],
})
export class AppModule {}

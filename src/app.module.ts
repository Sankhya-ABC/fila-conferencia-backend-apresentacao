import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthAppGuard } from './auth-app/auth-app.guard';
import { AuthAppModule } from './auth-app/auth-app.module';
import { envMapping, envSchema } from './config/env.schema';
import { AuthModule } from './modules/auth/auth.module';
import { EmpresaModule } from './modules/empresa/empresa.module';
import { ConferenciaModule } from './modules/conferencia/conferencia.module';
import { ParceiroModule } from './modules/parceiro/parceiro.module';
import { SeparacaoModule } from './modules/separacao/separacao.module';

@Module({
  imports: [
    ConferenciaModule,
    AuthAppModule,
    ParceiroModule,
    EmpresaModule,
    SeparacaoModule,
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

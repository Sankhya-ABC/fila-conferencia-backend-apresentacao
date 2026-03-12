import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthAppGuard } from './core/guards/auth-app/auth-app.guard';
import { AuthAppModule } from './core/guards/auth-app/auth-app.module';
import { envMapping, envSchema } from './core/config/env.schema';
import { AuthModule } from './modules/auth/auth.module';
import { EmpresaModule } from './modules/empresa/empresa.module';
import { ConferenciaModule } from './modules/conferencia/conferencia.module';
import { ParceiroModule } from './modules/parceiro/parceiro.module';
import { SeparacaoModule } from './modules/separacao/separacao.module';
import { DominioModule } from './modules/dominio/dominio.module';
import { LoggerModule } from './core/logger/logger.module';
import { LoggerInterceptor } from './core/logger/logger.interceptor';

@Module({
  imports: [
    AuthAppModule,
    ConferenciaModule,
    DominioModule,
    ParceiroModule,
    EmpresaModule,
    SeparacaoModule,
    AuthModule,
    LoggerModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envMapping],
      validationSchema: envSchema,
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: AuthAppGuard },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggerInterceptor,
    },
  ],
})
export class AppModule {}

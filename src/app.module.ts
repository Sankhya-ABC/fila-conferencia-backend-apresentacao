import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthAppGuard } from './auth-app/auth-app.guard';
import { AuthAppModule } from './auth-app/auth-app.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { ConfigModule } from '@nestjs/config';
import { envMapping, envSchema } from './config/env.schema';
import { FilasConferenciaModule } from './modules/filas-conferencia/filas-conferencia.module';

@Module({
  imports: [
    UsuariosModule,
    FilasConferenciaModule,
    AuthAppModule,
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

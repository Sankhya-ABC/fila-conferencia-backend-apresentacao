import { Module } from '@nestjs/common';
import { FilasConferenciaController } from './filas-conferencia.controller';
import { FilasConferenciaService } from './filas-conferencia.service';
import { GatewayClientModule } from 'src/http-client/gateway/gateway.module';
import { AuthAppModule } from 'src/auth-app/auth-app.module';

@Module({
  controllers: [FilasConferenciaController],
  providers: [FilasConferenciaService],
  imports: [GatewayClientModule, AuthAppModule],
})
export class FilasConferenciaModule {}

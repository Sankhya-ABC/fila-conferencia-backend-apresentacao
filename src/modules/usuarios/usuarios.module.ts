import { Module } from '@nestjs/common';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';
import { GatewayClientModule } from 'src/http-client/gateway/gateway.module';
import { AuthAppModule } from 'src/auth-app/auth-app.module';

@Module({
  controllers: [UsuariosController],
  providers: [UsuariosService],
  imports: [GatewayClientModule, AuthAppModule],
})
export class UsuariosModule {}

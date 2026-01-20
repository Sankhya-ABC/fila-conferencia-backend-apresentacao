import { Module } from '@nestjs/common';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';
import { HttpClientModule } from 'src/http-client/http-client.module';
import { AuthAppModule } from 'src/auth-app/auth-app.module';

@Module({
  controllers: [UsuariosController],
  providers: [UsuariosService],
  imports: [HttpClientModule, AuthAppModule],
})
export class UsuariosModule {}

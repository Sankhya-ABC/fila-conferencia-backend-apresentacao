import { Module } from '@nestjs/common';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';
import { HttpClientModule } from 'src/http-client/http-client.module';

@Module({
  controllers: [UsuariosController],
  providers: [UsuariosService],
  imports: [HttpClientModule],
})
export class UsuariosModule {}

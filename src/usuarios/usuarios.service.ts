import { Injectable } from '@nestjs/common';
import { UsuariosClient } from './client/usuarios.client';
import { UsuarioDTO } from './dto/usuarios.dto';

@Injectable()
export class UsuariosService {
  private client = new UsuariosClient();

  create(dto: UsuarioDTO) {
    return this.client.create(dto);
  }

  findAll() {
    return this.client.findAll();
  }

  findOne(id: string) {
    return this.client.findById(id);
  }

  update(id: string, dto: UsuarioDTO) {
    return this.client.update(id, dto);
  }

  remove(id: string) {
    return this.client.delete(id);
  }
}

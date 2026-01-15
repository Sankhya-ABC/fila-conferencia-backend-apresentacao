import { Injectable } from '@nestjs/common';
import { HttpClient } from 'src/http-client/http-client';
import { UsuarioDTO } from './dto/usuarios.dto';

@Injectable()
export class UsuariosService extends HttpClient {
  async create(data: UsuarioDTO) {
    const r = await this.client.post('/usuarios', data);
    return r.data;
  }

  async findAll() {
    const r = await this.client.get('/usuarios');
    return r.data;
  }

  async findById(id: string) {
    const r = await this.client.get(`/usuarios/${id}`);
    return r.data;
  }

  async update(id: string, data: UsuarioDTO) {
    const r = await this.client.put(`/usuarios/${id}`, data);
    return r.data;
  }

  async delete(id: string) {
    const r = await this.client.delete(`/usuarios/${id}`);
    return r.data;
  }
}

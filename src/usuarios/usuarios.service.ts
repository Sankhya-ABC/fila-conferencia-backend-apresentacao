import { Injectable } from '@nestjs/common';
import { HttpClient } from 'src/http-client/http-client';
import { UsuarioDTO } from './dto/usuarios.dto';

@Injectable()
export class UsuariosService {
  constructor(private readonly http: HttpClient) {}

  async create(data: UsuarioDTO) {
    const response = await this.http.client.post('/usuarios', data);
    return response.data;
  }

  async findAll() {
    const response = await this.http.client.get('/usuarios');
    return response.data;
  }

  async findById(id: string) {
    const response = await this.http.client.get(`/usuarios/${id}`);
    return response.data;
  }

  async update(id: string, data: UsuarioDTO) {
    const response = await this.http.client.put(`/usuarios/${id}`, data);
    return response.data;
  }

  async delete(id: string) {
    const response = await this.http.client.delete(`/usuarios/${id}`);
    return response.data;
  }
}

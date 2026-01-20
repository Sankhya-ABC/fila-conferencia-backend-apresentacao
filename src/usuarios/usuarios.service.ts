import { Injectable } from '@nestjs/common';
import { GatewayClient } from 'src/http-client/gateway/gateway.client';
import { UsuarioDTO } from './dto/usuarios.dto';

@Injectable()
export class UsuariosService {
  constructor(private readonly gateway: GatewayClient) {}

  async create(data: UsuarioDTO) {
    const response = await this.gateway.client.post('/usuarios', data);
    return response.data;
  }

  async findAll() {
    const response = await this.gateway.client.get('/usuarios');
    return response.data;
  }

  async findById(id: string) {
    const response = await this.gateway.client.get(`/usuarios/${id}`);
    return response.data;
  }

  async update(id: string, data: UsuarioDTO) {
    const response = await this.gateway.client.put(`/usuarios/${id}`, data);
    return response.data;
  }

  async delete(id: string) {
    const response = await this.gateway.client.delete(`/usuarios/${id}`);
    return response.data;
  }
}

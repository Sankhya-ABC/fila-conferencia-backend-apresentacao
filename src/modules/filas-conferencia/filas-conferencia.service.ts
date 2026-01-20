import { Injectable } from '@nestjs/common';
import { GatewayClient } from 'src/http-client/gateway/gateway.client';
import { FilaConferenciaDTO } from './dto/filas-conferencia.dto';

@Injectable()
export class FilasConferenciaService {
  constructor(private readonly gateway: GatewayClient) {}

  async create(data: FilaConferenciaDTO) {
    const response = await this.gateway.client.post('/filas-conferencia', data);
    return response.data;
  }

  async findAll() {
    const response = await this.gateway.client.get('/filas-conferencia');
    return response.data;
  }

  async findById(id: string) {
    const response = await this.gateway.client.get(`/filas-conferencia/${id}`);
    return response.data;
  }

  async update(id: string, data: FilaConferenciaDTO) {
    const response = await this.gateway.client.put(
      `/filas-conferencia/${id}`,
      data,
    );
    return response.data;
  }

  async delete(id: string) {
    const response = await this.gateway.client.delete(
      `/filas-conferencia/${id}`,
    );
    return response.data;
  }
}

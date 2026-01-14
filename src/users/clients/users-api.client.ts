import { HttpClient } from '../../http/http.client';
import { UserDto } from '../dto/users.dto';

export class UsersApiClient extends HttpClient {
  async create(data: UserDto) {
    const r = await this.client.post('/users', data);
    return r.data;
  }

  async findAll() {
    const r = await this.client.get('/users');
    return r.data;
  }

  async findById(id: string) {
    const r = await this.client.get(`/users/${id}`);
    return r.data;
  }

  async update(id: string, data: UserDto) {
    const r = await this.client.put(`/users/${id}`, data);
    return r.data;
  }

  async delete(id: string) {
    const r = await this.client.delete(`/users/${id}`);
    return r.data;
  }
}

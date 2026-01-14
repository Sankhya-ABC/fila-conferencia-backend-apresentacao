import { Injectable } from '@nestjs/common';
import { UsersApiClient } from './clients/users-api.client';
import { UserDto } from './dto/users.dto';

@Injectable()
export class UsersService {
  private client = new UsersApiClient();

  create(dto: UserDto) {
    return this.client.create(dto);
  }

  findAll() {
    return this.client.findAll();
  }

  findOne(id: string) {
    return this.client.findById(id);
  }

  update(id: string, dto: UserDto) {
    return this.client.update(id, dto);
  }

  remove(id: string) {
    return this.client.delete(id);
  }
}

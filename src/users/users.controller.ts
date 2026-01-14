import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UserDto } from './dto/users.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Criar usuário' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  create(@Body() dto: UserDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar usuários' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar usuário por ID' })
  @ApiParam({ name: 'id', example: 'uuid' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar usuário' })
  update(@Param('id') id: string, @Body() dto: UserDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover usuário' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

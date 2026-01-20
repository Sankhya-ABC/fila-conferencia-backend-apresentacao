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
import { UsuariosService } from './usuarios.service';
import { UsuarioDTO } from './dto/usuarios.dto';

@ApiTags('Usuários')
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly service: UsuariosService) {}

  @Post()
  @ApiOperation({ summary: 'Criar Usuário' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  create(@Body() dto: UsuarioDTO) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos Usuários' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar Usuário por ID' })
  @ApiParam({ name: 'id', example: 'uuid' })
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar Usuário' })
  update(@Param('id') id: string, @Body() dto: UsuarioDTO) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar Usuário' })
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UsuarioService } from './usuario.service';

@Controller('usuarios')
export class UsuarioController {
  constructor(private readonly service: UsuarioService) {}

  @Get()
  async getUsuarios(@Query() query: any) {
    return this.service.getUsuarios(query);
  }

  @Patch(':codigo/status')
  async toogleStatus(@Param('codigo') codigo: number) {
    return this.service.toogleStatus(Number(codigo));
  }

  @Post('redefinir-ativar-lote')
  async redefinirAtivarLote(@Body('emails') emails: string[]) {
    return this.service.redefinirAtivarLote(emails);
  }
}

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { EmpresaFilter } from './dto/empresa.dto';
import { EmpresaService } from './empresa.service';
import { AuthUserGuard } from 'src/core/guards/auth-user/auth-user.guard';

@UseGuards(AuthUserGuard)
@ApiTags('Empresas')
@Controller('empresas')
export class EmpresaController {
  constructor(private readonly service: EmpresaService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos Empresas com Filtro' })
  getEmpresas(@Query() queryParams: EmpresaFilter) {
    return this.service.getEmpresas(queryParams);
  }
}

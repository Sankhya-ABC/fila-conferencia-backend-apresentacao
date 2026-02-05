import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ParceiroFilter } from './dto/parceiro.dto';
import { ParceiroService } from './parceiro.service';
import { AuthUserGuard } from 'src/auth-user/auth-user.guard';

@UseGuards(AuthUserGuard)
@ApiTags('Parceiros')
@Controller('parceiros')
export class ParceiroController {
  constructor(private readonly service: ParceiroService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos Parceiros com Filtro' })
  getParceiros(@Query() queryParams: ParceiroFilter) {
    return this.service.getParceiros(queryParams);
  }
}

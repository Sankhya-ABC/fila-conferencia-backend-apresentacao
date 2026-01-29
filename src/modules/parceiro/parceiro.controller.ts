import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ParceiroFilter } from './dto/parceiro.dto';
import { ParceiroService } from './parceiro.service';

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

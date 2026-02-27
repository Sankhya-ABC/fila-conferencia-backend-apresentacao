import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

// Filter
export class EmpresaFilter {
  @ApiProperty({ example: 'Maria ou 12345678900' })
  @IsString()
  @IsNotEmpty()
  search: string;
}

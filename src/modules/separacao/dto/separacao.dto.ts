import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

// Filter
export class NumeroNotaFilter {
  @ApiProperty({ example: '1234' })
  @IsString()
  @IsNotEmpty()
  numeroNota: string;
}

export class IdAndControleProdutoFilter {
  @ApiProperty({ example: '1234' })
  @IsString()
  @IsNotEmpty()
  idProduto: string;
  controle: string;
}

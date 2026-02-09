import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

// Filter
export class NumeroUnicoFilter {
  @ApiProperty({ example: '1234' })
  @IsString()
  @IsNotEmpty()
  numeroUnico: string;
}

export class IdAndControleProdutoFilter {
  @ApiProperty({ example: '1234' })
  @IsString()
  @IsNotEmpty()
  idProduto: string;
  controle: string;
}

export interface IniciarConferenciaParams {
  idUsuario: string;
  numeroNota: string;
  numeroUnico: string;
}

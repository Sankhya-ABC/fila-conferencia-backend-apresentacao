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

  @ApiProperty({ example: 'Azul' })
  @IsString()
  @IsNotEmpty()
  controle: string;
}

export class IniciarConferenciaParams {
  @ApiProperty({ example: '1234' })
  @IsString()
  @IsNotEmpty()
  idUsuario: string;

  @ApiProperty({ example: '1234' })
  @IsString()
  @IsNotEmpty()
  numeroNota: string;

  @ApiProperty({ example: '1234' })
  @IsString()
  @IsNotEmpty()
  numeroUnico: string;
}

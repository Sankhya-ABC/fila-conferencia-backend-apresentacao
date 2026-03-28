import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class NumeroUnicoFilter {
  @ApiProperty({ example: 1234 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  numeroUnico: number;
}

export class NumeroConferenciaFilter {
  @ApiProperty({ example: 1234 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  numeroConferencia: number;
}

export class IdUsuarioFilter {
  @ApiProperty({ example: 1234 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  idUsuario: number;
}

export class IDProdutoFilter {
  @ApiProperty({ example: 1234 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  idProduto: number;
}

export class ControleFilter {
  @ApiProperty({ example: 'Azul' })
  @IsString()
  @IsNotEmpty()
  controle: string;
}

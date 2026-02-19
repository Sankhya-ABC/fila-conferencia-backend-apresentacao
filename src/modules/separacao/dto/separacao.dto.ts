import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

// Filter
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

export class IniciarConferenciaBody {
  @ApiProperty({ example: 1234 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  idUsuario: number;

  @ApiProperty({ example: 1234 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  numeroUnico: number;
}

export class AtualizarCabecalhoConferenciaParams {
  @ApiProperty({ example: 1234 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  numeroUnico: number;

  @ApiProperty({ example: 1234 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  numeroConferencia: number;

  @ApiProperty({ example: 1234 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  idUsuario: number;
}

export class AtualizarCabecalhoNotaParams {
  @ApiProperty({ example: 1234 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  numeroUnico: number;

  @ApiProperty({ example: 1234 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  numeroConferencia: number;
}

import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ControleFilter, IDProdutoFilter } from 'src/modules/dto/model';

export class PostRemoverVolumeParams {
  @ApiProperty({ example: 1234 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  numeroConferencia: number;

  @ApiProperty({ example: 1234 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  numeroVolume: number;
}

export class GarantirVolumeParams extends PostRemoverVolumeParams {}

export class PostItemConferidoVolume {
  @ApiProperty({ example: 1234 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  numeroConferencia: number;

  @ApiProperty({ example: 1234 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  numeroVolume: number;

  @ApiProperty({ example: 1234 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  idProduto: number;

  @ApiProperty({ example: 'Rosa' })
  @IsString()
  @IsOptional()
  controle: string;

  @ApiProperty({ example: 1234 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  quantidadeConvertida: number;

  @ApiProperty({ example: 'UN' })
  @IsString()
  @IsNotEmpty()
  unidade: string;
}

export class PostDevolverItemConferido {
  @ApiProperty({ example: 1234 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  numeroConferencia: number;

  @ApiProperty({ example: 1234 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  numeroUnico: number;

  @ApiProperty({ example: 1234 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  idProduto: number;

  @ApiProperty({ example: 'Rosa' })
  @IsString()
  @IsNotEmpty()
  controle: string;
}

export class CodigosDeBarraParams extends IntersectionType(
  IDProdutoFilter,
  ControleFilter,
) {}

export class VerificarItemConferidoVolumeParams extends IntersectionType(
  GarantirVolumeParams,
  CodigosDeBarraParams,
) {}

export class AtualizarItemConferidoVolumeParams extends PostRemoverVolumeParams {
  @ApiProperty({ example: 1234 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  seqItem: number;

  @ApiProperty({ example: 1234 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  quantidadeConvertida: number;
}

export class InserirItemConferidoVolumeParams extends VerificarItemConferidoVolumeParams {
  @ApiProperty({ example: 1234 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  quantidadeConvertida: number;

  @ApiProperty({ example: 'UN' })
  @IsString()
  @IsNotEmpty()
  unidade: string;
}

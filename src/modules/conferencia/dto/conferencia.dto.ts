import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

// Filter
export class FilaConferenciaFilter {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  codigoStatus?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  numeroModial?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  numeroNota?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  numeroUnico?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  dataInicio?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  dataFim?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  idParceiro?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  idEmpresa?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  codigoTipoMovimento?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  codigoTipoOperacao?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  codigoTipoEntrega?: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsEnum, IsString } from 'class-validator';

export enum Status {
  TODOS = 'Todos',
  AGUARDANDO_CONFERENCIA = 'Aguardando Conferência',
  EM_ANDAMENTO = 'Em Andamento',
  AGUARDANDO_RECONTAGEM = 'Aguardando Recontagem',
  RECONTAGEM_EM_ANDAMENTO = 'Recontagem em Andamento',
}

export enum TipoMovimento {
  COMPRA = 'Compra',
  PEDIDO_VENDA = 'Pedido de Venda',
}

export enum TipoOperacao {
  NOTA_FISCAL_PRODUTO_S_PD = 'Nota Fiscal - Produto (S/PD)',
  NOTA_FISCAL_PRODUTO = 'Nota Fiscal - Produto',
  CUBAGEM_PEDIDO = 'Cubagem de Pedido',
}

export enum TipoEntrega {
  TRANSPORTADORA = 'Transportadora',
}

export class FilaConferenciaDTO {
  @ApiProperty({ enum: Status, example: Status.AGUARDANDO_CONFERENCIA })
  @IsEnum(Status)
  status: Status;

  @ApiProperty({ example: '1234' })
  @IsString()
  idEmpresa: string;

  @ApiProperty({ example: '1234' })
  @IsString()
  numeroModial: string;

  @ApiProperty({ example: '1234' })
  @IsString()
  numeroNota: string;

  @ApiProperty({ example: '1234' })
  @IsString()
  numeroUnico: string;

  @ApiProperty({ example: new Date() })
  @IsDate()
  dataMovimento: Date;

  @ApiProperty({ enum: TipoMovimento, example: TipoMovimento.COMPRA })
  @IsEnum(TipoMovimento)
  tipoMovimento: TipoMovimento;

  @ApiProperty({ enum: TipoOperacao, example: TipoOperacao.CUBAGEM_PEDIDO })
  @IsEnum(TipoOperacao)
  tipoOperacao: TipoOperacao;

  @ApiProperty({ enum: TipoEntrega, example: TipoEntrega.TRANSPORTADORA })
  @IsEnum(TipoEntrega)
  tipoEntrega: TipoEntrega;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  nomeParceiro: string;

  @ApiProperty({ example: '1234' })
  @IsString()
  numeroParceiro: string;

  @ApiProperty({ example: '1234' })
  @IsString()
  numeroVendedor: string;

  @ApiProperty({ example: '1234.56' })
  @IsString()
  valorNota: string;

  @ApiProperty({ example: 'Caixa - 10cm x 20cm x 5cm' })
  @IsString()
  volume: string;

  @ApiProperty({ example: '1234' })
  @IsString()
  idUsuarioInclusao: string;

  @ApiProperty({ example: '1234' })
  @IsString()
  idUsuarioAlteracao: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';

export enum TipoUsuario {
  ADMINSTRADOR = 'ADMINSTRADOR',
  BASICO = 'BASICO',
}

export class UsuarioDTO {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(3)
  nome: string;

  @ApiProperty({ example: 'john@email.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ enum: TipoUsuario, example: TipoUsuario.BASICO })
  @IsEnum(TipoUsuario)
  tipoUsuario: TipoUsuario;
}

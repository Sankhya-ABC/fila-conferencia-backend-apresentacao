import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginRequest {
  @ApiProperty({ example: 'Maria' })
  @IsString()
  @IsNotEmpty()
  usuario: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  senha: string;
}

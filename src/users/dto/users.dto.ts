import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum UserRole {
  ADMIN = 'ADMIN',
  COMMON = 'COMMON',
}

export class UserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({ example: 'john@email.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.COMMON })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

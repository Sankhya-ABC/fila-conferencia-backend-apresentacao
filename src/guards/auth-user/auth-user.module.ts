import { Module } from '@nestjs/common';
import { AuthUserService } from './auth-user.service';

@Module({
  providers: [AuthUserService],
  exports: [AuthUserService],
})
export class AuthUserModule {}

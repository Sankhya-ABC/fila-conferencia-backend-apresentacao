import { Module } from '@nestjs/common';
import { AuthAppService } from './auth-app.service';
import { AuthAppController } from './auth-app.controller';

@Module({
  providers: [AuthAppService],
  controllers: [AuthAppController],
  exports: [AuthAppService],
})
export class AuthAppModule {}

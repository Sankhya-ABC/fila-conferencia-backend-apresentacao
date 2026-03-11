import { Module } from '@nestjs/common';
import { AuthAppModule } from 'src/guards/auth-app/auth-app.module';
import { AuthUserModule } from 'src/guards/auth-user/auth-user.module';
import { GatewayClientModule } from 'src/http-client/gateway/gateway.module';
import { SankhyaMobileLoginSPClientModule } from 'src/http-client/mobile-login-sp/mobile-login-sp.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  imports: [
    GatewayClientModule,
    AuthAppModule,
    AuthUserModule,
    SankhyaMobileLoginSPClientModule,
  ],
})
export class AuthModule {}

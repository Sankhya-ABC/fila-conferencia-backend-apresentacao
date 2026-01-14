import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthAppGuard } from './auth-app/auth-app.guard';
import { AuthAppModule } from './auth-app/auth-app.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [UsersModule, AuthAppModule],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: AuthAppGuard }],
})
export class AppModule {}

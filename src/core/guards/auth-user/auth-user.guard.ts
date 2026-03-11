import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthUserService } from './auth-user.service';

@Injectable()
export class AuthUserGuard implements CanActivate {
  constructor(private readonly authUserService: AuthUserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException();
    }

    const [, token] = authHeader.split(' ');

    const session = await this.authUserService.getByToken(token);

    if (!session) {
      throw new UnauthorizedException();
    }

    req.user = session;
    return true;
  }
}

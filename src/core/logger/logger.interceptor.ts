import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import type { Logger } from 'pino';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  constructor(@Inject('LOGGER') private readonly logger: Logger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (process.env.HTTP_LOG_ENABLED !== 'true') {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    const { method, url } = req;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;

        this.logger.info(
          {
            method,
            url,
            status: res.statusCode,
            duration,
          },
          'HTTP Request',
        );
      }),
    );
  }
}

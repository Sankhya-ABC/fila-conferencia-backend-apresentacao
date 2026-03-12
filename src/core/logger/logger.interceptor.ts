import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap, catchError } from 'rxjs';
import type { Logger } from 'pino';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  constructor(@Inject('LOGGER') private readonly logger: Logger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();

    const controller = context.getClass().name;
    const handler = context.getHandler().name;

    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;

        this.logger.info({
          method: req.method,
          url: req.url,
          controller,
          handler,
          duration,
        });
      }),

      catchError((error) => {
        const duration = Date.now() - start;

        this.logger.error({
          method: req.method,
          url: req.url,
          controller,
          handler,
          duration,
          error: error.message,
          stack: error.stack?.split('\n'),
        });

        throw error;
      }),
    );
  }
}

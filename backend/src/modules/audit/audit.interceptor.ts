import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response } from 'express';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { Repository } from 'typeorm';
import { CryptoService } from '../../common/security/crypto.service';
import { RequestPrincipal } from '../../common/security/security.decorators';
import { EventoAuditoria } from '../../database/entities/trl.entities';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(EventoAuditoria) private readonly events: Repository<EventoAuditoria>,
    private readonly crypto: CryptoService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request & {
      user?: RequestPrincipal;
      correlationId?: string;
    }>();
    const response = context.switchToHttp().getResponse<Response>();
    const persist = (result: string) => {
      const ip = request.ip || request.socket.remoteAddress;
      // WARNING: la auditoría es no bloqueante para preservar disponibilidad; una caída de PostgreSQL puede dejar eventos sin registrar.
      void this.events.save(this.events.create({
        id_actor: request.user?.id_usuario ?? null,
        accion: request.method,
        recurso: request.route?.path ? `${request.baseUrl}${request.route.path}` : request.path,
        resultado: result,
        correlation_id: request.correlationId ?? 'unknown',
        ip_hash: ip ? this.crypto.hmac(ip) : null,
      })).catch(() => undefined);
    };
    return next.handle().pipe(
      tap(() => persist(String(response.statusCode))),
      catchError((error: unknown) => {
        persist('ERROR');
        return throwError(() => error);
      }),
    );
  }
}

import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  use(request: Request & { correlationId?: string }, response: Response, next: NextFunction): void {
    const supplied = request.header('x-correlation-id');
    request.correlationId = supplied && /^[a-zA-Z0-9._-]{1,80}$/.test(supplied) ? supplied : randomUUID();
    response.setHeader('x-correlation-id', request.correlationId);
    next();
  }
}

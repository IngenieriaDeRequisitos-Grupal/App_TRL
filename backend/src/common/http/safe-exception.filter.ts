import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class SafeExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SafeExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request & { correlationId?: string }>();
    const response = http.getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const safeResponse = exception instanceof HttpException
      ? exception.getResponse()
      : { message: 'Error interno del servidor' };

    if (!(exception instanceof HttpException) || status >= 500) {
      this.logger.error({
        correlationId: request.correlationId,
        method: request.method,
        path: request.path,
        errorType: exception instanceof Error ? exception.name : 'UnknownError',
      });
    }
    response.status(status).json({
      statusCode: status,
      correlationId: request.correlationId,
      ...(typeof safeResponse === 'string' ? { message: safeResponse } : safeResponse),
    });
  }
}

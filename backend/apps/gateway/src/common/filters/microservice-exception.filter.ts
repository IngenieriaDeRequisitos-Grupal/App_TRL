import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

/**
 * Traduce los errores propagados por los microservicios via TCP/RabbitMQ
 * (que llegan como objetos planos, no instancias de HttpException) a
 * respuestas HTTP correctas en el gateway.
 */
@Catch()
export class MicroserviceExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json(exception.getResponse());
      return;
    }

    const status = exception?.status || exception?.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception?.message || exception?.response?.message || 'Error interno del servidor';
    response.status(status).json({ statusCode: status, message });
  }
}

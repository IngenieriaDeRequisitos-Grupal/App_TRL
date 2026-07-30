import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { NombreRol } from '../domain.enums';
import { RequestPrincipal, ROLES_KEY } from './security.decorators';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<NombreRol[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) return true;
    const request = context.switchToHttp().getRequest<{ user?: RequestPrincipal }>();
    if (!request.user || !roles.includes(request.user.rol)) {
      throw new ForbiddenException('No tiene permisos para esta operación');
    }
    return true;
  }
}

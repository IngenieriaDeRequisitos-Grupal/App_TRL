import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { NombreRol } from '../domain.enums';

export const IS_PUBLIC_KEY = 'security:is_public';
export const ROLES_KEY = 'security:roles';
export const CONSENT_NOT_REQUIRED_KEY = 'security:consent_not_required';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
export const Roles = (...roles: NombreRol[]) => SetMetadata(ROLES_KEY, roles);
export const ConsentNotRequired = () => SetMetadata(CONSENT_NOT_REQUIRED_KEY, true);

export interface RequestPrincipal {
  id_usuario: string;
  id_sesion: string;
  correo_electronico: string;
  rol: NombreRol;
  version_sesion: number;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): RequestPrincipal => {
    const request = context.switchToHttp().getRequest<{ user: RequestPrincipal }>();
    return request.user;
  },
);

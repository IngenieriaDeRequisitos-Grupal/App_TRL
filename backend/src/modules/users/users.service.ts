import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { authenticator } from 'otplib';
import { DataSource, Repository } from 'typeorm';
import { EstadoUsuario, NombreRol } from '../../common/domain.enums';
import { CryptoService } from '../../common/security/crypto.service';
import { RequestPrincipal } from '../../common/security/security.decorators';
import {
  Administrador,
  Evaluador,
  GestorIdi,
  Investigador,
  Mfa,
  Rol,
  Sesion,
  Usuario,
} from '../../database/entities/trl.entities';
import { CreateUsuarioDto, ListQueryDto, UpdateUsuarioAccessDto } from './users.dto';

export interface SafeUsuario {
  id_usuario: string;
  nombre_completo: string;
  correo_electronico: string;
  estado: EstadoUsuario;
  rol: NombreRol;
  especialidad_tecnica?: string | null;
  departamento?: string | null;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
    private readonly crypto: CryptoService,
    @InjectRepository(Usuario) private readonly users: Repository<Usuario>,
    @InjectRepository(Rol) private readonly roles: Repository<Rol>,
    @InjectRepository(Sesion) private readonly sessions: Repository<Sesion>,
  ) {}

  async create(dto: CreateUsuarioDto): Promise<SafeUsuario & { mfa_provisioning_uri: string; mfa_secret: string }> {
    const email = dto.correo_electronico.trim().toLowerCase();
    const cedulaHash = this.crypto.hmac(`cedula:${dto.cedula}`);
    if (await this.users.exists({ where: [{ correo_electronico: email }, { cedula_hash: cedulaHash }] })) {
      throw new ConflictException('El usuario ya existe');
    }

    const secret = authenticator.generateSecret();
    const usuario = await this.dataSource.transaction(async (manager) => {
      const role = await manager.getRepository(Rol).findOne({ where: { nombre_rol: dto.rol } });
      if (!role) throw new ConflictException('El rol solicitado no está configurado');
      const repository = manager.getRepository(this.entityForRole(dto.rol));
      const common = {
        nombre_completo: dto.nombre_completo.trim(),
        cedula: this.crypto.encryptText(dto.cedula, 'usuario:cedula:v1'),
        cedula_hash: cedulaHash,
        correo_electronico: email,
        hash_contrasena: await this.hashPassword(dto.contrasena),
        rol: role,
        estado: EstadoUsuario.ACTIVO,
      };
      const entity = repository.create({
        ...common,
        ...(dto.rol === NombreRol.EVALUADOR
          ? { especialidad_tecnica: dto.especialidad_tecnica, departamento: dto.departamento }
          : {}),
        ...(dto.rol === NombreRol.GESTOR_IDI ? { departamento: dto.departamento } : {}),
      });
      const saved = await repository.save(entity);
      const session = await manager.getRepository(Sesion).save(
        manager.getRepository(Sesion).create({ usuario: saved, revocada: true }),
      );
      await manager.getRepository(Mfa).save(
        manager.getRepository(Mfa).create({
          sesion: session,
          codigo_totp: this.crypto.encryptText(secret, `mfa:${session.id_sesion}`),
          fecha_emision: new Date(),
          intentos_fallidos: 0,
        }),
      );
      return saved;
    });

    return {
      ...this.toSafe(usuario),
      // SECURITY: el secreto se entrega una sola vez durante el alta y jamás aparece en consultas posteriores.
      mfa_secret: secret,
      mfa_provisioning_uri: authenticator.keyuri(email, 'Plataforma TRL UTPL', secret),
    };
  }

  async list(user: RequestPrincipal, query: ListQueryDto): Promise<{ data: SafeUsuario[]; total: number; page: number; limit: number }> {
    const [users, total] = await this.users.findAndCount({
      relations: { rol: true },
      ...(user.rol === NombreRol.GESTOR_IDI
        ? { where: { rol: { nombre_rol: NombreRol.EVALUADOR } } }
        : {}),
      order: { fecha_creacion: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return { data: users.map((user) => this.toSafe(user)), total, page: query.page, limit: query.limit };
  }

  async updateAccess(id: string, dto: UpdateUsuarioAccessDto): Promise<SafeUsuario> {
    const user = await this.users.findOne({ where: { id_usuario: id }, relations: { rol: true } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    // WARNING: cambiar el rol de una cuenta existente puede desalinear el discriminador de herencia; la interfaz solo permite cambiar el estado hasta migrar ese flujo de forma transaccional.
    if (dto.rol && dto.rol !== user.rol.nombre_rol) {
      const role = await this.roles.findOne({ where: { nombre_rol: dto.rol } });
      if (!role) throw new ConflictException('Rol no configurado');
      user.rol = role;
    }
    if (dto.estado) user.estado = dto.estado;
    user.version_sesion += 1;
    await this.users.save(user);
    await this.sessions.update({ usuario: { id_usuario: user.id_usuario } }, {
      revocada: true,
      token_jwt: null,
      fecha_expiracion: new Date(),
    });
    return this.toSafe(user);
  }

  async bootstrapAdmin(dto: Omit<CreateUsuarioDto, 'rol'>): Promise<ReturnType<UsersService['create']>> {
    if (await this.users.exists()) throw new ConflictException('El bootstrap solo está permitido en una base vacía');
    await this.ensureRoles();
    return this.create({ ...dto, rol: NombreRol.ADMINISTRADOR });
  }

  async ensureRoles(): Promise<void> {
    for (const [nombre_rol, nivel_privilegio] of [
      [NombreRol.ADMINISTRADOR, 'GESTION_IDENTIDAD'],
      [NombreRol.INVESTIGADOR, 'PROYECTOS_PROPIOS'],
      [NombreRol.EVALUADOR, 'SOLICITUDES_ASIGNADAS'],
      [NombreRol.GESTOR_IDI, 'GESTION_TRL'],
    ] as const) {
      if (!(await this.roles.exists({ where: { nombre_rol } }))) {
        await this.roles.save(this.roles.create({ nombre_rol, nivel_privilegio }));
      }
    }
  }

  private entityForRole(role: NombreRol): typeof Usuario {
    const map: Record<NombreRol, typeof Usuario> = {
      [NombreRol.ADMINISTRADOR]: Administrador,
      [NombreRol.INVESTIGADOR]: Investigador,
      [NombreRol.EVALUADOR]: Evaluador,
      [NombreRol.GESTOR_IDI]: GestorIdi,
    };
    return map[role];
  }

  private async hashPassword(password: string): Promise<string> {
    const pepper = this.config.getOrThrow<string>('PASSWORD_PEPPER');
    return bcrypt.hash(`${password}${pepper}`, 12);
  }

  private toSafe(user: Usuario): SafeUsuario {
    const typed = user as Usuario & { especialidad_tecnica?: string | null; departamento?: string | null };
    return {
      id_usuario: user.id_usuario,
      nombre_completo: user.nombre_completo,
      correo_electronico: user.correo_electronico,
      estado: user.estado,
      rol: user.rol.nombre_rol,
      ...(typed.especialidad_tecnica !== undefined ? { especialidad_tecnica: typed.especialidad_tecnica } : {}),
      ...(typed.departamento !== undefined ? { departamento: typed.departamento } : {}),
    };
  }
}

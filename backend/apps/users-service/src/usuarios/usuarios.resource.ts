import { Controller, Injectable, Module, UnauthorizedException } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { BaseCrudService } from '@app/common';
import { CreateUsuarioDto, LoginDto, UpdateUsuarioDto, Usuario } from './usuario.entity';
import { Rol } from '../roles/rol.entity';

const SALT_ROUNDS = 10;

@Injectable()
export class UsuariosService extends BaseCrudService<Usuario> {
  constructor(@InjectRepository(Usuario) repo: Repository<Usuario>) {
    super(repo);
  }

  async create(dto: CreateUsuarioDto): Promise<Usuario> {
    const password_hash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const entity = this.repository.create({
      email: dto.email,
      password_hash,
      estado_cuenta: dto.estado_cuenta,
      rol: { id: dto.id_rol } as Rol,
    });
    return this.repository.save(entity);
  }

  async update(id: number, dto: UpdateUsuarioDto): Promise<Usuario> {
    await this.findOne(id);
    const patch: Partial<Usuario> = {
      email: dto.email,
      estado_cuenta: dto.estado_cuenta,
    };
    if (dto.password) {
      patch.password_hash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    }
    if (dto.id_rol) {
      patch.rol = { id: dto.id_rol } as Rol;
    }
    await this.repository.save({ id, ...patch });
    return this.findOne(id);
  }

  async validateCredentials(dto: LoginDto): Promise<Omit<Usuario, 'password_hash'>> {
    const usuario = await this.repository.findOne({ where: { email: dto.email } });
    if (!usuario) throw new UnauthorizedException('Credenciales invalidas');
    const valido = await bcrypt.compare(dto.password, usuario.password_hash);
    if (!valido) throw new UnauthorizedException('Credenciales invalidas');
    const { password_hash: _omit, ...safe } = usuario;
    return safe;
  }
}

@Controller()
export class UsuariosController {
  constructor(private readonly service: UsuariosService) {}

  @MessagePattern('usuarios.create')
  create(@Payload() dto: CreateUsuarioDto) {
    return this.service.create(dto);
  }

  @MessagePattern('usuarios.findAll')
  findAll() {
    return this.service.findAll();
  }

  @MessagePattern('usuarios.findOne')
  findOne(@Payload() id: number) {
    return this.service.findOne(id);
  }

  @MessagePattern('usuarios.update')
  update(@Payload() payload: { id: number; data: UpdateUsuarioDto }) {
    return this.service.update(payload.id, payload.data);
  }

  @MessagePattern('usuarios.remove')
  remove(@Payload() id: number) {
    return this.service.remove(id);
  }

  @MessagePattern('usuarios.validateCredentials')
  validateCredentials(@Payload() dto: LoginDto) {
    return this.service.validateCredentials(dto);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Usuario])],
  controllers: [UsuariosController],
  providers: [UsuariosService],
  exports: [UsuariosService],
})
export class UsuariosModule {}

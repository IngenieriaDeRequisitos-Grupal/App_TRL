import { Controller, Injectable, Module } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from '@app/common';
import { CreateRolDto, Rol, UpdateRolDto } from './rol.entity';

@Injectable()
export class RolesService extends BaseCrudService<Rol> {
  constructor(@InjectRepository(Rol) repo: Repository<Rol>) {
    super(repo);
  }
}

@Controller()
export class RolesController {
  constructor(private readonly service: RolesService) {}

  @MessagePattern('roles.create')
  create(@Payload() dto: CreateRolDto) {
    return this.service.create(dto);
  }

  @MessagePattern('roles.findAll')
  findAll() {
    return this.service.findAll();
  }

  @MessagePattern('roles.findOne')
  findOne(@Payload() id: number) {
    return this.service.findOne(id);
  }

  @MessagePattern('roles.update')
  update(@Payload() payload: { id: number; data: UpdateRolDto }) {
    return this.service.update(payload.id, payload.data);
  }

  @MessagePattern('roles.remove')
  remove(@Payload() id: number) {
    return this.service.remove(id);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Rol])],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}

import { NotFoundException } from '@nestjs/common';
import { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';

/**
 * Servicio CRUD generico reutilizado por todos los recursos de cada microservicio.
 * Cada entidad expone su clave primaria como propiedad `id` (aliasada a la
 * columna real, p.ej. id_paciente) para poder compartir esta implementacion.
 */
export abstract class BaseCrudService<T extends { id: number | string }> {
  protected constructor(protected readonly repository: Repository<T>) {}

  create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  findAll(): Promise<T[]> {
    return this.repository.find();
  }

  async findOne(id: number | string): Promise<T> {
    const where = { id } as unknown as FindOptionsWhere<T>;
    const entity = await this.repository.findOne({ where });
    if (!entity) {
      throw new NotFoundException(`Registro con id ${id} no encontrado`);
    }
    return entity;
  }

  async update(id: number | string, data: DeepPartial<T>): Promise<T> {
    await this.findOne(id);
    const where = { id } as unknown as FindOptionsWhere<T>;
    await this.repository.update(where, data as any);
    return this.findOne(id);
  }

  async remove(id: number | string): Promise<{ deleted: true }> {
    const entity = await this.findOne(id);
    await this.repository.remove(entity);
    return { deleted: true };
  }
}

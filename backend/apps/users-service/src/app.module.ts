import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesModule } from './roles/roles.resource';
import { Rol } from './roles/rol.entity';
import { UsuariosModule } from './usuarios/usuarios.resource';
import { Usuario } from './usuarios/usuario.entity';
import { CentrosMedicosModule } from './centros-medicos/centros-medicos.resource';
import { CentroMedico } from './centros-medicos/centro-medico.entity';
import { MedicosModule } from './medicos/medicos.resource';
import { Medico } from './medicos/medico.entity';
import { PacientesModule } from './pacientes/pacientes.resource';
import { Paciente } from './pacientes/paciente.entity';
import { AuditoriaModule } from './auditoria/auditoria.resource';
import { AuditoriaAcceso } from './auditoria/auditoria-acceso.entity';
import { ConsentimientosModule } from './consentimientos/consentimientos.resource';
import { ConsentimientoPaciente } from './consentimientos/consentimiento-paciente.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: Number(config.get('DB_PORT')),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME') || config.get<string>('USERS_DB_NAME'),
        entities: [Rol, Usuario, CentroMedico, Medico, Paciente, AuditoriaAcceso, ConsentimientoPaciente],
        synchronize: true,
      }),
    }),
    RolesModule,
    UsuariosModule,
    CentrosMedicosModule,
    MedicosModule,
    PacientesModule,
    AuditoriaModule,
    ConsentimientosModule,
  ],
})
export class AppModule {}

import 'dotenv/config';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { TRL_ENTITIES } from './entities/trl.entities';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : false,
  entities: [...TRL_ENTITIES],
  migrations: [`${__dirname}/migrations/*.{js,ts}`],
  synchronize: false,
  logging: false,
});

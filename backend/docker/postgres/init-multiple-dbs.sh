#!/bin/bash
# Crea una base de datos independiente por microservicio dentro de la misma
# instancia de PostgreSQL (patron "database per service").
set -e
set -u

function create_database() {
  local database=$1
  echo "Creando base de datos '$database'"
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    SELECT 'CREATE DATABASE $database'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$database')\gexec
EOSQL
}

if [ -n "${POSTGRES_MULTIPLE_DATABASES:-}" ]; then
  echo "Bases de datos solicitadas: $POSTGRES_MULTIPLE_DATABASES"
  for db in $(echo "$POSTGRES_MULTIPLE_DATABASES" | tr ',' ' '); do
    create_database "$db"
  done
  echo "Bases de datos creadas correctamente"
fi

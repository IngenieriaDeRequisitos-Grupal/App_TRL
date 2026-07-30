#!/bin/sh
set -eu

psql --set ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  --set=app_password="$POSTGRES_APP_PASSWORD" <<'EOSQL'
SELECT format('CREATE ROLE trl_app LOGIN PASSWORD %L', :'app_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'trl_app') \gexec
GRANT CONNECT ON DATABASE trl_db TO trl_app;
GRANT CREATE ON DATABASE trl_db TO trl_app;
GRANT USAGE, CREATE ON SCHEMA public TO trl_app;
EOSQL

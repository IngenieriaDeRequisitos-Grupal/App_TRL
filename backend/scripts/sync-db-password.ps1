$ErrorActionPreference = 'Stop'

function Get-DotEnvValue {
  param([Parameter(Mandatory = $true)][string]$Key)

  $line = Get-Content -LiteralPath '.env' |
    Where-Object { $_ -match "^$([regex]::Escape($Key))=" } |
    Select-Object -Last 1

  if (-not $line) {
    throw "Falta $Key en backend/.env"
  }

  $value = $line.Substring($line.IndexOf('=') + 1).Trim()
  if (($value.StartsWith('"') -and $value.EndsWith('"')) -or
      ($value.StartsWith("'") -and $value.EndsWith("'"))) {
    $value = $value.Substring(1, $value.Length - 2)
  }
  if ([string]::IsNullOrWhiteSpace($value)) {
    throw "$Key no puede estar vacío"
  }
  return $value
}

$backendDirectory = Split-Path -Parent $PSScriptRoot
Push-Location $backendDirectory
try {
  $appPassword = Get-DotEnvValue -Key 'POSTGRES_APP_PASSWORD'
  if ($appPassword -match '[^A-Za-z0-9._~-]') {
    throw 'POSTGRES_APP_PASSWORD debe usar caracteres seguros para URL: letras, números, punto, guion, guion bajo o ~'
  }

  docker compose up -d --wait postgres
  if ($LASTEXITCODE -ne 0) {
    throw 'PostgreSQL no pudo iniciar'
  }

  $sql = @"
SELECT format(
  CASE WHEN EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'trl_app')
    THEN 'ALTER ROLE trl_app LOGIN PASSWORD %L'
    ELSE 'CREATE ROLE trl_app LOGIN PASSWORD %L'
  END,
  :'app_password'
) \gexec
GRANT CONNECT, CREATE ON DATABASE trl_db TO trl_app;
GRANT USAGE, CREATE ON SCHEMA public TO trl_app;
"@

  $sql | docker compose exec -T postgres psql `
    -U trl_owner `
    -d trl_db `
    --set=ON_ERROR_STOP=1 `
    --set=app_password="$appPassword"
  if ($LASTEXITCODE -ne 0) {
    throw 'No se pudo sincronizar la contraseña de trl_app'
  }

  docker compose up -d --force-recreate api
  if ($LASTEXITCODE -ne 0) {
    throw 'La API no pudo recrearse'
  }

  $healthy = $false
  for ($attempt = 0; $attempt -lt 20; $attempt++) {
    try {
      $response = Invoke-RestMethod -Uri 'http://127.0.0.1:3000/api/health' -TimeoutSec 3
      if ($response.status -eq 'ok') {
        $healthy = $true
        break
      }
    } catch {
      Start-Sleep -Seconds 2
    }
  }

  if (-not $healthy) {
    docker compose logs --no-color --tail=80 api
    throw 'La contraseña fue sincronizada, pero la API no respondió correctamente'
  }

  Write-Host 'OK: contraseña de trl_app sincronizada y API conectada a PostgreSQL.' -ForegroundColor Green
} finally {
  Pop-Location
}

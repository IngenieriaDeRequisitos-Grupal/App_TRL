from dataclasses import dataclass
from typing import Any

import requests
from django.conf import settings


@dataclass
class ApiError(Exception):
    status: int
    message: str
    code: str | None = None


def request_api(
    method: str,
    path: str,
    *,
    token: str | None = None,
    json: dict[str, Any] | None = None,
    files: dict[str, Any] | None = None,
    timeout: int = 15,
) -> Any:
    headers = {'Authorization': f'Bearer {token}'} if token else {}
    try:
        response = requests.request(
            method,
            f'{settings.NESTJS_API_URL}/{path.lstrip("/")}',
            headers=headers,
            json=json,
            files=files,
            timeout=timeout,
        )
    except requests.RequestException as exc:
        raise ApiError(503, 'No se pudo conectar con el backend TRL.') from exc

    content_type = response.headers.get('content-type', '')
    payload = response.json() if 'application/json' in content_type and response.content else None
    if not response.ok:
        if isinstance(payload, dict):
            raw_message = payload.get('message', 'Error del backend')
            message = '; '.join(raw_message) if isinstance(raw_message, list) else str(raw_message)
            raise ApiError(response.status_code, message, payload.get('code'))
        raise ApiError(response.status_code, f'El backend respondió HTTP {response.status_code}.')
    return payload if payload is not None else response.content


def download_api(path: str, token: str) -> requests.Response:
    try:
        response = requests.get(
            f'{settings.NESTJS_API_URL}/{path.lstrip("/")}',
            headers={'Authorization': f'Bearer {token}'},
            timeout=30,
        )
    except requests.RequestException as exc:
        raise ApiError(503, 'No se pudo descargar el archivo.') from exc
    if not response.ok:
        raise ApiError(response.status_code, 'No fue posible descargar la evidencia.')
    return response

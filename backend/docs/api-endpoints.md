# CropSight API — Endpoints

**Base URL:** `http://localhost:8000/api/v1`  
**Autenticación:** `Authorization: Bearer <access_token>` en todos los endpoints protegidos.  
**Última validación:** 2026-05-09

---

## Resumen

| Estado | Cantidad |
|---|---|
| ✅ Implementado y probado | 32 |
| ⚠️ Implementado (requiere servicio externo) | 2 |
| ⏳ Pendiente | 3 |
| **Total** | **37** |

---

## Leyenda

| Ícono | Significado |
|---|---|
| 🔒 | Requiere `Authorization: Bearer <token>` |
| 👑 | Requiere rol `super_admin` |
| 🏢 | Requiere rol `company_admin` o `super_admin` |
| ⚠️ | Requiere servicio externo (MLflow / GitHub) |

---

## Auth

### ✅ `POST /auth/register`
Crea cuenta nueva y retorna tokens.

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Saul Razo","email":"saul@cropsight.io","password":"SecurePass123!"}'
```

| Campo | Tipo | Regla |
|---|---|---|
| `name` | string | 2–100 chars |
| `email` | string | formato email válido |
| `password` | string | mínimo 8 chars |

**Rate limit:** 3 requests/minuto por IP

**Respuesta `201`:**
```json
{
  "access_token": "<jwt>",
  "refresh_token": "<token>",
  "user": { "id":"uuid","name":"Saul Razo","email":"saul@cropsight.io","role":"user","company_id":null,"is_active":true,"created_at":"..." }
}
```
**Errores:** `409` email ya registrado · `422` campos inválidos · `429` rate limit

---

### ✅ `POST /auth/login`
Inicia sesión y retorna tokens.

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"saul@cropsight.io","password":"SecurePass123!"}'
```

**Rate limit:** 5 requests/minuto por IP

**Respuesta `200`:** mismo schema que `/auth/register`  
**Errores:** `401` credenciales inválidas · `429` rate limit

---

### ✅ `POST /auth/refresh`
Renueva el `access_token`.

```bash
curl -X POST http://localhost:8000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"<token>"}'
```

**Rate limit:** 10 requests/minuto por IP

**Respuesta `200`:** `{ "access_token": "<nuevo_jwt>" }`  
**Errores:** `401` token inválido o expirado

---

### ✅ `POST /auth/logout` 🔒
Revoca el `refresh_token`.

```bash
curl -X POST http://localhost:8000/api/v1/auth/logout \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"<token>"}'
```

**Respuesta `204`**

---

### ✅ `GET /auth/me` 🔒
Datos del usuario autenticado.

```bash
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer <token>"
```

**Respuesta `200`:** `UserResponse`

---

### ✅ `POST /auth/forgot-password`
Genera token de reseteo. En dev se imprime en consola del servidor.

```bash
curl -X POST http://localhost:8000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"saul@cropsight.io"}'
```

**Rate limit:** 3 requests/hora por IP

**Respuesta `204`** — siempre, sin revelar si el email existe

---

### ✅ `POST /auth/reset-password`
Cambia la contraseña con el token recibido por correo.

```bash
curl -X POST http://localhost:8000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"<token_del_correo>","new_password":"NuevaPass123!"}'
```

**Rate limit:** 5 requests/hora por IP

**Respuesta `204`**  
**Errores:** `400` token inválido o expirado

---

## Users

### ✅ `GET /users/me` 🔒
Perfil del usuario autenticado.

```bash
curl http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer <token>"
```

**Respuesta `200`:**
```json
{ "id":"uuid","name":"Saul Razo","email":"saul@cropsight.io","role":"user","company_id":null,"is_active":true,"created_at":"..." }
```

---

### ✅ `PUT /users/me` 🔒
Actualiza nombre y/o contraseña del usuario autenticado.

```bash
# Cambiar nombre
curl -X PUT http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Nuevo Nombre"}'

# Cambiar contraseña
curl -X PUT http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"current_password":"SecurePass123!","new_password":"NuevaPass456!"}'
```

> Si se envía `new_password`, `current_password` es obligatorio.

**Respuesta `200`:** `UserResponse`  
**Errores:** `403` password actual incorrecto

---

### ✅ `GET /users/` 🔒 👑
Lista todos los usuarios con paginación.

```bash
curl "http://localhost:8000/api/v1/users/?page=1&limit=20&search=saul&role=user" \
  -H "Authorization: Bearer <token>"
```

| Query param | Tipo | Descripción |
|---|---|---|
| `page` | int ≥1 | default `1` |
| `limit` | int 1–100 | default `20` |
| `search` | string | busca en nombre o email |
| `role` | string | `user` · `company_admin` · `super_admin` |
| `company_id` | UUID | filtra por compañía |

**Respuesta `200`:** `{ "data": [...UserResponse], "meta": { "page","limit","total","pages" } }`  
**Errores:** `403` requiere `super_admin`

---

### ✅ `GET /users/{user_id}` 🔒 👑
Usuario por ID.

```bash
curl http://localhost:8000/api/v1/users/<uuid> \
  -H "Authorization: Bearer <token>"
```

**Respuesta `200`:** `UserResponse`  
**Errores:** `403` requiere `super_admin` · `404` no encontrado

---

### ✅ `PUT /users/{user_id}/status` 🔒 👑
Activa o desactiva un usuario.

```bash
curl -X PUT http://localhost:8000/api/v1/users/<uuid>/status \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"is_active": false}'
```

**Respuesta `200`:** `UserResponse`  
**Errores:** `403` no puedes desactivarte a ti mismo ni a otro `super_admin` · `404` no encontrado

---

### ✅ `DELETE /users/{user_id}` 🔒 👑
Soft-delete de usuario (asigna `deleted_at`, no borra el registro).

```bash
curl -X DELETE http://localhost:8000/api/v1/users/<uuid> \
  -H "Authorization: Bearer <token>"
```

**Respuesta `200`:** `{ "message": "Usuario eliminado correctamente" }`  
**Errores:** `403` no puedes eliminarte a ti mismo ni a otro `super_admin` · `404` no encontrado

---

## Companies

### ✅ `GET /companies/search` 🔒
Busca compañías activas por nombre.

```bash
curl "http://localhost:8000/api/v1/companies/search?name=agri" \
  -H "Authorization: Bearer <token>"
```

> `name` mínimo 2 chars. Máximo 20 resultados, ordenados por nombre.

**Respuesta `200`:**
```json
[{ "id":"uuid","name":"AgriTech SA","sector":"Agriculture","logo_url":null }]
```

---

### ✅ `POST /companies` 🔒
Crea una compañía. El creador pasa a ser `company_admin` automáticamente.

```bash
curl -X POST http://localhost:8000/api/v1/companies \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"AgriTest SA","sector":"Agriculture"}'
```

> Solo usuarios con rol `user` sin compañía asignada pueden crear una.

**Respuesta `201`:**
```json
{ "id":"uuid","name":"AgriTest SA","sector":"Agriculture","logo_url":null,"status":"active","created_at":"..." }
```
**Errores:** `403` usuario ya tiene compañía o no es rol `user` · `409` nombre ya existe

---

### ✅ `GET /companies` 🔒 👑
Lista todas las compañías con paginación.

```bash
curl "http://localhost:8000/api/v1/companies?page=1&limit=20&status=active" \
  -H "Authorization: Bearer <token>"
```

| Query param | Tipo | Descripción |
|---|---|---|
| `page` | int ≥1 | default `1` |
| `limit` | int 1–100 | default `20` |
| `search` | string | busca por nombre |
| `status` | string | `active` · `suspended` |

**Respuesta `200`:** `{ "data": [...CompanyResponse], "meta": { ... } }`  
**Errores:** `403` requiere `super_admin`

---

### ✅ `GET /companies/{id}` 🔒 🏢
Detalle de una compañía.

```bash
curl http://localhost:8000/api/v1/companies/<uuid> \
  -H "Authorization: Bearer <token>"
```

**Respuesta `200`:** `CompanyResponse`  
**Errores:** `403` no es admin de esta compañía · `404` no encontrada

---

### ✅ `PUT /companies/{id}` 🔒 🏢
Actualiza nombre o logo.

```bash
curl -X PUT http://localhost:8000/api/v1/companies/<uuid> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Nuevo Nombre","logo_url":"https://..."}'
```

**Respuesta `200`:** `CompanyResponse`  
**Errores:** `403` sin permisos · `404` no encontrada · `409` nombre ya en uso

---

### ✅ `PUT /companies/{id}/status` 🔒 👑
Activa o suspende una compañía.

```bash
curl -X PUT http://localhost:8000/api/v1/companies/<uuid>/status \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status":"suspended"}'
```

> `status`: `"active"` o `"suspended"`

**Respuesta `200`:** `CompanyResponse`  
**Errores:** `403` requiere `super_admin` · `404` no encontrada

---

### ✅ `GET /companies/{id}/users` 🔒 🏢
Lista usuarios de una compañía.

```bash
curl http://localhost:8000/api/v1/companies/<uuid>/users \
  -H "Authorization: Bearer <token>"
```

**Respuesta `200`:** `[...UserResponse]`  
**Errores:** `403` sin permisos · `404` no encontrada

---

### ✅ `DELETE /companies/{id}/users/{user_id}` 🔒 🏢
Remueve a un usuario de la compañía (su rol vuelve a `user`).

```bash
curl -X DELETE http://localhost:8000/api/v1/companies/<company_uuid>/users/<user_uuid> \
  -H "Authorization: Bearer <token>"
```

**Respuesta `204`**  
**Errores:** `400` no puedes removerte a ti mismo · `403` sin permisos · `404` usuario no en esta compañía

---

## Join Requests

### ✅ `POST /companies/join` 🔒
Solicita unirse a una compañía.

```bash
curl -X POST http://localhost:8000/api/v1/companies/join \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"company_id":"<uuid>"}'
```

> Solo rol `user` sin compañía puede solicitar.

**Respuesta `201`:**
```json
{ "id":"uuid","user_id":"uuid","user_name":"Test User","user_email":"test@cropsight.io","company_id":"uuid","status":"pending","created_at":"...","resolved_at":null }
```
**Errores:** `403` usuario ya tiene compañía · `404` compañía no encontrada · `409` solicitud ya pendiente

---

### ✅ `GET /companies/{id}/requests` 🔒 🏢
Lista solicitudes de ingreso de una compañía.

```bash
curl "http://localhost:8000/api/v1/companies/<uuid>/requests?status=pending" \
  -H "Authorization: Bearer <token>"
```

> `status` (opcional): `pending` · `approved` · `rejected`

**Respuesta `200`:** `[...JoinRequestResponse]`  
**Errores:** `403` sin permisos · `404` no encontrada

---

### ✅ `PUT /companies/{id}/requests/{req_id}` 🔒 🏢
Aprueba o rechaza una solicitud de ingreso.

```bash
curl -X PUT http://localhost:8000/api/v1/companies/<uuid>/requests/<req_uuid> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"action":"approve"}'
```

> `action`: `"approve"` o `"reject"`

**Respuesta `200`:** `JoinRequestResponse` con status actualizado  
**Errores:** `403` sin permisos · `404` solicitud no encontrada · `409` solicitud ya procesada

---

## Predictions

### ✅ `POST /predictions/{id}/feedback` 🔒
Registra si una predicción fue correcta.

```bash
curl -X POST http://localhost:8000/api/v1/predictions/<uuid>/feedback \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"is_correct":false,"correct_label":"Healthy"}'
```

| Campo | Tipo | Descripción |
|---|---|---|
| `is_correct` | bool | `true` si la predicción fue correcta |
| `correct_label` | string | requerido si `is_correct` es `false` |

**Respuesta `201`:**
```json
{ "id":"uuid","prediction_id":"uuid","is_correct":false,"correct_label":"Healthy","created_at":"..." }
```
**Errores:** `403` la predicción no te pertenece · `404` predicción no encontrada · `409` ya existe feedback

---

## Admin — Retraining

### ✅ `POST /admin/retraining/` 🔒 👑
Dispara un job de reentrenamiento vía GitHub Actions.

```bash
curl -X POST http://localhost:8000/api/v1/admin/retraining/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"notes":"Reentrenamiento por drift detectado"}'
```

> `notes` es opcional.

**Respuesta `202`:**
```json
{ "id":"uuid","triggered_by":"uuid","triggered_by_name":"Saul Razo","status":"running","notes":"...","github_run_id":"12345","started_at":"...","finished_at":null }
```
**Errores:** `403` requiere `super_admin` · `502` GitHub Actions no disponible (token inválido o red)

---

### ✅ `GET /admin/retraining/` 🔒 👑
Historial de jobs de reentrenamiento. Actualiza automáticamente el status de jobs activos consultando GitHub.

```bash
curl http://localhost:8000/api/v1/admin/retraining/ \
  -H "Authorization: Bearer <token>"
```

**Respuesta `200`:** `[...RetrainingJobResponse]` ordenado por fecha descendente  
**Errores:** `403` requiere `super_admin`

---

## Admin — Metrics

### ✅ `GET /admin/metrics/usage` 🔒 👑
Métricas de uso de la plataforma con filtro opcional por fechas.

```bash
# Sin filtro
curl http://localhost:8000/api/v1/admin/metrics/usage \
  -H "Authorization: Bearer <token>"

# Con rango de fechas
curl "http://localhost:8000/api/v1/admin/metrics/usage?from=2026-05-01&to=2026-05-09" \
  -H "Authorization: Bearer <token>"
```

| Query param | Formato | Descripción |
|---|---|---|
| `from` | `YYYY-MM-DD` | fecha de inicio (opcional) |
| `to` | `YYYY-MM-DD` | fecha de fin (opcional) |

**Respuesta `200`:**
```json
{
  "total_predictions": 1500,
  "active_users": 42,
  "active_companies": 8,
  "feedback_rate": 0.73,
  "predictions_by_day": [{ "date":"2026-05-04","count":120 }]
}
```
> Respuestas en caché por 60 segundos.

**Errores:** `403` requiere `super_admin`

---

### ✅ `GET /admin/metrics/usage/export` 🔒 👑
Exporta métricas de uso como CSV. Acepta los mismos filtros de fecha que `/usage`.

```bash
curl "http://localhost:8000/api/v1/admin/metrics/usage/export?from=2026-05-01&to=2026-05-09" \
  -H "Authorization: Bearer <token>" \
  -o metricas.csv
```

**Respuesta `200`:** archivo CSV con `Content-Disposition: attachment`  
**Errores:** `403` requiere `super_admin`

---

### ✅ `GET /admin/metrics/export` 🔒 👑
Alias de `/admin/metrics/usage/export`. Mismos parámetros y comportamiento.

```bash
curl "http://localhost:8000/api/v1/admin/metrics/export" \
  -H "Authorization: Bearer <token>" \
  -o metricas.csv
```

---

### ⚠️ `GET /admin/metrics/model` 🔒 👑
Métricas del modelo en producción desde MLflow.

> **Requiere MLflow activo** en `MLFLOW_TRACKING_URI`. Retorna `500` si MLflow no está disponible.

```bash
# Modelo en producción
curl http://localhost:8000/api/v1/admin/metrics/model \
  -H "Authorization: Bearer <token>"

# Versión específica
curl "http://localhost:8000/api/v1/admin/metrics/model?model_version=3" \
  -H "Authorization: Bearer <token>"
```

**Respuesta `200`:**
```json
{
  "model_version":"3","accuracy":0.95,"precision":0.93,"recall":0.95,"f1_score":0.94,
  "per_class_metrics":[{ "label":"Fusarium","precision":0.96,"recall":0.94,"f1":0.95,"support":200 }]
}
```
**Errores:** `403` requiere `super_admin` · `404` no hay modelo en Production · `500` MLflow no disponible

---

### ⚠️ `GET /admin/metrics/drift` 🔒 👑
Métricas de drift entre la distribución de entrenamiento y la actual (PSI).

> **Requiere MLflow activo** y predicciones en la base de datos.

```bash
curl http://localhost:8000/api/v1/admin/metrics/drift \
  -H "Authorization: Bearer <token>"
```

**Respuesta `200`:**
```json
{
  "reference_distribution":[{ "label":"Fusarium","proportion":0.45 }],
  "current_distribution": [{ "label":"Fusarium","proportion":0.61 }],
  "drift_score": 0.18
}
```
**Errores:** `403` requiere `super_admin` · `404` no hay modelo en Production · `500` MLflow no disponible

---

## Pendientes

### ⏳ `POST /predictions/` 🔒
**Responsable:** GALINDO VILLEGAS, JAIME ENRIQUE  
Envía imagen para inferencia y guarda resultado. Body: `multipart/form-data` con campo `image`.

---

### ⏳ `GET /predictions/` 🔒
**Responsable:** GALINDO VILLEGAS, JAIME ENRIQUE  
Historial de predicciones del usuario autenticado con paginación.

---

### ⏳ `GET /admin/models/` 🔒 👑
**Responsable:** ALONSO GONZALEZ, JUAN CARLOS  
Lista versiones del modelo registradas en MLflow.

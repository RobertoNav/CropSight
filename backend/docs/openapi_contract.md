# CropSight — Contrato de Integración API

> **Versión:** 1.0  
> **Fecha:** Abril 2026  
> **Firmado por:** RAZO MAGALLANES, SAUL (Backend PM) · COVARRUBIAS VIVEROS, PAOLA MONSERRAT (Frontend PM) · NAVARRO QUINN, LUIS ROBERTO (CTO)  
> **Estado:** 🟡 Borrador — requiere aprobación en reunión Sprint 1

---

## Índice

1. [Propósito y alcance](#1-propósito-y-alcance)
2. [Convenciones generales](#2-convenciones-generales)
3. [Autenticación](#3-autenticación)
4. [Manejo de errores](#4-manejo-de-errores)
5. [Roles y permisos](#5-roles-y-permisos)
6. [Contrato de mocks para Frontend](#6-contrato-de-mocks-para-frontend)
7. [Especificación OpenAPI completa](#7-especificación-openapi-completa)
8. [Changelog](#8-changelog)

---

## 1. Propósito y alcance

Este documento define el contrato formal entre el equipo de **Backend & API** y el equipo de **Frontend** de CropSight. Establece los endpoints disponibles, sus estructuras de request/response, los códigos de error esperados y las reglas de autenticación.

### Principios del contrato

- **Backend no rompe contratos sin aviso.** Cualquier cambio que altere un request o response existente requiere notificación al Frontend PM con mínimo 24 horas de anticipación.
- **Frontend no asume campos no documentados.** Solo se consumen campos explícitamente listados en este contrato.
- **Los mocks de Frontend siguen este contrato desde Sprint 1.** Esto elimina el bloqueo entre equipos durante el desarrollo paralelo.
- **Versión de API en la URL base.** Todos los endpoints viven bajo `/api/v1/`.

---

## 2. Convenciones generales

| Concepto | Valor |
|---|---|
| Base URL (desarrollo) | `http://localhost:8000/api/v1` |
| Base URL (staging) | `https://api-staging.cropsight.io/api/v1` |
| Base URL (producción) | `https://api.cropsight.io/api/v1` |
| Formato de datos | JSON (`Content-Type: application/json`) |
| Formato de fechas | ISO 8601 — `2026-04-28T10:30:00Z` |
| Paginación | Query params `?page=1&limit=20`, response incluye `total`, `page`, `limit` |
| IDs | UUID v4 como string |
| Imágenes | `multipart/form-data` únicamente en endpoints de predicción |

---

## 3. Autenticación

Todos los endpoints protegidos requieren el header:

```
Authorization: Bearer <access_token>
```

### Ciclo de tokens

```
1. POST /auth/login → recibe access_token (15 min) + refresh_token (7 días)
2. Cuando access_token expira → POST /auth/refresh con refresh_token
3. Si refresh_token expira → redirigir a /login
4. POST /auth/logout → invalida el refresh_token en el servidor
```

### Payload del JWT (decodificado)

```json
{
  "sub": "uuid-del-usuario",
  "email": "usuario@ejemplo.com",
  "role": "user | company_admin | super_admin",
  "company_id": "uuid-de-la-compania | null",
  "exp": 1714999999
}
```

---

## 4. Manejo de errores

Todos los errores siguen esta estructura:

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email o contraseña incorrectos.",
    "details": null
  }
}
```

### Códigos de error estándar

| HTTP Status | Código interno | Cuándo ocurre |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Body inválido o campos faltantes |
| 401 | `UNAUTHORIZED` | Token ausente o expirado |
| 401 | `INVALID_CREDENTIALS` | Email o password incorrectos |
| 403 | `FORBIDDEN` | Token válido pero rol insuficiente |
| 404 | `NOT_FOUND` | Recurso no existe |
| 409 | `CONFLICT` | Email ya registrado, compañía ya existe |
| 413 | `FILE_TOO_LARGE` | Imagen supera 5MB |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Formato de imagen no soportado |
| 422 | `UNPROCESSABLE_ENTITY` | Datos semánticamente inválidos |
| 500 | `INTERNAL_ERROR` | Error inesperado del servidor |

---

## 5. Roles y permisos

| Rol | Valor en JWT | Acceso |
|---|---|---|
| Usuario estándar | `user` | Rutas `/predict`, `/predictions`, `/profile`, `/company/join` |
| Admin de compañía | `company_admin` | Todo lo anterior + rutas `/company/*` |
| Super administrador | `super_admin` | Acceso total incluyendo `/admin/*` |

---

## 6. Contrato de mocks para Frontend

El equipo de Frontend usará **Mock Service Worker (MSW)** durante el desarrollo. Los mocks deben replicar exactamente los response bodies documentados en la sección 7.

Archivo de referencia para mocks: `frontend/src/mocks/handlers.ts`

Estructura de un mock handler:

```typescript
rest.post('/api/v1/auth/login', (req, res, ctx) => {
  return res(ctx.json({
    access_token: "eyJ...",
    refresh_token: "eyJ...",
    user: {
      id: "uuid-123",
      name: "Ana García",
      email: "ana@empresa.com",
      role: "company_admin",
      company_id: "uuid-456"
    }
  }))
})
```

---

## 7. Especificación OpenAPI completa

```yaml
openapi: 3.0.3

info:
  title: CropSight API
  description: >
    API REST para la plataforma CropSight de diagnóstico de enfermedades
    y plagas en cultivos mediante visión computacional.
  version: 1.0.0
  contact:
    name: Backend Team — CropSight
    email: saul.razo@cropsight.io

servers:
  - url: http://localhost:8000/api/v1
    description: Desarrollo local
  - url: https://api-staging.cropsight.io/api/v1
    description: Staging
  - url: https://api.cropsight.io/api/v1
    description: Producción

# ─────────────────────────────────────────────
# COMPONENTES REUTILIZABLES
# ─────────────────────────────────────────────
components:

  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:

    # ── Primitivas ──────────────────────────
    UUID:
      type: string
      format: uuid
      example: "a3f8c2d1-4b5e-4f6a-9c7d-8e1f2a3b4c5d"

    Timestamp:
      type: string
      format: date-time
      example: "2026-04-28T10:30:00Z"

    PaginationMeta:
      type: object
      properties:
        total:
          type: integer
          example: 87
        page:
          type: integer
          example: 1
        limit:
          type: integer
          example: 20

    Error:
      type: object
      properties:
        error:
          type: object
          properties:
            code:
              type: string
              example: "NOT_FOUND"
            message:
              type: string
              example: "El recurso solicitado no existe."
            details:
              nullable: true
              example: null

    # ── Usuario ─────────────────────────────
    UserRole:
      type: string
      enum: [user, company_admin, super_admin]

    UserBase:
      type: object
      properties:
        id:
          $ref: '#/components/schemas/UUID'
        name:
          type: string
          example: "Ana García"
        email:
          type: string
          format: email
          example: "ana@empresa.com"
        role:
          $ref: '#/components/schemas/UserRole'
        company_id:
          $ref: '#/components/schemas/UUID'
          nullable: true
        is_active:
          type: boolean
          example: true
        created_at:
          $ref: '#/components/schemas/Timestamp'

    # ── Compañía ────────────────────────────
    CompanyStatus:
      type: string
      enum: [active, suspended]

    CompanyBase:
      type: object
      properties:
        id:
          $ref: '#/components/schemas/UUID'
        name:
          type: string
          example: "AgroMex S.A. de C.V."
        sector:
          type: string
          example: "Horticultura"
        logo_url:
          type: string
          format: uri
          nullable: true
          example: "https://cropsight-images.s3.amazonaws.com/logos/agromex.png"
        status:
          $ref: '#/components/schemas/CompanyStatus'
        created_at:
          $ref: '#/components/schemas/Timestamp'

    # ── Predicción ──────────────────────────
    ClassProbabilities:
      type: object
      additionalProperties:
        type: number
        format: float
      example:
        Tomato_Early_Blight: 0.94
        Tomato_Healthy: 0.04
        Tomato_Late_Blight: 0.02

    PredictionBase:
      type: object
      properties:
        id:
          $ref: '#/components/schemas/UUID'
        user_id:
          $ref: '#/components/schemas/UUID'
        company_id:
          $ref: '#/components/schemas/UUID'
          nullable: true
        image_url:
          type: string
          format: uri
          example: "https://cropsight-images.s3.amazonaws.com/user_id/1714999999.jpg"
        label:
          type: string
          example: "Tomato_Early_Blight"
        confidence:
          type: number
          format: float
          minimum: 0
          maximum: 1
          example: 0.94
        class_probabilities:
          $ref: '#/components/schemas/ClassProbabilities'
        model_version:
          type: string
          example: "3"
        feedback:
          $ref: '#/components/schemas/FeedbackBase'
          nullable: true
        created_at:
          $ref: '#/components/schemas/Timestamp'

    # ── Feedback ────────────────────────────
    FeedbackBase:
      type: object
      properties:
        id:
          $ref: '#/components/schemas/UUID'
        prediction_id:
          $ref: '#/components/schemas/UUID'
        is_correct:
          type: boolean
          example: false
        correct_label:
          type: string
          nullable: true
          example: "Tomato_Late_Blight"
        created_at:
          $ref: '#/components/schemas/Timestamp'

    # ── Join Request ────────────────────────
    JoinRequestStatus:
      type: string
      enum: [pending, approved, rejected]

    JoinRequestBase:
      type: object
      properties:
        id:
          $ref: '#/components/schemas/UUID'
        user_id:
          $ref: '#/components/schemas/UUID'
        user_name:
          type: string
          example: "Carlos Ramírez"
        user_email:
          type: string
          example: "carlos@gmail.com"
        company_id:
          $ref: '#/components/schemas/UUID'
        status:
          $ref: '#/components/schemas/JoinRequestStatus'
        created_at:
          $ref: '#/components/schemas/Timestamp'
        resolved_at:
          $ref: '#/components/schemas/Timestamp'
          nullable: true

    # ── MLflow Model ────────────────────────
    ModelStage:
      type: string
      enum: [None, Staging, Production, Archived]

    ModelVersion:
      type: object
      properties:
        version:
          type: string
          example: "3"
        stage:
          $ref: '#/components/schemas/ModelStage'
        run_id:
          type: string
          example: "abc123def456"
        accuracy:
          type: number
          format: float
          example: 0.921
        f1_score:
          type: number
          format: float
          example: 0.908
        precision:
          type: number
          format: float
          example: 0.915
        recall:
          type: number
          format: float
          example: 0.901
        dataset_version:
          type: string
          example: "plantvillage_v2"
        created_at:
          $ref: '#/components/schemas/Timestamp'

    # ── Retraining Job ──────────────────────
    RetrainingStatus:
      type: string
      enum: [pending, running, success, failed]

    RetrainingJob:
      type: object
      properties:
        id:
          $ref: '#/components/schemas/UUID'
        triggered_by:
          $ref: '#/components/schemas/UUID'
        triggered_by_name:
          type: string
          example: "Luis Roberto Navarro"
        status:
          $ref: '#/components/schemas/RetrainingStatus'
        notes:
          type: string
          nullable: true
          example: "Incluye feedback de abril 2026"
        github_run_id:
          type: string
          nullable: true
          example: "12345678"
        started_at:
          $ref: '#/components/schemas/Timestamp'
          nullable: true
        finished_at:
          $ref: '#/components/schemas/Timestamp'
          nullable: true

# ─────────────────────────────────────────────
# SEGURIDAD GLOBAL
# ─────────────────────────────────────────────
security:
  - BearerAuth: []

# ─────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────
paths:

  # ════════════════════════════════════════════
  # AUTH
  # ════════════════════════════════════════════

  /auth/register:
    post:
      tags: [Auth]
      summary: Registro de nuevo usuario
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [name, email, password]
              properties:
                name:
                  type: string
                  example: "Ana García"
                email:
                  type: string
                  format: email
                  example: "ana@empresa.com"
                password:
                  type: string
                  minLength: 8
                  example: "SecurePass123!"
      responses:
        '201':
          description: Usuario creado exitosamente
          content:
            application/json:
              schema:
                type: object
                properties:
                  access_token:
                    type: string
                  refresh_token:
                    type: string
                  user:
                    $ref: '#/components/schemas/UserBase'
        '409':
          description: Email ya registrado
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /auth/login:
    post:
      tags: [Auth]
      summary: Inicio de sesión
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
      responses:
        '200':
          description: Login exitoso
          content:
            application/json:
              schema:
                type: object
                properties:
                  access_token:
                    type: string
                    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  refresh_token:
                    type: string
                    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  user:
                    $ref: '#/components/schemas/UserBase'
        '401':
          description: Credenciales inválidas
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /auth/refresh:
    post:
      tags: [Auth]
      summary: Renovar access token
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [refresh_token]
              properties:
                refresh_token:
                  type: string
      responses:
        '200':
          description: Token renovado
          content:
            application/json:
              schema:
                type: object
                properties:
                  access_token:
                    type: string
        '401':
          description: Refresh token inválido o expirado
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /auth/logout:
    post:
      tags: [Auth]
      summary: Cerrar sesión
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [refresh_token]
              properties:
                refresh_token:
                  type: string
      responses:
        '204':
          description: Sesión cerrada

  /auth/forgot-password:
    post:
      tags: [Auth]
      summary: Solicitar reset de password
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email]
              properties:
                email:
                  type: string
                  format: email
      responses:
        '204':
          description: Email de recuperación enviado (siempre 204 aunque el email no exista)

  /auth/reset-password:
    post:
      tags: [Auth]
      summary: Aplicar nuevo password
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [token, new_password]
              properties:
                token:
                  type: string
                new_password:
                  type: string
                  minLength: 8
      responses:
        '204':
          description: Password actualizado
        '400':
          description: Token inválido o expirado
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /auth/me:
    get:
      tags: [Auth]
      summary: Datos del usuario autenticado
      responses:
        '200':
          description: Perfil del usuario
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserBase'

  # ════════════════════════════════════════════
  # USUARIOS
  # ════════════════════════════════════════════

  /users/me:
    put:
      tags: [Users]
      summary: Actualizar perfil propio
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                current_password:
                  type: string
                new_password:
                  type: string
                  minLength: 8
      responses:
        '200':
          description: Perfil actualizado
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserBase'

  /users:
    get:
      tags: [Users]
      summary: Listar todos los usuarios (super_admin)
      parameters:
        - in: query
          name: page
          schema:
            type: integer
            default: 1
        - in: query
          name: limit
          schema:
            type: integer
            default: 20
        - in: query
          name: search
          schema:
            type: string
        - in: query
          name: role
          schema:
            $ref: '#/components/schemas/UserRole'
        - in: query
          name: company_id
          schema:
            $ref: '#/components/schemas/UUID'
      responses:
        '200':
          description: Lista paginada de usuarios
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/UserBase'
                  meta:
                    $ref: '#/components/schemas/PaginationMeta'

  /users/{id}/status:
    put:
      tags: [Users]
      summary: Activar o desactivar usuario (super_admin)
      parameters:
        - in: path
          name: id
          required: true
          schema:
            $ref: '#/components/schemas/UUID'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [is_active]
              properties:
                is_active:
                  type: boolean
      responses:
        '200':
          description: Estado actualizado
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserBase'

  # ════════════════════════════════════════════
  # COMPAÑÍAS
  # ════════════════════════════════════════════

  /companies:
    post:
      tags: [Companies]
      summary: Crear nueva compañía
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [name, sector]
              properties:
                name:
                  type: string
                  example: "AgroMex S.A. de C.V."
                sector:
                  type: string
                  example: "Horticultura"
      responses:
        '201':
          description: Compañía creada, usuario asignado como company_admin
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CompanyBase'
        '409':
          description: Nombre de compañía ya existe
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

    get:
      tags: [Companies]
      summary: Listar todas las compañías (super_admin)
      parameters:
        - in: query
          name: page
          schema:
            type: integer
            default: 1
        - in: query
          name: limit
          schema:
            type: integer
            default: 20
        - in: query
          name: search
          schema:
            type: string
        - in: query
          name: status
          schema:
            $ref: '#/components/schemas/CompanyStatus'
      responses:
        '200':
          description: Lista paginada
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/CompanyBase'
                  meta:
                    $ref: '#/components/schemas/PaginationMeta'

  /companies/search:
    get:
      tags: [Companies]
      summary: Buscar compañía por nombre (para unirse)
      parameters:
        - in: query
          name: name
          required: true
          schema:
            type: string
            example: "AgroMex"
      responses:
        '200':
          description: Resultados de búsqueda
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    id:
                      $ref: '#/components/schemas/UUID'
                    name:
                      type: string
                    sector:
                      type: string

  /companies/{id}:
    get:
      tags: [Companies]
      summary: Detalle de compañía (company_admin)
      parameters:
        - in: path
          name: id
          required: true
          schema:
            $ref: '#/components/schemas/UUID'
      responses:
        '200':
          description: Detalle de compañía
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CompanyBase'

    put:
      tags: [Companies]
      summary: Editar compañía (company_admin)
      parameters:
        - in: path
          name: id
          required: true
          schema:
            $ref: '#/components/schemas/UUID'
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                logo_url:
                  type: string
                  format: uri
      responses:
        '200':
          description: Compañía actualizada
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CompanyBase'

  /companies/{id}/status:
    put:
      tags: [Companies]
      summary: Activar o suspender compañía (super_admin)
      parameters:
        - in: path
          name: id
          required: true
          schema:
            $ref: '#/components/schemas/UUID'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [status]
              properties:
                status:
                  $ref: '#/components/schemas/CompanyStatus'
      responses:
        '200':
          description: Estado actualizado
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CompanyBase'

  /companies/{id}/users:
    get:
      tags: [Companies]
      summary: Usuarios de una compañía (company_admin)
      parameters:
        - in: path
          name: id
          required: true
          schema:
            $ref: '#/components/schemas/UUID'
      responses:
        '200':
          description: Lista de usuarios
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/UserBase'

  /companies/{id}/users/{user_id}:
    delete:
      tags: [Companies]
      summary: Remover usuario de compañía (company_admin)
      parameters:
        - in: path
          name: id
          required: true
          schema:
            $ref: '#/components/schemas/UUID'
        - in: path
          name: user_id
          required: true
          schema:
            $ref: '#/components/schemas/UUID'
      responses:
        '204':
          description: Usuario removido

  /companies/{id}/metrics:
    get:
      tags: [Companies]
      summary: Métricas de uso de la compañía (company_admin)
      parameters:
        - in: path
          name: id
          required: true
          schema:
            $ref: '#/components/schemas/UUID'
        - in: query
          name: from
          schema:
            type: string
            format: date
            example: "2026-04-01"
        - in: query
          name: to
          schema:
            type: string
            format: date
            example: "2026-04-28"
      responses:
        '200':
          description: Métricas de la compañía
          content:
            application/json:
              schema:
                type: object
                properties:
                  total_predictions:
                    type: integer
                    example: 342
                  predictions_by_day:
                    type: array
                    items:
                      type: object
                      properties:
                        date:
                          type: string
                          format: date
                        count:
                          type: integer
                  feedback_rate:
                    type: number
                    format: float
                    example: 0.67
                  top_labels:
                    type: array
                    items:
                      type: object
                      properties:
                        label:
                          type: string
                        count:
                          type: integer

  # ════════════════════════════════════════════
  # JOIN REQUESTS
  # ════════════════════════════════════════════

  /companies/join:
    post:
      tags: [JoinRequests]
      summary: Solicitar unirse a una compañía
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [company_id]
              properties:
                company_id:
                  $ref: '#/components/schemas/UUID'
      responses:
        '201':
          description: Solicitud enviada
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/JoinRequestBase'
        '409':
          description: Solicitud ya existe o usuario ya pertenece a la compañía
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /companies/{id}/requests:
    get:
      tags: [JoinRequests]
      summary: Listar solicitudes de una compañía (company_admin)
      parameters:
        - in: path
          name: id
          required: true
          schema:
            $ref: '#/components/schemas/UUID'
        - in: query
          name: status
          schema:
            $ref: '#/components/schemas/JoinRequestStatus'
      responses:
        '200':
          description: Lista de solicitudes
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/JoinRequestBase'

  /companies/{id}/requests/{req_id}:
    put:
      tags: [JoinRequests]
      summary: Aprobar o rechazar solicitud (company_admin)
      parameters:
        - in: path
          name: id
          required: true
          schema:
            $ref: '#/components/schemas/UUID'
        - in: path
          name: req_id
          required: true
          schema:
            $ref: '#/components/schemas/UUID'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [action]
              properties:
                action:
                  type: string
                  enum: [approve, reject]
      responses:
        '200':
          description: Solicitud procesada
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/JoinRequestBase'

  # ════════════════════════════════════════════
  # PREDICCIONES
  # ════════════════════════════════════════════

  /predictions:
    post:
      tags: [Predictions]
      summary: Subir imagen y obtener diagnóstico
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required: [image]
              properties:
                image:
                  type: string
                  format: binary
                  description: "Imagen JPG o PNG, máximo 5MB"
      responses:
        '201':
          description: Diagnóstico generado
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PredictionBase'
        '413':
          description: Imagen demasiado grande
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '415':
          description: Formato no soportado
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

    get:
      tags: [Predictions]
      summary: Historial de predicciones del usuario autenticado
      parameters:
        - in: query
          name: page
          schema:
            type: integer
            default: 1
        - in: query
          name: limit
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: Lista paginada de predicciones
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/PredictionBase'
                  meta:
                    $ref: '#/components/schemas/PaginationMeta'

  /predictions/{id}:
    get:
      tags: [Predictions]
      summary: Detalle de una predicción
      parameters:
        - in: path
          name: id
          required: true
          schema:
            $ref: '#/components/schemas/UUID'
      responses:
        '200':
          description: Detalle de predicción con feedback si existe
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PredictionBase'
        '404':
          description: Predicción no encontrada
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /predictions/{id}/feedback:
    post:
      tags: [Predictions]
      summary: Enviar feedback sobre una predicción
      parameters:
        - in: path
          name: id
          required: true
          schema:
            $ref: '#/components/schemas/UUID'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [is_correct]
              properties:
                is_correct:
                  type: boolean
                  example: false
                correct_label:
                  type: string
                  nullable: true
                  example: "Tomato_Late_Blight"
                  description: "Requerido si is_correct es false"
      responses:
        '201':
          description: Feedback guardado
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/FeedbackBase'
        '409':
          description: Ya existe feedback para esta predicción
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  # ════════════════════════════════════════════
  # ADMIN — MODELOS MLFLOW
  # ════════════════════════════════════════════

  /admin/models:
    get:
      tags: [Admin - Models]
      summary: Listar versiones del Model Registry (super_admin)
      responses:
        '200':
          description: Lista de versiones de modelos
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/ModelVersion'

  /admin/models/{version}:
    get:
      tags: [Admin - Models]
      summary: Detalle de una versión de modelo (super_admin)
      parameters:
        - in: path
          name: version
          required: true
          schema:
            type: string
            example: "3"
      responses:
        '200':
          description: Detalle del modelo con métricas completas
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ModelVersion'

  /admin/models/{version}/promote:
    post:
      tags: [Admin - Models]
      summary: Promover versión a Production (super_admin)
      parameters:
        - in: path
          name: version
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Modelo promovido a Production
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ModelVersion'

  /admin/models/{version}/rollback:
    post:
      tags: [Admin - Models]
      summary: Rollback a versión anterior (super_admin)
      parameters:
        - in: path
          name: version
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Rollback ejecutado
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ModelVersion'

  # ════════════════════════════════════════════
  # ADMIN — RETRAINING
  # ════════════════════════════════════════════

  /admin/retraining/trigger:
    post:
      tags: [Admin - Retraining]
      summary: Disparar pipeline de retraining (super_admin)
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                notes:
                  type: string
                  nullable: true
                  example: "Incluye feedback del mes de abril 2026"
      responses:
        '202':
          description: Job de retraining iniciado
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RetrainingJob'

  /admin/retraining/jobs:
    get:
      tags: [Admin - Retraining]
      summary: Historial de jobs de retraining (super_admin)
      responses:
        '200':
          description: Lista de jobs
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/RetrainingJob'

  /admin/retraining/jobs/{id}:
    get:
      tags: [Admin - Retraining]
      summary: Estado y detalle de un job (super_admin)
      parameters:
        - in: path
          name: id
          required: true
          schema:
            $ref: '#/components/schemas/UUID'
      responses:
        '200':
          description: Detalle del job
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RetrainingJob'

  # ════════════════════════════════════════════
  # ADMIN — MÉTRICAS GLOBALES
  # ════════════════════════════════════════════

  /admin/metrics/model:
    get:
      tags: [Admin - Metrics]
      summary: Métricas del modelo en producción (super_admin)
      parameters:
        - in: query
          name: model_version
          schema:
            type: string
            example: "3"
      responses:
        '200':
          description: Métricas del modelo
          content:
            application/json:
              schema:
                type: object
                properties:
                  model_version:
                    type: string
                  accuracy:
                    type: number
                    format: float
                  precision:
                    type: number
                    format: float
                  recall:
                    type: number
                    format: float
                  f1_score:
                    type: number
                    format: float
                  per_class_metrics:
                    type: array
                    items:
                      type: object
                      properties:
                        label:
                          type: string
                        precision:
                          type: number
                        recall:
                          type: number
                        f1:
                          type: number
                        support:
                          type: integer

  /admin/metrics/usage:
    get:
      tags: [Admin - Metrics]
      summary: Métricas globales de uso (super_admin)
      parameters:
        - in: query
          name: from
          schema:
            type: string
            format: date
        - in: query
          name: to
          schema:
            type: string
            format: date
      responses:
        '200':
          description: Métricas de uso de la plataforma
          content:
            application/json:
              schema:
                type: object
                properties:
                  total_predictions:
                    type: integer
                  active_users:
                    type: integer
                  active_companies:
                    type: integer
                  feedback_rate:
                    type: number
                    format: float
                  predictions_by_day:
                    type: array
                    items:
                      type: object
                      properties:
                        date:
                          type: string
                          format: date
                        count:
                          type: integer

  /admin/metrics/drift:
    get:
      tags: [Admin - Metrics]
      summary: Comparación de distribución de clases vs training (super_admin)
      responses:
        '200':
          description: Datos de data drift
          content:
            application/json:
              schema:
                type: object
                properties:
                  reference_distribution:
                    type: array
                    items:
                      type: object
                      properties:
                        label:
                          type: string
                        proportion:
                          type: number
                  current_distribution:
                    type: array
                    items:
                      type: object
                      properties:
                        label:
                          type: string
                        proportion:
                          type: number
                  drift_score:
                    type: number
                    format: float
                    description: "Score PSI o KL divergence. > 0.2 indica drift significativo."
                    example: 0.08

  # ════════════════════════════════════════════
  # ADMIN — PREDICCIONES GLOBALES
  # ════════════════════════════════════════════

  /admin/predictions:
    get:
      tags: [Admin - Predictions]
      summary: Todas las predicciones de la plataforma (super_admin)
      parameters:
        - in: query
          name: from
          schema:
            type: string
            format: date
        - in: query
          name: to
          schema:
            type: string
            format: date
        - in: query
          name: company_id
          schema:
            $ref: '#/components/schemas/UUID'
        - in: query
          name: page
          schema:
            type: integer
            default: 1
        - in: query
          name: limit
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: Lista paginada de predicciones globales
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/PredictionBase'
                  meta:
                    $ref: '#/components/schemas/PaginationMeta'

  # ════════════════════════════════════════════
  # HEALTH CHECK
  # ════════════════════════════════════════════

  /health:
    get:
      tags: [System]
      summary: Health check del servidor
      security: []
      responses:
        '200':
          description: Servidor operativo
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    example: "ok"
                  version:
                    type: string
                    example: "1.0.0"
                  timestamp:
                    $ref: '#/components/schemas/Timestamp'
```

---

## 8. Changelog

| Versión | Fecha | Cambio | Autor |
|---|---|---|---|
| 1.0 | Abril 2026 | Versión inicial del contrato | RAZO MAGALLANES, SAUL |

---

> **Proceso de cambios:** Cualquier modificación a este contrato requiere un PR en el repositorio con la etiqueta `api-contract`, aprobación del Backend PM y del Frontend PM, y actualización de la versión en este changelog antes de hacer merge.

# CropSight — Backend

API REST construida con **FastAPI** + **PostgreSQL** (RDS) + **SQLAlchemy async**.

## Requisitos

- Python 3.11+
- Acceso a la instancia RDS `cropsight-dev` en AWS (us-east-2)
- Credenciales de la base de datos (solicitar al PM)

## Setup local

```bash
# 1. Entrar al directorio
cd backend

# 2. Crear entorno virtual
python -m venv .venv
source .venv/bin/activate  # macOS/Linux
.venv\Scripts\activate     # Windows

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Descargar certificado SSL de RDS
curl -O https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

# 5. Configurar variables de entorno
cp .env.example .env
```

Editar `.env` con los datos de conexión a RDS:

```env
DATABASE_URL=postgresql+asyncpg://cropsight:<PASSWORD>@cropsight-dev.chumg2aaac61.us-east-2.rds.amazonaws.com:5432/cropsight
```

```bash
# 6. Aplicar migraciones
alembic upgrade head

# 7. Iniciar servidor
python -m uvicorn app.main:app --reload
```

## Verificar que funciona

```bash
# Health check
curl http://localhost:8000/api/v1/health
# → {"status": "ok", "version": "1.0.0"}

# Registro de usuario
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Tu Nombre","email":"tu@email.com","password":"SecurePass123!"}'
# → 201 con access_token, refresh_token y datos del usuario
```

## Verificar tablas en RDS

```bash
PGPASSWORD=<PASSWORD> psql "host=cropsight-dev.chumg2aaac61.us-east-2.rds.amazonaws.com \
  port=5432 dbname=cropsight user=cropsight \
  sslmode=verify-full sslrootcert=./global-bundle.pem" -c "\dt"
```

## Documentación de API

- Swagger UI: http://localhost:8000/docs
- ReDoc:       http://localhost:8000/redoc
- OpenAPI YAML: docs/openapi.yaml

## Correr tests

```bash
pytest tests/ -v
```

## Estructura

```
app/
├── main.py          # Entrypoint
├── config.py        # Variables de entorno
├── database.py      # Engine SQLAlchemy con SSL para RDS
├── dependencies.py  # Guards de auth y rol
├── core/            # Security, exceptions
├── models/          # Tablas SQLAlchemy
├── schemas/         # Pydantic schemas
├── routers/         # Endpoints
├── services/        # Lógica de negocio
└── utils/           # Paginación, helpers
```

## Equipo

| Área | Responsable |
|---|---|
| PM | RAZO MAGALLANES, SAUL |
| Auth + Feedback | LEON PEREZ, JOSE ANGEL |
| Predicciones + MLflow | GALINDO VILLEGAS, JAIME ENRIQUE |
| Compañías + Join Requests | DIAZ CAMPOS, JOSE JUAN |
| Usuarios + Schemas | ESTRELLA LOPEZ, JUAN LUIS IVAN |
| Admin Métricas + Retraining | ALONSO GONZALEZ, JUAN CARLOS |

# CropSight — Backend

API REST construida con **FastAPI** + **PostgreSQL** + **SQLAlchemy async**.

## Requisitos

- Python 3.11+
- PostgreSQL 15+
- AWS CLI configurado (para S3)

## Setup local

```bash
# 1. Clonar y entrar al directorio
cd backend

# 2. Crear entorno virtual
python -m venv .venv
source .venv/bin/activate  # macOS/Linux

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 5. Crear base de datos PostgreSQL
createdb cropsight

# 6. Correr migraciones
alembic upgrade head

# 7. Iniciar servidor
uvicorn app.main:app --reload
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
├── database.py      # Engine SQLAlchemy
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

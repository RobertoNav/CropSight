# CropSight — ML / MLOps

Módulo de Machine Learning para CropSight. Contiene el entrenamiento de los 4 modelos de diagnóstico de enfermedades por cultivo, el endpoint de inferencia y el pipeline de retraining.

---

## Equipo

| Nombre | Rol |
|---|---|
| Martin del Campo Arroyo, Rodrigo | PM / Arquitectura ML |
| Garcia Lopez, Mateo | ML Engineer |
| Calzada Diaz, Carlos | ML Engineer |
| Pelayo Sierra, Luis Antonio | MLOps / Inference |

---

## Estructura del repositorio

```
cropsight-ml/
├── src/
│   ├── preprocessing/
│   │   ├── transforms.py      # Transformaciones reutilizables (train / val / inference)
│   │   └── dataset.py         # DataLoader builder con split train/val/test
│   ├── training/
│   │   ├── model.py            # EfficientNet-B0 con cabeza custom
│   │   └── train.py            # Script de entrenamiento con MLflow logging
│   ├── inference/
│   │   └── main.py             # FastAPI — POST /predict  GET /health
│   └── monitoring/             # (pendiente) drift detection y métricas en producción
├── notebooks/                  # EDA por cultivo (4 notebooks)
├── data/
│   ├── raw/                    # Dataset original de Kaggle — NO se commitea
│   └── processed/              # Dataset filtrado y organizado por cultivo
├── models/                     # Modelos locales temporales — NO se commitean
├── pipelines/                  # Scripts auxiliares de pipeline
├── terraform/
│   ├── main.tf                 # S3 + EC2 MLflow + EC2 Inference
│   └── variables.tf
├── tests/
│   └── test_model.py
├── mlflow/                     # Configuración del tracking server
├── .github/
│   └── workflows/
│       ├── ci.yml              # Lint + tests en cada PR
│       └── retrain.yml         # Retraining manual por cultivo (workflow_dispatch)
├── Dockerfile                  # Imagen del endpoint de inferencia
├── requirements.txt
├── .env.example
└── .gitignore
```

---

## Cultivos soportados

| Cultivo | Experiment MLflow | Modelo en Registry |
|---|---|---|
| Tomate | `cropsight-tomato` | `cropsight-tomato` |
| Papa | `cropsight-potato` | `cropsight-potato` |
| Maíz | `cropsight-corn` | `cropsight-corn` |
| Vid | `cropsight-grape` | `cropsight-grape` |

---

## Setup inicial

### 1. Clonar e instalar dependencias

```bash
git clone <repo-url>
cd cropsight-ml
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus credenciales de AWS, MLflow y Kaggle
```

### 3. Descargar dataset

```bash
kaggle datasets download -d emmarex/plantdisease -p data/raw/
```

Organizar los 4 cultivos en `data/processed/` con estructura `ImageFolder`:
```
data/processed/
    tomato/
        Tomato_Early_Blight/
        Tomato_Late_Blight/
        Tomato_healthy/
        ...
    potato/
        ...
```

---

## Entrenamiento

Cada cultivo tiene su propio experiment en MLflow. Usar el mismo script parametrizado:

```bash
# Cultivo 1
python -m src.training.train --crop tomato --data_dir data/processed/tomato --epochs 15 --lr 1e-4

# Cultivo 2
python -m src.training.train --crop potato --data_dir data/processed/potato --epochs 15 --lr 1e-4

# Cultivo 3
python -m src.training.train --crop corn   --data_dir data/processed/corn   --epochs 15 --lr 1e-4

# Cultivo 4
python -m src.training.train --crop grape  --data_dir data/processed/grape  --epochs 15 --lr 1e-4
```

Para el comparison view de MLflow correr al menos 3 runs por cultivo variando `--lr` y `--epochs`.

---

## Registrar modelo en MLflow Model Registry

Una vez identificado el mejor run por cultivo, registrarlo desde la UI de MLflow o con:

```python
import mlflow

mlflow.register_model(
    model_uri="runs:/<run_id>/model",
    name="cropsight-tomato"   # cambiar por el cultivo correspondiente
)
```

Luego moverlo a **Staging** para validación y a **Production** desde el admin dashboard.

---

## Endpoint de inferencia

### Levantar localmente

```bash
uvicorn src.inference.main:app --reload --port 8000
```

### Con Docker

```bash
docker build -t cropsight-inference .
docker run -p 8000:8000 --env-file .env cropsight-inference
```

### Ejemplo de llamada

```bash
curl -X POST "http://localhost:8000/predict?crop=tomato" \
     -F "file=@mi_foto.jpg"
```

Respuesta:
```json
{
  "crop": "tomato",
  "predicted_class": "Tomato_Early_Blight",
  "confidence": 0.9231,
  "model_version": "Production"
}
```

---

## Retraining manual

Desde GitHub Actions > **Retrain Model** > Run workflow. Seleccionar el cultivo y los hiperparámetros opcionales.

El workflow descarga los datos actualizados de S3, re-entrena el modelo y registra el nuevo run en MLflow como **Staging**.

---

## Tests

```bash
pytest tests/ -v
```

---

## Infraestructura (Terraform)

```bash
cd terraform
terraform init
terraform plan -var="s3_bucket_name=cropsight-bucket" -var="ec2_ami=ami-xxxxx" -var="key_pair_name=mi-key"
terraform apply -auto-approve
```

---

## Métricas mínimas para promover a Production

| Métrica | Umbral mínimo |
|---|---|
| Accuracy (test) | ≥ 90% |
| F1 macro (test) | ≥ 88% |
| Recall por clase | ≥ 75% en todas las clases |


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

## Estructura

```
ml/
├── src/
│   ├── preprocessing/        # transforms reutilizables + dataloader builder
│   │   ├── dataset.py        # ImageFolder con split 70/15/15
│   │   ├── transforms.py     # train / val / inference transforms
│   │   ├── eda.py            # análisis exploratorio por cultivo
│   │   └── prepare_dataset.py
│   ├── training/
│   │   ├── model.py          # EfficientNet-B0 (timm) con cabeza custom
│   │   ├── train.py          # Entrenamiento parametrizado + MLflow logging
│   │   └── sweep.py          # Sweep de >=3 configuraciones por cultivo
│   ├── registry/
│   │   └── register.py       # Selecciona mejor run y promueve a Staging
│   └── inference/
│       └── main.py           # FastAPI POST /predict | GET /health
├── tools/
│   └── prepare_local_data.py # Adapta archive/PlantVillage al layout esperado
├── tests/
│   ├── test_model.py
│   └── test_registry.py
├── terraform/
├── .github/workflows/        # ci.yml + retrain.yml
├── Dockerfile
├── requirements.txt
└── .env.example
```

---

## Cultivos soportados

| Cultivo | Experimento MLflow | Modelo en Registry | Clases |
|---|---|---|---|
| Tomate | `cropsight-tomato` | `cropsight-tomato` | 10 |
| Papa   | `cropsight-potato` | `cropsight-potato` | 3  |
| Maíz   | `cropsight-corn`   | `cropsight-corn`   | 4  |
| Vid    | `cropsight-grape`  | `cropsight-grape`  | 4  |

---

## Setup

```sh
# Crear venv aislado e instalar dependencias (CUDA 12.1 wheels)
uv venv .venv --python 3.12
source .venv/bin/activate
UV_LINK_MODE=copy uv pip install -r requirements.txt \
    --index-strategy unsafe-best-match \
    --extra-index-url https://download.pytorch.org/whl/cu121

cp .env.example .env   # editar MLFLOW_TRACKING_URI si es necesario
```

### Dataset

Dataset: PlantVillage (`mohitsingh1804/plantvillage` en Kaggle). El archivo
descargado tiene la estructura:

```
archive/PlantVillage/
├── train/<Crop>___<Disease>/*.jpg
└── val/<Crop>___<Disease>/*.jpg
```

El contrato de `src/preprocessing/dataset.py` espera `data/processed/<crop>/<class>/`.
PlantVillage captura múltiples shots del mismo leaf con segundos de
diferencia: mezclar `train/` y `val/` y re-splitear aleatoriamente filtra
near-duplicates entre splits e infla las métricas. Para evitarlo separamos
en dos pools mutuamente exclusivos:

- **Training pool** (`data/processed/<crop>/`)  ← solo `archive/.../train/`
- **Held-out pool** (`data/heldout/<crop>/`)    ← solo `archive/.../val/`

`build_dataloaders` re-splitea el training pool en train+val para early
stopping. Las métricas `test_*` que se reportan en MLflow vienen del
held-out pool — el modelo nunca lo ve durante entrenamiento.

```sh
# training pool
python tools/prepare_local_data.py \
    --archive ../archive/PlantVillage \
    --out data/processed --source-split train \
    --crops tomato,potato

# held-out test pool
python tools/prepare_local_data.py \
    --archive ../archive/PlantVillage \
    --out data/heldout --source-split val \
    --crops tomato,potato
```

El script crea symlinks (sin duplicar imágenes en disco).

> Las imágenes y carpetas locales nunca se commitean (ver `.gitignore`).

---

## MLflow tracking server (local, dev)

```sh
mkdir -p mlflow_artifacts
mlflow server \
    --host 127.0.0.1 --port 5000 \
    --backend-store-uri sqlite:///mlflow.db \
    --default-artifact-root "file://$(pwd)/mlflow_artifacts"
```

UI: http://127.0.0.1:5000

En producción el servidor corre en EC2 con backend en RDS y artifact store en
S3 (responsabilidad del equipo Infra; ver `terraform/`).

### Datasets en S3

Los crops procesados ya están disponibles en el bucket:

```
s3://cropsight-dataset-ml/processed/
    corn/
    pepper/
    potato/
    tomato/
```

Para descargar localmente antes de entrenar:

```sh
aws s3 sync s3://cropsight-dataset-ml/processed/ data/processed/
```

---

## Entrenamiento

Cada cultivo se entrena con el mismo script parametrizado:

```sh
export PYTHONPATH=.
export MLFLOW_TRACKING_URI=http://127.0.0.1:5000

python -m src.training.train \
    --crop tomato \
    --data_dir   data/processed/tomato \
    --heldout_dir data/heldout/tomato \
    --epochs 8 \
    --lr 1e-4 \
    --batch_size 64
```

### Qué se loguea en cada run

| Categoría | Contenido |
|---|---|
| **Tags** | `crop`, `architecture`, `framework`, `device` |
| **Params** | crop, architecture, epochs, lr, weight_decay, batch_size, num_classes, optimizer, random_seed, train_size, val_size, heldout_size, val_split, image_size, data_dir, heldout_dir |
| **Métricas por época** | `train_loss`, `train_acc`, `val_loss`, `val_acc`, `val_f1` |
| **Métricas finales (held-out test)** | `test_loss`, `test_acc`, `test_f1`, `test_precision`, `test_recall`, `best_val_f1`, `best_val_epoch` |
| **Métricas por clase** | `test_f1_<class>`, `test_precision_<class>`, `test_recall_<class>`, `train_count_<class>` |
| **Artefactos** | `confusion_matrix.png`, `classification_report.json`, `class_names.json`, `data_distribution.png`, `model/` (PyTorch flavor con signature + input_example) |

---

## Sweep (≥3 runs por cultivo)

```sh
# Un cultivo
python -m src.training.sweep \
    --crop tomato \
    --data_dir   data/processed/tomato \
    --heldout_dir data/heldout/tomato

# Los 4 cultivos en serie (data_dir y heldout_dir son carpetas padre)
python -m src.training.sweep \
    --crop all \
    --data_dir   data/processed \
    --heldout_dir data/heldout
```

> Para `--crop all`, `--data_dir` y `--heldout_dir` deben ser carpetas padre
> con subdirectorios por cultivo. Ver `DEFAULT_SWEEP` en `sweep.py` para los
> hiperparámetros.

El sweep ejecuta 3 configuraciones por cultivo (lr ∈ {1e-3, 1e-4, 5e-5}) en
subprocesos independientes para evitar leak de estado de PyTorch / CUDA entre
runs. Esto produce el comparison view de MLflow con runs comparables.

---

## Model Registry

```sh
# Registrar el mejor run de un cultivo (por test_f1) y moverlo a Staging
python -m src.registry.register --crop tomato --stage Staging

# Registrar los 4 cultivos
python -m src.registry.register --crop all --stage Staging
```

El script:
1. Busca el experimento `cropsight-<crop>` y selecciona la mejor run finalizada
   ordenando por `test_f1` (desempate `test_acc`).
2. Crea (o reutiliza) el modelo registrado `cropsight-<crop>`.
3. Crea una nueva versión con descripción y tags (run_id, métricas, hiperparámetros).
4. Archiva la versión previa en el stage destino y transiciona la nueva versión.

### Promoción y rollback (admin dashboard)

El backend invoca el mismo CLI:

```sh
# Promover a Production (POST /admin/models/:version/promote)
python -m src.registry.register --promote --crop tomato --version 3 --stage Production

# Rollback (POST /admin/models/:version/rollback) — promover versión anterior
python -m src.registry.register --promote --crop tomato --version 2 --stage Production
```

> Nota: MLflow 2.9+ deprecó los stages en favor de aliases. Conservamos stages
> para alinear con los endpoints `POST /admin/models/:version/promote` y
> `/rollback` definidos en el plan (sección 6.4). Migrar a aliases es trabajo
> futuro coordinado con Backend.

---

## Endpoint de inferencia

```sh
uvicorn src.inference.main:app --reload --port 8000

# o con Docker
docker build -t cropsight-inference .
docker run -p 8000:8000 --env-file .env cropsight-inference

# Llamada de ejemplo
curl -X POST "http://localhost:8000/predict?crop=tomato" -F "file=@mi_foto.jpg"
```

El servicio carga modelos desde el Model Registry en `Production` al arranque.
Para entornos de Staging usar `MLFLOW_MODEL_STAGE=Staging`.

---

## Tests

```sh
PYTHONPATH=. pytest tests/ -v
```

---

## Métricas mínimas para promover a Production

| Métrica | Umbral |
|---|---|
| Accuracy (test) | ≥ 90% |
| F1 macro (test) | ≥ 88% |
| Recall por clase | ≥ 75% en todas |
| Tiempo de inferencia (Lambda) | ≤ 500 ms |

QA valida estos umbrales con el checklist de la sección 7.2 del plan antes de
que el super admin promueva una versión a Production.

---

## Retraining manual

GitHub Actions → **Retrain Model** → *Run workflow*. Selecciona cultivo e
hiperparámetros opcionales. El workflow descarga `data/processed/<crop>` de S3,
ejecuta `src.training.train`, y deja el modelo registrado en Staging vía
`src.registry.register`. La promoción a Production se hace manualmente desde
el admin dashboard.


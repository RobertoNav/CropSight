# 🌱 CropSight — Ambiente de Desarrollo (DEV)

> **Para:** Todo el equipo (Backend, ML, Frontend)  
> **El ambiente DEV ya está desplegado en AWS.** No necesitas correr Terraform.

---

## Endpoints del Ambiente DEV

Estos son los recursos que ya están corriendo. Úsalos directamente en tu desarrollo:

| Recurso | URL / Valor |
|---|---|
| **API (FastAPI)** | `http://cropsight-dev-alb-1211280131.us-east-1.elb.amazonaws.com` |
| **Base de datos (PostgreSQL)** | `cropsight-dev-rds.cidooy88q03l.us-east-1.rds.amazonaws.com:5432` |
| **DB Name** | `cropsight` |
| **DB User** | `cropsight_admin` |
| **MLflow Tracking** | `http://ip-10-0-10-150.ec2.internal:5000` *(solo desde la VPC)* |
| **S3 — Imágenes** | `cropsight-dev-imgs` |
| **S3 — MLflow artifacts** | `cropsight-dev-mlflow` |
| **S3 — Backups** | `cropsight-dev-bkp` |

> ⚠️ **El password de la DB** te lo comparte el responsable de infra por canal seguro (no va en el código ni en el chat).

---

## Para el equipo de Backend (FastAPI)

### Conectarte a la DB desde tu código local

Usa estas variables de entorno en tu `.env` local:

```env
DATABASE_URL=postgresql://cropsight_admin:TU_PASSWORD@cropsight-dev-rds.cidooy88q03l.us-east-1.rds.amazonaws.com:5432/cropsight
AWS_DEFAULT_REGION=us-east-1
S3_IMGS_BUCKET=cropsight-dev-imgs
S3_MLFLOW_BUCKET=cropsight-dev-mlflow
```

> ⚠️ La DB está en una **subred privada** de AWS. Para conectarte desde tu Computadora necesitas una de estas opciones:
> - Correr la app dentro de la VPC (en la EC2)
> - Para desarrollo local puro, levanta una DB local con Docker:
> ```bash
> docker run -d \
>   --name cropsight-db \
>   -e POSTGRES_DB=cropsight \
>   -e POSTGRES_USER=cropsight_admin \
>   -e POSTGRES_PASSWORD=local_password \
>   -p 5432:5432 \
>   postgres:15
> ```

### Probar que el ALB (API) responde

```bash
curl http://cropsight-dev-alb-1211280131.us-east-1.elb.amazonaws.com/health
```

### Subir imágenes a S3 desde Python

```python
import boto3

s3 = boto3.client('s3', region_name='us-east-1')

# Subir una imagen
s3.upload_file(
    'mi_imagen.jpg',
    'cropsight-dev-imgs',
    'uploads/mi_imagen.jpg'
)

# Descargar una imagen
s3.download_file(
    'cropsight-dev-imgs',
    'uploads/mi_imagen.jpg',
    'descargada.jpg'
)
```

> Para que boto3 funcione desde tu Mac necesitas tener configurado `aws configure` con credenciales que tengan acceso al bucket.

---

## Para el equipo de ML (MLflow)

### ¿Dónde está MLflow?

MLflow corre en una EC2 privada dentro de la VPC. **No es accesible directamente desde internet.**

Para acceder desde tu computadora, usa SSM port forwarding:

```bash
# 1. Obtén el Instance ID de la EC2 de MLflow
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=cropsight-dev-mlflow" \
  --query "Reservations[0].Instances[0].InstanceId" \
  --output text

# 2. Abre un túnel local al puerto 5000
aws ssm start-session \
  --target INSTANCE_ID_AQUI \
  --document-name AWS-StartPortForwardingSession \
  --parameters '{"portNumber":["5000"],"localPortNumber":["5000"]}'

# 3. Ahora MLflow está disponible en tu Mac en:
# http://localhost:5000
```

### Configurar MLflow en tu código Python

```python
import mlflow

# Apunta al servidor de MLflow (una vez tengas el túnel abierto)
mlflow.set_tracking_uri("http://localhost:5000")

# O si estás corriendo desde dentro de la VPC (en la EC2):
mlflow.set_tracking_uri("http://ip-10-0-10-150.ec2.internal:5000")

# El artifact store apunta automáticamente a S3
# s3://cropsight-dev-mlflow/artifacts

with mlflow.start_run():
    mlflow.log_param("learning_rate", 0.01)
    mlflow.log_metric("accuracy", 0.95)
    mlflow.sklearn.log_model(model, "model")
```

---

## Para el equipo de Frontend (React)

### URL de la API

Configura la URL base de tu API en el frontend:

```env
# .env.development
REACT_APP_API_URL=http://cropsight-dev-alb-1211280131.us-east-1.elb.amazonaws.com
```

```javascript
// api.js
const API_BASE = process.env.REACT_APP_API_URL;

export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    body: formData
  });
  return response.json();
};
```

---

## Credenciales AWS para desarrollo local

Si necesitas acceder a S3 u otros servicios AWS desde tu computadora:

```bash
aws configure
```

Pide al responsable de infra las credenciales de un **IAM user con permisos de solo lectura** para dev. **Nunca uses las credenciales de la pipeline de CI/CD.**

---

## Cómo destruir el ambiente DEV

> 🔴 **Solo el responsable de infra debe hacer esto.** Destruye TODOS los recursos.

```bash
cd infra

# Asegúrate de tener las credenciales AWS configuradas
export TF_VAR_db_password='[PASSWORD]'

terraform destroy -var-file=environments/dev.tfvars
```

Escribe `yes` cuando pregunte. Tarda ~10 minutos.

**¿Qué se destruye?**
- La EC2 con FastAPI (y el ASG)
- La EC2 con MLflow
- El RDS PostgreSQL (se pierden los datos si no hay backup)
- El ALB
- Los 3 buckets S3 y su contenido (`force_destroy = true`)
- La VPC y toda la red

**¿Qué NO se destruye?**
- El S3 `cropsight-tfstate` (el estado de Terraform)
- La tabla DynamoDB `cropsight-lock`
- El módulo de bootstrap (tiene su propio estado)

### Para volver a levantar DEV después de destruirlo

```bash
cd infra
export TF_VAR_db_password='[PASSWORD]'
terraform apply -var-file=environments/dev.tfvars
```

Los recursos se recrearán con los mismos nombres. Tarda ~15 minutos.

---

## Resumen de la arquitectura DEV

```
Internet
    ↓
ALB (puerto 80) — público
    ↓
EC2 FastAPI (puerto 8000) — subred privada
    ↓                    ↓
RDS PostgreSQL        S3 (imgs, mlflow, bkp)
(subred privada)

EC2 MLflow (puerto 5000) — subred privada
    ↓
S3 cropsight-dev-mlflow (artifact store)
```

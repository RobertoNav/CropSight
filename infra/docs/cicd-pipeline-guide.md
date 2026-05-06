# 🚀 CropSight — CI/CD Pipeline Guide (Infraestructura a Producción)

> **Para:** Equipo de CI/CD  
> **Objetivo:** Configurar GitHub Actions para desplegar infraestructura automáticamente en staging y prod

---

## Lo que ya existe (hecho por Infra)

El ambiente `dev` ya está desplegado manualmente. El backend remoto de Terraform también ya existe:

| Recurso | Valor |
|---|---|
| S3 tfstate bucket | `cropsight-tfstate` |
| DynamoDB lock table | `cropsight-lock` |
| Región | `us-east-1` |

**Tu trabajo:** Automatizar el deploy a `staging` y `prod` vía GitHub Actions.

---

## Paso 1 — Agregar Secrets en GitHub

Ve a: **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**

Agrega estos 3 secrets:

| Nombre del Secret | Valor |
|---|---|
| `AWS_ACCESS_KEY_ID` | Access Key del IAM user de CI/CD |
| `AWS_SECRET_ACCESS_KEY` | Secret Key del IAM user de CI/CD |
| `TF_VAR_DB_PASSWORD` | Password de la base de datos (sin caracteres especiales problemáticos) |

> ⚠️ **El IAM user de CI/CD necesita estos permisos mínimos en AWS:**
> - `AmazonEC2FullAccess`
> - `AmazonRDSFullAccess`
> - `AmazonS3FullAccess`
> - `AmazonDynamoDBFullAccess`
> - `IAMFullAccess`
> - `ElasticLoadBalancingFullAccess`
> - `AutoScalingFullAccess`

---

## Paso 2 — Estructura de la Pipeline

La pipeline tiene **dos flujos**:

```
Push a branch "staging"  →  terraform apply staging
Push a branch "main"     →  terraform apply prod
Pull Request a main      →  solo terraform plan (sin apply)
```

---

## Paso 3 — Crear el archivo de workflow

Crea el archivo `.github/workflows/infra.yml` con este contenido:

```yaml
name: CropSight Infrastructure

on:
  push:
    branches:
      - main       # Despliega a PROD
      - staging    # Despliega a STAGING
    paths:
      - 'infra/**' # Solo cuando cambien archivos de infra
  pull_request:
    branches:
      - main
    paths:
      - 'infra/**'

env:
  TF_VERSION: "1.9.0"
  AWS_REGION: "us-east-1"
  WORKING_DIR: "./infra"

jobs:
  # ── Plan (en PRs — solo previsualiza, no aplica) ──────────────────────────
  terraform-plan:
    name: "Terraform Plan"
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'

    steps:
      - name: Checkout código
        uses: actions/checkout@v4

      - name: Configurar Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TF_VERSION }}

      - name: Configurar credenciales AWS
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Terraform Init
        working-directory: ${{ env.WORKING_DIR }}
        run: terraform init

      - name: Terraform Plan (prod preview)
        working-directory: ${{ env.WORKING_DIR }}
        env:
          TF_VAR_db_password: ${{ secrets.TF_VAR_DB_PASSWORD }}
        run: |
          terraform plan \
            -var-file=environments/prod.tfvars \
            -no-color \
            -out=tfplan
        continue-on-error: true

      - name: Comentar el Plan en el PR
        uses: actions/github-script@v7
        if: always()
        with:
          script: |
            const output = `### Terraform Plan 📋
            \`\`\`
            ${{ steps.plan.outputs.stdout }}
            \`\`\``;
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: output
            });

  # ── Deploy a STAGING (push a branch staging) ──────────────────────────────
  deploy-staging:
    name: "Deploy Staging"
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/staging' && github.event_name == 'push'
    environment: staging   # Requiere aprobación manual en GitHub si lo configuras

    steps:
      - name: Checkout código
        uses: actions/checkout@v4

      - name: Configurar Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TF_VERSION }}

      - name: Configurar credenciales AWS
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Terraform Init
        working-directory: ${{ env.WORKING_DIR }}
        run: terraform init

      - name: Terraform Apply — Staging
        working-directory: ${{ env.WORKING_DIR }}
        env:
          TF_VAR_db_password: ${{ secrets.TF_VAR_DB_PASSWORD }}
        run: |
          terraform apply \
            -var-file=environments/staging.tfvars \
            -auto-approve \
            -no-color

      - name: Mostrar Outputs
        working-directory: ${{ env.WORKING_DIR }}
        run: terraform output

  # ── Deploy a PROD (push a main) ───────────────────────────────────────────
  deploy-prod:
    name: "Deploy Prod"
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment: production  # Requiere aprobación manual — configúralo en GitHub

    steps:
      - name: Checkout código
        uses: actions/checkout@v4

      - name: Configurar Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TF_VERSION }}

      - name: Configurar credenciales AWS
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Terraform Init
        working-directory: ${{ env.WORKING_DIR }}
        run: terraform init

      - name: Terraform Apply — Prod
        working-directory: ${{ env.WORKING_DIR }}
        env:
          TF_VAR_db_password: ${{ secrets.TF_VAR_DB_PASSWORD }}
        run: |
          terraform apply \
            -var-file=environments/prod.tfvars \
            -auto-approve \
            -no-color

      - name: Mostrar Outputs
        working-directory: ${{ env.WORKING_DIR }}
        run: terraform output
```

---

## Paso 4 — Configurar Environments en GitHub (Aprobación Manual)

Para que nadie pueda hacer deploy a prod sin aprobación:

1. Ve a: **GitHub repo → Settings → Environments**
2. Crea un environment llamado **`production`**
3. Activa **"Required reviewers"** y agrega a los responsables del equipo
4. Crea otro environment llamado **`staging`** (sin reviewers obligatorios si quieres)

Así, cuando la pipeline intente hacer deploy a prod, se pausará esperando aprobación.

---

## Flujo completo

```
Dev hace PR a main
       ↓
GitHub Actions corre terraform plan  →  publica el plan como comentario en el PR
       ↓
Equipo revisa el PR + el plan
       ↓
Se aprueba y mergea a main
       ↓
GitHub Actions corre terraform apply (prod)
       ↓
Pide aprobación manual (Environment Protection)
       ↓
Responsable aprueba → infra se despliega en prod
```

---

## ¿Qué hace la pipeline exactamente?

| Trigger | Acción |
|---|---|
| PR a `main` | `terraform plan` → comenta el plan en el PR |
| Push a `staging` | `terraform apply -var-file=staging.tfvars` |
| Push a `main` | `terraform apply -var-file=prod.tfvars` + espera aprobación |
| Cambios fuera de `infra/**` | La pipeline **NO** se activa |

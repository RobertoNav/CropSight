# CropSight Infrastructure Architecture

## IaC Skeleton

The Terraform skeleton lives in `infra/`. The files are intentionally empty for now and only define the professional project structure expected for future infrastructure work:

```text
infra/
├── main.tf
├── variables.tf
├── outputs.tf
└── modules/
    ├── networking/
    ├── storage/
    ├── database/
    ├── compute/
    ├── mlops/
    └── monitoring/
```

The root files are reserved for the future Terraform composition layer:

- `main.tf`: provider configuration and module composition.
- `variables.tf`: shared input variables such as environment, region, and naming.
- `outputs.tf`: shared infrastructure outputs.

## Module Responsibilities

`networking/` is reserved for the VPC, public and private subnets, routing, NAT gateways, internet gateway, VPC endpoints, and baseline security groups.

`storage/` is reserved for S3 buckets related to uploaded crop images, prediction evidence, feedback artifacts, training datasets, and MLflow model artifacts.

`database/` is reserved for structured data such as users, companies, roles, join requests, predictions, feedback, audit records, and possibly the MLflow tracking backend.

`compute/` is reserved for the frontend runtime, backend API, inference service, load balancer, container registry, IAM roles, and operational actions such as model promotion or rollback.

`mlops/` is reserved for MLflow tracking, model registry integration, retraining orchestration, scheduled or manual retraining triggers, model artifact access, and model quality metrics.

`monitoring/` is reserved for logs, dashboards, alarms, retraining failure alerts, inference latency metrics, prediction volume, model quality metrics, and future incident notifications.

## Organization Logic

CropSight is a multi-tenant ML product with a full MLOps cycle. The structure is grouped around operational boundaries rather than individual cloud services, which gives the team a clean place to add resources later without turning the root module into a large, mixed file.

The proposed dependency direction is:

```text
networking
  ├── database
  ├── compute
  └── mlops

storage
  ├── compute
  └── mlops

monitoring observes all runtime components
```

This matches the architecture described in `CropSight.md`: users interact with a frontend and backend, upload images, receive predictions, provide feedback, and administrators operate MLflow, model versions, metrics, retraining, and rollback actions.

## Why This Is Scalable

This structure scales because each module can evolve independently. The first implementation can be simple, while later versions can split backend, inference, MLflow, and retraining into separate services without changing the repository layout.

The same applies to storage and databases. Buckets, lifecycle rules, backups, replication, read replicas, and secrets can be introduced inside their own module boundaries as the project matures.

## Why This Is Maintainable

The root module can stay small and declarative once content is added. It should compose modules instead of defining every resource directly. This makes reviews easier because a change to `modules/storage/` clearly concerns storage, while a change to `modules/mlops/` clearly concerns the machine learning lifecycle.

Future inputs and outputs should create explicit contracts between modules. For example, compute can receive subnet IDs from networking and bucket names from storage instead of relying on implicit naming or cross-file assumptions.

The layout also supports environment separation. The same modules can later be reused for `dev`, `staging`, and `prod` with different variable values, remote state keys, instance sizes, backup policies, and deployment protections.

## DevOps Fit

The structure is ready for professional DevOps practices:

- Remote state can be enabled with S3 and DynamoDB locking.
- CI can later run `terraform fmt`, `terraform validate`, and `terraform plan` once actual Terraform blocks are added.
- Modules can be tested and reviewed independently.
- Secrets can be moved into AWS Secrets Manager instead of being committed to the repository.
- Runtime components can be deployed independently from infrastructure changes.
- Observability, retraining, rollback, and disaster recovery concerns are first-class parts of the infrastructure.

The result is intentionally only a file and folder skeleton, but it is shaped around the real responsibilities of CropSight: multi-tenant application delivery, durable ML artifacts, production inference, feedback collection, model lifecycle management, monitoring, and recovery.

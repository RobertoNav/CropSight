module "networking" {
  source = "./modules/networking"

  env                  = var.env
  vpc_cidr             = var.vpc_cidr
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  availability_zones   = var.availability_zones
}

module "storage" {
  source = "./modules/storage"

  env                       = var.env
  lifecycle_expiration_days = var.lifecycle_expiration_days
}

module "compute" {
  source = "./modules/compute"

  env                   = var.env
  aws_region            = var.aws_region
  vpc_id                = module.networking.vpc_id
  public_subnet_ids     = module.networking.public_subnet_ids
  private_subnet_ids    = module.networking.private_subnet_ids
  instance_type         = var.instance_type
  asg_max_size          = var.asg_max_size
  asg_min_size          = var.asg_min_size
  asg_desired_capacity  = var.asg_desired_capacity
  imgs_bucket_arn       = module.storage.imgs_bucket_arn
  mlflow_bucket_arn     = module.storage.mlflow_bucket_arn
  bkp_bucket_arn        = module.storage.bkp_bucket_arn
  db_parameter_name     = "/cropsight/${var.env}/database/url"
  mlflow_parameter_name = "/cropsight/${var.env}/mlflow/url"
  ecr_repository_url    = aws_ecr_repository.backend.repository_url
  github_token          = var.github_token
}

module "database" {
  source = "./modules/database"

  env                    = var.env
  vpc_id                 = module.networking.vpc_id
  private_subnet_ids     = module.networking.private_subnet_ids
  sg_rds_id              = module.compute.sg_rds_id
  db_username            = var.db_username
  db_password            = var.db_password
  db_instance_class      = var.db_instance_class
  db_multi_az            = var.db_multi_az
  db_skip_final_snapshot = var.db_skip_final_snapshot
}

module "mlops" {
  source = "./modules/mlops"

  env                = var.env
  vpc_id             = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids
  sg_mlflow_id       = module.compute.sg_mlflow_id
  mlflow_bucket_name = module.storage.mlflow_bucket_name
  instance_type      = var.instance_type
}

resource "aws_ecr_repository" "backend" {
  name                 = "cropsight-backend"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name      = "cropsight-backend"
    Project   = "CropSight"
    ManagedBy = "Terraform"
  }
}

resource "aws_ecr_lifecycle_policy" "backend" {
  repository = aws_ecr_repository.backend.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Expire untagged images after 7 days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 7
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Keep only the 30 most recent tagged images"
        selection = {
          tagStatus   = "tagged"
          countType   = "imageCountMoreThan"
          countNumber = 30
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

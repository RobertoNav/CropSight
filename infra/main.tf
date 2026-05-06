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

  env                  = var.env
  vpc_id               = module.networking.vpc_id
  public_subnet_ids    = module.networking.public_subnet_ids
  private_subnet_ids   = module.networking.private_subnet_ids
  instance_type        = var.instance_type
  asg_max_size         = var.asg_max_size
  asg_min_size         = var.asg_min_size
  asg_desired_capacity = var.asg_desired_capacity
  imgs_bucket_arn      = module.storage.imgs_bucket_arn
  mlflow_bucket_arn    = module.storage.mlflow_bucket_arn
  bkp_bucket_arn       = module.storage.bkp_bucket_arn
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

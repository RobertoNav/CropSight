# ── staging.tfvars ────────────────────────────────────────────────────────────
# Production-like staging environment — still cost-conscious
env        = "staging"
aws_region = "us-east-1"

# Networking
vpc_cidr             = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24"]
availability_zones   = ["us-east-1a", "us-east-1b"]

# Compute — t2.micro, slightly larger ASG
instance_type        = "t2.micro"
asg_min_size         = 1
asg_max_size         = 3
asg_desired_capacity = 1

# Database — no Multi-AZ in staging, but keep snapshots
db_instance_class      = "db.t3.micro"
db_multi_az            = false
db_skip_final_snapshot = false
db_username            = "cropsight_admin"
# db_password is supplied via TF_VAR_db_password env var or -var flag

# Storage — medium lifecycle (180 days)
lifecycle_expiration_days = 180

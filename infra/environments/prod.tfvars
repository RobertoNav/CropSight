# ── prod.tfvars ───────────────────────────────────────────────────────────────
# Full production environment with HA and compliance settings
env        = "prod"
aws_region = "us-east-1"

# Networking
vpc_cidr             = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24"]
availability_zones   = ["us-east-1a", "us-east-1b"]

# Compute — t2.micro still used (upgrade to t3.small/medium when ready)
instance_type        = "t2.micro"
asg_min_size         = 1
asg_max_size         = 4
asg_desired_capacity = 2

# Database — Multi-AZ for HA, keep final snapshot
db_instance_class      = "db.t3.micro"
db_multi_az            = true
db_skip_final_snapshot = false
db_username            = "cropsight_admin"
# db_password is supplied via TF_VAR_db_password env var or GitHub Actions secret

# Storage — full lifecycle (365 days)
lifecycle_expiration_days = 365

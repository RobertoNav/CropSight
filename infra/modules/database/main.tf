# ── DB Subnet Group ───────────────────────────────────────────────────────────
resource "aws_db_subnet_group" "main" {
  name        = "cropsight-${var.env}-db-subnet-group"
  description = "Subnet group for CropSight RDS (${var.env})"
  subnet_ids  = var.private_subnet_ids

  tags = {
    Name = "cropsight-${var.env}-db-subnet-group"
  }
}

# ── Parameter Group ───────────────────────────────────────────────────────────
resource "aws_db_parameter_group" "postgres15" {
  name        = "cropsight-${var.env}-pg15"
  family      = "postgres15"
  description = "Custom parameter group for CropSight PostgreSQL 15 (${var.env})"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  tags = {
    Name = "cropsight-${var.env}-pg15"
  }
}

# ── RDS PostgreSQL Instance ───────────────────────────────────────────────────
resource "aws_db_instance" "main" {
  identifier        = "cropsight-${var.env}-rds"
  engine            = "postgres"
  engine_version    = "15"
  instance_class    = var.db_instance_class
  allocated_storage = 20
  storage_type      = "gp2"
  storage_encrypted = true

  db_name  = "cropsight"
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [var.sg_rds_id]
  parameter_group_name   = aws_db_parameter_group.postgres15.name

  multi_az            = var.db_multi_az
  publicly_accessible = false
  deletion_protection = false

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  skip_final_snapshot       = var.db_skip_final_snapshot
  final_snapshot_identifier = var.db_skip_final_snapshot ? null : "cropsight-${var.env}-final-snapshot"

  tags = {
    Name = "cropsight-${var.env}-rds"
  }
}

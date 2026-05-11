# ══════════════════════════════════════════════════════════════════════════════
# DATA SOURCES
# ══════════════════════════════════════════════════════════════════════════════

# Latest Amazon Linux 2023 AMI (x86_64)
data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "state"
    values = ["available"]
  }
}

data "aws_caller_identity" "current" {}

data "aws_iam_policy_document" "ec2_ssm_access" {
  statement {
    sid     = "AllowReadRuntimeParameters"
    effect  = "Allow"
    actions = ["ssm:GetParameter"]

    resources = [
      "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter${var.db_parameter_name}",
      "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter${var.mlflow_parameter_name}",
    ]
  }
}

# ══════════════════════════════════════════════════════════════════════════════
# SECURITY GROUPS
# ══════════════════════════════════════════════════════════════════════════════

# --- ALB Security Group ---
resource "aws_security_group" "alb" {
  name        = "cropsight-${var.env}-sg-alb"
  description = "Allow HTTP/HTTPS from internet to the ALB"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "cropsight-${var.env}-sg-alb"
  }
}

# --- EC2 Security Group ---
resource "aws_security_group" "ec2" {
  name        = "cropsight-${var.env}-sg-ec2"
  description = "Allow FastAPI traffic from ALB; SSH in dev"
  vpc_id      = var.vpc_id

  ingress {
    description     = "FastAPI from ALB"
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # SSH only in dev — conditional via count trick using dynamic block
  dynamic "ingress" {
    for_each = var.env == "dev" ? [1] : []
    content {
      description = "SSH (dev only)"
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "cropsight-${var.env}-sg-ec2"
  }
}

# --- RDS Security Group ---
resource "aws_security_group" "rds" {
  name        = "cropsight-${var.env}-sg-rds"
  description = "Allow PostgreSQL from EC2 only"
  vpc_id      = var.vpc_id

  ingress {
    description     = "PostgreSQL from EC2"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "cropsight-${var.env}-sg-rds"
  }
}

# --- Lambda Security Group ---
resource "aws_security_group" "lambda" {
  name        = "cropsight-${var.env}-sg-lambda"
  description = "Lambda functions - ingress from EC2, egress all"
  vpc_id      = var.vpc_id

  ingress {
    description     = "From EC2"
    from_port       = 0
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "cropsight-${var.env}-sg-lambda"
  }
}

# --- MLflow Security Group ---
resource "aws_security_group" "mlflow" {
  name        = "cropsight-${var.env}-sg-mlflow"
  description = "Allow MLflow tracking server port from EC2"
  vpc_id      = var.vpc_id

  ingress {
    description     = "MLflow from VPC"
    from_port       = 5000
    to_port         = 5000
    protocol        = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "cropsight-${var.env}-sg-mlflow"
  }
}


# --- Bastion Security Group ---
resource "aws_security_group" "bastion" {
  count       = var.env == "dev" ? 1 : 0
  name        = "cropsight-${var.env}-sg-bastion"
  description = "SSH access to bastion"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "cropsight-${var.env}-sg-bastion"
  }
}

# --- Bastion Host ---
resource "aws_instance" "bastion" {
  count                       = var.env == "dev" ? 1 : 0
  ami                         = data.aws_ami.al2023.id
  instance_type               = "t3.micro"
  subnet_id                   = var.public_subnet_ids[0]
  key_name                    = "cropsight-dev-key"
  vpc_security_group_ids      = [aws_security_group.bastion[0].id]
  associate_public_ip_address = true

  tags = {
    Name = "cropsight-${var.env}-bastion"
  }
}

# ══════════════════════════════════════════════════════════════════════════════
# IAM — EC2 Instance Profile
# ══════════════════════════════════════════════════════════════════════════════

data "aws_iam_policy_document" "ec2_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ec2" {
  name               = "cropsight-${var.env}-ec2-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume_role.json

  tags = {
    Name = "cropsight-${var.env}-ec2-role"
  }
}

data "aws_iam_policy_document" "ec2_s3_access" {
  statement {
    sid    = "CropSightBucketReadWrite"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:ListBucket",
    ]
    resources = [
      var.imgs_bucket_arn,
      "${var.imgs_bucket_arn}/*",
      var.mlflow_bucket_arn,
      "${var.mlflow_bucket_arn}/*",
      var.bkp_bucket_arn,
      "${var.bkp_bucket_arn}/*",
    ]
  }
}

resource "aws_iam_role_policy" "ec2_s3" {
  name   = "cropsight-${var.env}-ec2-s3-policy"
  role   = aws_iam_role.ec2.id
  policy = data.aws_iam_policy_document.ec2_s3_access.json
}

resource "aws_iam_role_policy" "ec2_ssm" {
  name   = "cropsight-${var.env}-ec2-ssm-policy"
  role   = aws_iam_role.ec2.id
  policy = data.aws_iam_policy_document.ec2_ssm_access.json
}

# SSM access so you can connect without SSH keys
resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "cloudwatch" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

resource "aws_iam_role_policy_attachment" "ecr_read_only" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_iam_instance_profile" "ec2" {
  name = "cropsight-${var.env}-ec2-profile"
  role = aws_iam_role.ec2.name

  tags = {
    Name = "cropsight-${var.env}-ec2-profile"
  }
}

# ══════════════════════════════════════════════════════════════════════════════
# LAUNCH TEMPLATE
# ══════════════════════════════════════════════════════════════════════════════

locals {
  user_data = base64encode(<<-EOF
#!/bin/bash
exec > /var/log/user-data.log 2>&1

# System updates
dnf update -y
dnf install -y python3.11 python3.11-pip docker awscli amazon-cloudwatch-agent

# Docker must be up before the backend container can start
systemctl enable docker
systemctl start docker

# Configurar CloudWatch Agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'CWA'
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/user-data.log",
            "log_group_name": "/cropsight/dev/user-data",
            "log_stream_name": "{instance_id}"
          }
        ]
      }
    }
  }
}
CWA

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

# Alias python
alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1
python3 -m pip install --upgrade pip

# Create backend environment file for the container
mkdir -p /opt/cropsight
fetch_ssm_parameter() {
  local parameter_name="$1"
  local parameter_value=""

  until parameter_value=$(aws ssm get-parameter \
    --name "$parameter_name" \
    --query "Parameter.Value" \
    --output text \
    --region "${var.aws_region}" 2>/dev/null); do
    sleep 10
  done

  echo "$parameter_value"
}

DATABASE_URL=$(fetch_ssm_parameter "${var.db_parameter_name}")
MLFLOW_TRACKING_URI=$(fetch_ssm_parameter "${var.mlflow_parameter_name}")

cat > /opt/cropsight/backend.env << ENVFILE
DATABASE_URL=$${DATABASE_URL}
SECRET_KEY=fe3e4292f8311a93b297cf42b32146514a6b5f407170bb2cdf138e6e167fa588
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
AWS_REGION=${var.aws_region}
S3_BUCKET_IMAGES=cropsight-${var.env}-imgs
S3_BUCKET_MODELS=cropsight-${var.env}-mlflow
LAMBDA_INFERENCE_URL=${var.inference_service_url}
MLFLOW_TRACKING_URI=$${MLFLOW_TRACKING_URI}
MLFLOW_MODEL_NAME=cropsight-classifier
GITHUB_TOKEN=${var.github_token}
GITHUB_REPO=RobertoNav/CropSight
GITHUB_WORKFLOW_ID=retrain.yml
ENVIRONMENT=${var.env}
ENVFILE

# Authenticate Docker to the ECR repository and pull the image used by this environment
ECR_REGISTRY=$(echo "${var.ecr_repository_url}" | cut -d/ -f1)
if [ "${var.env}" = "prod" ]; then
  IMAGE_TAG="latest"
else
  IMAGE_TAG="${var.env}"
fi
IMAGE_URI="${var.ecr_repository_url}:$${IMAGE_TAG}"

aws ecr get-login-password --region "${var.aws_region}" \
  | docker login --username AWS --password-stdin "$${ECR_REGISTRY}"
docker pull "$${IMAGE_URI}" || true

# Systemd service
cat > /etc/systemd/system/cropsight.service << SERVICE
[Unit]
Description=CropSight FastAPI Backend Container
After=network.target docker.service
Requires=docker.service

[Service]
Restart=always
RestartSec=5
TimeoutStartSec=0
ExecStartPre=-/usr/bin/docker rm -f cropsight-backend
ExecStart=/usr/bin/docker run --name cropsight-backend --env-file /opt/cropsight/backend.env -p 8000:8000 $${IMAGE_URI}
ExecStop=/usr/bin/docker stop cropsight-backend

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable cropsight
systemctl start cropsight
EOF
  )
}

resource "aws_launch_template" "backend" {
  name_prefix   = "cropsight-${var.env}-ec2-lt-"
  image_id      = data.aws_ami.al2023.id
  instance_type = var.instance_type
  user_data     = local.user_data
  key_name      = var.env == "dev" ? "cropsight-dev-key" : null

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2.name
  }

  vpc_security_group_ids = [aws_security_group.ec2.id]

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required" # IMDSv2
    http_put_response_hop_limit = 1
  }

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 30 # default es 8GB, subimos a 30GB
      volume_type           = "gp3"
      delete_on_termination = true
    }
  }

  monitoring {
    enabled = true
  }

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name      = "cropsight-${var.env}-ec2"
      Project   = "CropSight"
      Env       = var.env
      ManagedBy = "Terraform"
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ══════════════════════════════════════════════════════════════════════════════
# APPLICATION LOAD BALANCER
# ══════════════════════════════════════════════════════════════════════════════

resource "aws_lb" "main" {
  name               = "cropsight-${var.env}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = false

  tags = {
    Name = "cropsight-${var.env}-alb"
  }
}

resource "aws_lb_target_group" "backend" {
  name        = "cropsight-${var.env}-tg"
  port        = 8000
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "instance"

  health_check {
    path                = "/api/v1/health"
    protocol            = "HTTP"
    port                = "8000"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    matcher             = "200"
  }

  tags = {
    Name = "cropsight-${var.env}-tg"
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
}

# ══════════════════════════════════════════════════════════════════════════════
# AUTO SCALING GROUP
# ══════════════════════════════════════════════════════════════════════════════

resource "aws_autoscaling_group" "backend" {
  name                = "cropsight-${var.env}-ec2-asg"
  min_size            = var.asg_min_size
  max_size            = var.asg_max_size
  desired_capacity    = var.asg_desired_capacity
  vpc_zone_identifier = var.private_subnet_ids
  target_group_arns   = [aws_lb_target_group.backend.arn]
  health_check_type   = "EC2"

  launch_template {
    id      = aws_launch_template.backend.id
    version = "$Latest"
  }

  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
    }
  }

  tag {
    key                 = "Name"
    value               = "cropsight-${var.env}-ec2-asg"
    propagate_at_launch = true
  }

  tag {
    key                 = "Project"
    value               = "CropSight"
    propagate_at_launch = true
  }

  tag {
    key                 = "Env"
    value               = var.env
    propagate_at_launch = true
  }

  tag {
    key                 = "ManagedBy"
    value               = "Terraform"
    propagate_at_launch = true
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ── CPU Target-Tracking Scaling Policy ───────────────────────────────────────
resource "aws_autoscaling_policy" "cpu_tracking" {
  name                   = "cropsight-${var.env}-cpu-tracking"
  autoscaling_group_name = aws_autoscaling_group.backend.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = 60.0
  }
}

resource "aws_acm_certificate" "cropsight" {
  domain_name       = "cropsight.io"
  validation_method = "DNS"

  subject_alternative_names = [
    "*.cropsight.io"
  ]

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "cropsight-${var.env}-cert"
  }
}

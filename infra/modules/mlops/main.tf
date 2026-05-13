# ── Data Sources ──────────────────────────────────────────────────────────────
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

# ── IAM Role for MLflow EC2 ───────────────────────────────────────────────────
data "aws_iam_policy_document" "mlflow_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "mlflow" {
  name               = "cropsight-${var.env}-mlflow-role"
  assume_role_policy = data.aws_iam_policy_document.mlflow_assume_role.json

  tags = {
    Name = "cropsight-${var.env}-mlflow-role"
  }
}

data "aws_iam_policy_document" "mlflow_s3" {
  statement {
    sid    = "MLflowS3Access"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:ListBucket",
    ]
    resources = [
      "arn:aws:s3:::cropsight-${var.env}-mlflow",
      "arn:aws:s3:::cropsight-${var.env}-mlflow/*",
    ]
  }
}

resource "aws_iam_role_policy" "mlflow_s3" {
  name   = "cropsight-${var.env}-mlflow-s3-policy"
  role   = aws_iam_role.mlflow.id
  policy = data.aws_iam_policy_document.mlflow_s3.json
}

resource "aws_iam_role_policy_attachment" "mlflow_ssm" {
  role       = aws_iam_role.mlflow.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "mlflow" {
  name = "cropsight-${var.env}-mlflow-profile"
  role = aws_iam_role.mlflow.name

  tags = {
    Name = "cropsight-${var.env}-mlflow-profile"
  }
}

# ── MLflow EC2 Instance ───────────────────────────────────────────────────────
resource "aws_instance" "mlflow" {
  ami                    = data.aws_ami.al2023.id
  instance_type          = var.instance_type
  subnet_id              = var.private_subnet_ids[0]
  vpc_security_group_ids = [var.sg_mlflow_id]
  iam_instance_profile   = aws_iam_instance_profile.mlflow.name

  user_data = base64encode(<<-EOF
    #!/bin/bash
    set -e

    # System updates
    dnf update -y
    dnf install -y python3.11 python3.11-pip git

    # Install MLflow and dependencies
    python3.11 -m pip install --upgrade pip
    python3.11 -m pip install mlflow boto3 psycopg2-binary

    # Create MLflow systemd service
    cat > /etc/systemd/system/mlflow.service <<SERVICE
    [Unit]
    Description=MLflow Tracking Server
    After=network.target

    [Service]
    User=ec2-user
    ExecStart=/usr/local/bin/mlflow server \
      --backend-store-uri sqlite:////opt/mlflow/mlflow.db \
      --default-artifact-root s3://${var.mlflow_bucket_name}/artifacts \
      --host 0.0.0.0 \
      --port 5000
    Restart=always
    RestartSec=5
    Environment=AWS_DEFAULT_REGION=us-east-1

    [Install]
    WantedBy=multi-user.target
    SERVICE

    mkdir -p /opt/mlflow
    chown ec2-user:ec2-user /opt/mlflow

    systemctl daemon-reload
    systemctl enable mlflow
    systemctl start mlflow
  EOF
  )

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  root_block_device {
    volume_size           = 30
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true
  }

  tags = {
    Name = "cropsight-${var.env}-mlflow"
  }
}

resource "aws_ssm_parameter" "mlflow_url" {
  name        = "/cropsight/${var.env}/mlflow/url"
  description = "MLflow tracking server URL for ${var.env}"
  type        = "String"
  value       = "http://${aws_instance.mlflow.private_dns}:5000"
  overwrite   = true

  tags = {
    Name = "cropsight-${var.env}-mlflow-url"
  }
}

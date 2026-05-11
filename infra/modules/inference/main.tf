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

resource "aws_security_group" "inference" {
  name        = "cropsight-${var.env}-sg-inference"
  description = "Allow inference traffic from VPC"
  vpc_id      = var.vpc_id

  ingress {
    description = "Inference API from VPC"
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

data "aws_iam_policy_document" "assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "inference" {
  name               = "cropsight-${var.env}-inference-role"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

data "aws_iam_policy_document" "s3_read" {
  statement {
    effect = "Allow"

    actions = [
      "s3:GetObject",
      "s3:ListBucket",
    ]

    resources = [
      var.mlflow_bucket_arn,
      "${var.mlflow_bucket_arn}/*",
    ]
  }
}

resource "aws_iam_role_policy" "s3_read" {
  name   = "cropsight-${var.env}-inference-s3-read"
  role   = aws_iam_role.inference.id
  policy = data.aws_iam_policy_document.s3_read.json
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.inference.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "inference" {
  name = "cropsight-${var.env}-inference-profile"
  role = aws_iam_role.inference.name
}

resource "aws_instance" "inference" {
  ami                    = data.aws_ami.al2023.id
  instance_type          = var.instance_type
  subnet_id              = var.private_subnet_ids[0]
  vpc_security_group_ids = [aws_security_group.inference.id]
  iam_instance_profile   = aws_iam_instance_profile.inference.name

  user_data = base64encode(<<-EOF
        #!/bin/bash
        set -e

        dnf update -y
        dnf install -y python3.11 python3.11-pip git

        alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1
        python3 -m pip install --upgrade pip

        cd /opt
        git clone https://github.com/RobertoNav/CropSight.git app || true
        cd /opt/app

        python3 -m pip install \
        fastapi \
        uvicorn \
        python-multipart \
        pillow \
        torch \
        torchvision \
        mlflow \
        boto3

        cat > /etc/systemd/system/cropsight-inference.service <<SERVICE
        [Unit]
        Description=CropSight ML Inference Service
        After=network.target

        [Service]
        User=ec2-user
        WorkingDirectory=/opt/app/ml
        ExecStart=/usr/bin/python3 -m uvicorn src.inference.main:app --host 0.0.0.0 --port 8000
        Restart=always
        RestartSec=10
        Environment=MLFLOW_TRACKING_URI=${var.mlflow_url}
        Environment=CROPS=${var.crops}
        Environment=AWS_DEFAULT_REGION=us-east-1

        [Install]
        WantedBy=multi-user.target
        SERVICE

        systemctl daemon-reload
        systemctl enable cropsight-inference
        systemctl start cropsight-inference
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
    Name = "cropsight-${var.env}-inference"
  }
}

resource "aws_route53_zone" "private" {
  name = "cropsight-${var.env}.internal"

  vpc {
    vpc_id = var.vpc_id
  }
}

resource "aws_route53_record" "inference" {
  zone_id = aws_route53_zone.private.zone_id
  name    = "inference.cropsight-${var.env}.internal"
  type    = "A"
  ttl     = 60
  records = [aws_instance.inference.private_ip]
}

# ── SNS Topic for Alerts ──────────────────────────────────────────────────────
resource "aws_sns_topic" "alerts" {
  name = "cropsight-${var.env}-alerts"

  tags = {
    Name = "cropsight-${var.env}-alerts"
  }
}

resource "aws_sns_topic_subscription" "email" {
  count     = var.alarm_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# ── CloudWatch Alarm: High CPU on ASG ────────────────────────────────────────
resource "aws_cloudwatch_metric_alarm" "asg_high_cpu" {
  alarm_name          = "cropsight-${var.env}-asg-high-cpu"
  alarm_description   = "ASG average CPU > 80% for 5 minutes"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  treat_missing_data  = "notBreaching"

  dimensions = {
    AutoScalingGroupName = var.asg_name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  tags = {
    Name = "cropsight-${var.env}-asg-high-cpu"
  }
}

# ── CloudWatch Alarm: RDS High CPU ───────────────────────────────────────────
resource "aws_cloudwatch_metric_alarm" "rds_high_cpu" {
  alarm_name          = "cropsight-${var.env}-rds-high-cpu"
  alarm_description   = "RDS CPU > 80% for 5 minutes"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = var.db_instance_id
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = {
    Name = "cropsight-${var.env}-rds-high-cpu"
  }
}

# ── CloudWatch Alarm: RDS Low Storage ────────────────────────────────────────
resource "aws_cloudwatch_metric_alarm" "rds_low_storage" {
  alarm_name          = "cropsight-${var.env}-rds-low-storage"
  alarm_description   = "RDS free storage < 2 GB"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 2147483648 # 2 GB in bytes
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = var.db_instance_id
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = {
    Name = "cropsight-${var.env}-rds-low-storage"
  }
}

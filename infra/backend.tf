terraform {
  backend "s3" {
    bucket         = "cropsight-tfstate"
    key            = "cropsight/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "cropsight-lock"
    encrypt        = true
  }
}

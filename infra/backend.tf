terraform {
  backend "s3" {
    bucket         = "cropsight-tfstate"
    region         = "us-east-1"
    dynamodb_table = "cropsight-lock"
    encrypt        = true
  }
}
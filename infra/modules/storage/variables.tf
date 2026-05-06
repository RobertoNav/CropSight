variable "env" {
  description = "Deployment environment"
  type        = string
}

variable "lifecycle_expiration_days" {
  description = "Number of days before objects expire (dev=90, prod=365)"
  type        = number
  default     = 90
}

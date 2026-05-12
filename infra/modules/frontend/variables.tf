variable "env" {
    description = "Deployment environment"
    type        = string
}

variable "github_token" {
    description = "GitHub token for Amplify repository access"
    type        = string
    sensitive   = true
}

variable "repository_url" {
    description = "GitHub repository URL"
    type        = string
}

variable "branch_name" {
    description = "Git branch deployed by Amplify"
    type        = string
}

variable "backend_url" {
    description = "Backend base URL"
    type        = string
}

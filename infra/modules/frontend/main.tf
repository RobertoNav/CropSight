locals {
    frontend_api_url = var.backend_url
}

resource "aws_amplify_app" "frontend" {
    name         = "cropsight-${var.env}-frontend"
    repository   = var.repository_url
    access_token = var.github_token

    platform = "WEB_COMPUTE"

    build_spec = <<-YAML
version: 1
applications:
  - appRoot: frontend
    frontend:
      phases:
        preBuild:
          commands:
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: .next
        files:
          - "**/*"
      cache:
        paths:
          - node_modules/**/*
          - .next/cache/**/*
YAML



    environment_variables = {
        AMPLIFY_MONOREPO_APP_ROOT = "frontend"
        NEXT_PUBLIC_API_URL = local.frontend_api_url
        BACKEND_URL         = var.backend_url
    }

    custom_rule {
        source = "</^[^.]+$|\\.(?!(css|gif|ico|jpg|jpeg|js|png|txt|svg|webp|woff|woff2|ttf|map|json)$)([^.]+$)/>"
        target = "/index.html"
        status = "200"
    }

    tags = {
        Name = "cropsight-${var.env}-frontend"
    }
}

resource "aws_amplify_branch" "frontend" {
    app_id            = aws_amplify_app.frontend.id
    branch_name       = var.branch_name
    enable_auto_build = false
    stage             = var.env == "prod" ? "PRODUCTION" : "DEVELOPMENT"

    environment_variables = {
        AMPLIFY_MONOREPO_APP_ROOT = "frontend"
        NEXT_PUBLIC_API_URL = local.frontend_api_url
        BACKEND_URL         = var.backend_url
    }

    framework = "Next.js - SSR"

    tags = {
        Name = "cropsight-${var.env}-frontend-${var.branch_name}"
    }
}

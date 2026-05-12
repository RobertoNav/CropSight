output "amplify_app_id" {
    description = "Amplify app ID"
    value       = aws_amplify_app.frontend.id
}

output "amplify_branch_name" {
    description = "Amplify branch name"
    value       = aws_amplify_branch.frontend.branch_name
}

output "amplify_default_domain" {
    description = "Amplify default domain"
    value       = aws_amplify_app.frontend.default_domain
}

output "user_pool_id" {
  value = "${aws_cognito_user_pool._.id}"
}

output "user_pool_arn" {
  value = "${aws_cognito_user_pool._.arn}"
}

output "user_pool_endpoint" {
  value = "${aws_cognito_user_pool._.endpoint}"
}

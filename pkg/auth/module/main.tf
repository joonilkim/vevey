## Cognito User Pool

resource "aws_cognito_user_pool" "_" {
  name = "auth.${var.domain}"

  alias_attributes         = [ "email" ]
  auto_verified_attributes = [ "email" ]

  admin_create_user_config {
    allow_admin_create_user_only = false
  }

  # email_configuration {
  #   reply_to_email_address = "foo.bar@baz"
  # }

  password_policy {
    minimum_length    = 8
    require_uppercase = true
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
  }

  schema {
    name                = "email"
    attribute_data_type = "String"
    mutable             = false
    required            = true
  }

  schema {
    name                = "nickname"
    attribute_data_type = "String"
    mutable             = true
    required            = true
  }

  verification_message_template {
    default_email_option = "CONFIRM_WITH_LINK"
  }

  lifecycle {
    ignore_changes  = [ "schema" ]
  }
}

resource "aws_cognito_user_pool_client" "_" {
  name = "auth.${var.domain}"

  user_pool_id    = "${aws_cognito_user_pool._.id}"
  generate_secret = false

  explicit_auth_flows = [
    "ADMIN_NO_SRP_AUTH",
    "USER_PASSWORD_AUTH",
  ]
}

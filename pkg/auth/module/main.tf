locals {
  target      = "${path.root}/../pkg/auth"
  dist        = "lambda.zip"
}

## DynamoDB

resource "aws_dynamodb_table" "user" {
  name = "${var.dynamodb_prefix}User"

  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  global_secondary_index {
    name               = "byEmail"
    hash_key           = "email"
    projection_type    = "ALL"
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_dynamodb_table" "token" {
  name = "${var.dynamodb_prefix}Token"

  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  range_key    = "token"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "token"
    type = "S"
  }

  ttl {
    attribute_name = "exp"
    enabled        = true
  }

  lifecycle {
    prevent_destroy = true
  }
}

## Role

data "aws_iam_policy_document" "_" {
  statement {
    actions   = ["sts:AssumeRole"]
    effect    = "Allow"
    principals {
      type        = "Service"
      identifiers = [
        "lambda.amazonaws.com",
      ]
    }
  }
}

data "aws_iam_policy_document" "lambda" {
  statement {
    effect    = "Allow"
    actions   = [
      "cloudwatch:*",
      "cognito-identity:ListIdentityPools",
      "cognito-sync:GetCognitoEvents",
      "cognito-sync:SetCognitoEvents",
      "events:*",
      "iam:ListAttachedRolePolicies",
      "iam:ListRolePolicies",
      "iam:ListRoles",
      "iam:PassRole",
      "kinesis:DescribeStream",
      "kinesis:ListStreams",
      "kinesis:PutRecord",
      "lambda:*",
      "logs:*",
      "s3:*",
      "sns:ListSubscriptions",
      "sns:ListSubscriptionsByTopic",
      "sns:ListTopics",
      "sns:Subscribe",
      "sns:Unsubscribe",
    ]
    resources = ["*"]
  }

  statement = {
    effect    = "Allow"
    actions   = [
      "dynamodb:*",
    ]
    resources = [
      "arn:aws:dynamodb:*:*:table/${var.dynamodb_prefix}User",
      "arn:aws:dynamodb:*:*:table/${var.dynamodb_prefix}Token",
    ]
  }

  statement = {
    effect    = "Deny"
    actions   = [
      "dynamodb:CreateTable",
      "dynamodb:DeleteTable",
      "dynamodb:CreateBackup",
      "dynamodb:DeleteBackup",
      "dynamodb:UpdateContinuousBackup",
      "dynamodb:Purchase*",
      "dynamodb:Restore*",
    ]
    resources = [ "*" ]
  }

}

resource "aws_iam_role" "_" {
  name = "auth-lambda.${var.domain}"
  assume_role_policy = "${data.aws_iam_policy_document._.json}"
}

resource "aws_iam_role_policy" "_" {
  role    = "${aws_iam_role._.id}"
  policy  = "${data.aws_iam_policy_document.lambda.json}"
}

## Lambda Function

resource "aws_lambda_function" "_" {
  filename      = "${local.target}/${local.dist}"

  # not allows '.' character for function name
  function_name = "${replace("auth.${var.domain}",".","-")}"
  handler       = "dist/index.handler"
  runtime       = "nodejs8.10"
  publish       = true
  role          = "${aws_iam_role._.arn}"

  memory_size   = 1024
  timeout       = 10

  environment {
    variables = {
      NODE_ENV = "production"
      DYNAMODB_PREFIX = "${var.dynamodb_prefix}"
    }
  }
}

# Use deploy script cause of terraform's downtime
resource "null_resource" "deploy" {
  triggers {
    hash = "${base64sha256(file("${local.target}/${local.dist}"))}"
  }

  provisioner "local-exec" {
    command     = "make deploy"
    working_dir = "${local.target}"

    environment {
      function_name = "${aws_lambda_function._.function_name}"
      zip_file      = "fileb://${aws_lambda_function._.filename}"
    }
  }
}

## API Gateway

data "aws_api_gateway_rest_api" "_" {
  name = "${var.apig_name}"
}

resource "aws_api_gateway_resource" "_" {
  rest_api_id = "${data.aws_api_gateway_rest_api._.id}"
  parent_id   = "${var.apig_root_id}"
  path_part   = "auth"
}

resource "aws_api_gateway_method" "_" {
  rest_api_id   = "${data.aws_api_gateway_rest_api._.id}"
  resource_id   = "${aws_api_gateway_resource._.id}"
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "_" {
  rest_api_id = "${data.aws_api_gateway_rest_api._.id}"
  resource_id = "${aws_api_gateway_resource._.id}"
  http_method = "${aws_api_gateway_method._.http_method}"

  integration_http_method = "POST"

  type = "AWS_PROXY"
  uri  = "${aws_lambda_function._.invoke_arn}"
}

data "aws_caller_identity" "_" {}

resource "aws_lambda_permission" "_" {
  action        = "lambda:InvokeFunction"
  function_name = "${aws_lambda_function._.arn}"
  principal     = "apigateway.amazonaws.com"

  # The /*/*/* part allows invocation from any stage, method and resource path
  # within API Gateway REST API.
  # arn:aws:execute-api:region:account-id:api-id/stage/http-method/Resource-path
  source_arn =
  "arn:aws:execute-api:${var.region}:${data.aws_caller_identity._.account_id}:${data.aws_api_gateway_rest_api._.id}/${var.stage}/*/api/auth"
}

resource "aws_api_gateway_deployment" "_" {
  depends_on = ["aws_api_gateway_integration._"]

  rest_api_id = "${data.aws_api_gateway_rest_api._.id}"
  stage_name  = "${var.stage}"

  lifecycle {
    create_before_destroy = true
  }

  # force update on dependencies change
  variables = {
    "dependencies" = "${
      aws_api_gateway_integration._.uri
    }-${
      aws_lambda_permission._.source_arn
    }"
  }
}


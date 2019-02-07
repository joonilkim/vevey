locals {
  target      = "${path.root}/../pkg/api"
  dist        = "lambda.zip"
}

## DynamoDB

resource "aws_dynamodb_table" "post" {
  name = "${var.dynamodb_prefix}Posts"

  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "authorId"
    type = "S"
  }

  attribute {
    name = "pos"
    type = "N"
  }

  global_secondary_index {
    name               = "byAuthor"
    hash_key           = "authorId"
    range_key          = "pos"
    projection_type    = "ALL"
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
      "arn:aws:dynamodb:*:*:table/${var.dynamodb_prefix}Post",
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

  statement = {
    sid       = "ReadOnly"
    effect    = "Allow"
    actions   = [
      "dynamodb:BatchGet*",
      "dynamodb:ConditionCheck*",
      "dynamodb:Describe*",
      "dynamodb:Get*",
    ]
    resources = [
      "arn:aws:dynamodb:*:*:table/${var.dynamodb_prefix}User",
    ]
  }
}

resource "aws_iam_role" "_" {
  name = "api-lambda.${var.domain}"
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
  function_name = "${replace("app.${var.domain}",".","-")}"
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

resource "aws_api_gateway_rest_api" "_" {
  name = "api.${var.domain}"
  endpoint_configuration {
    types = ["REGIONAL"]
  }
  minimum_compression_size = "1000"
}

resource "aws_api_gateway_resource" "root" {
  rest_api_id = "${aws_api_gateway_rest_api._.id}"
  parent_id   = "${aws_api_gateway_rest_api._.root_resource_id}"
  path_part   = "api"
}

resource "aws_api_gateway_resource" "_" {
  rest_api_id = "${aws_api_gateway_rest_api._.id}"
  parent_id   = "${aws_api_gateway_resource.root.id}"
  path_part   = "app"
}

resource "aws_api_gateway_method" "_" {
  rest_api_id   = "${aws_api_gateway_rest_api._.id}"
  resource_id   = "${aws_api_gateway_resource._.id}"
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "_" {
  rest_api_id = "${aws_api_gateway_rest_api._.id}"
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
  "arn:aws:execute-api:${var.region}:${data.aws_caller_identity._.account_id}:${aws_api_gateway_rest_api._.id}/${var.stage}/*/api/app"
}

resource "aws_api_gateway_deployment" "_" {
  depends_on = ["aws_api_gateway_integration._"]

  rest_api_id = "${aws_api_gateway_rest_api._.id}"
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

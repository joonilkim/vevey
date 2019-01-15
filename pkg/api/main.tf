locals {
  dist = "${path.module}/dist.zip"
}

## Role

data "aws_iam_policy_document" "_" {
  statement {
    actions   = ["sts:AssumeRole"]
    effect    = "Allow"
    principals {
      type        = "Service"
      identifiers = [
        "apigateway.amazonaws.com",
        "dynamodb.amazonaws.com",
        "lambda.amazonaws.com",
        "logs.amazonaws.com",
        "s3.amazonaws.com",
      ]
    }
  }
}

resource "aws_iam_role" "_" {
  name = "api-lambda.${var.domain}"
  assume_role_policy = "${data.aws_iam_policy_document._.json}"
}

# Provides full access to Lambda, S3, DynamoDB, CloudWatch Metrics and Logs.
data "aws_iam_policy" "_" {
  arn = "arn:aws:iam::aws:policy/AWSLambdaFullAccess"
}

resource "aws_iam_role_policy_attachment" "_" {
  role       = "${aws_iam_role._.id}"
  policy_arn = "${data.aws_iam_policy._.arn}"
}

# Upload packages

# Package and deploy on current git hash is changed
module "hash" {
  source = "matti/resource/shell"
  command = "git log --pretty=format:'%H' -n 1 -- ."
}

resource "null_resource" "build" {
  triggers {
    hash = "${module.hash.stdout}"
  }

  provisioner "local-exec" {
    command     = "make clean && make ${local.dist}"
    working_dir = "${path.module}"
  }
}

resource "aws_s3_bucket_object" "_" {
  bucket = "${var.s3_bucket}"
  key    = "${var.s3_key}"
  etag   = "${module.hash.stdout}"
  source = "${local.dist}"

  depends_on = ["null_resource.build"]
}

## Lambda Function

resource "aws_lambda_function" "_" {
  # not allows '.' character for function name
  function_name = "${replace("api.${var.domain}",".","-")}"
  handler       = "index.handler"
  runtime       = "nodejs8.10"
  publish       = true

  s3_bucket     = "${var.s3_bucket}"
  s3_key        = "${var.s3_key}"
  role          = "${aws_iam_role._.arn}"

  source_code_hash = "${module.hash.stdout}"

  memory_size   = 512
  timeout       = 10
}

## API Gateway

resource "aws_api_gateway_rest_api" "_" {
  name = "api.${var.domain}"
  endpoint_configuration {
    types = ["REGIONAL"]
  }
  minimum_compression_size = "800"
}

resource "aws_api_gateway_resource" "_" {
  rest_api_id = "${aws_api_gateway_rest_api._.id}"
  parent_id   = "${aws_api_gateway_rest_api._.root_resource_id}"
  path_part   = "{proxy+}"
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
  source_arn = "arn:aws:execute-api:${var.region}:${data.aws_caller_identity._.account_id}:${aws_api_gateway_rest_api._.id}/${var.stage}/*/*"
}

resource "aws_api_gateway_deployment" "_" {
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

  depends_on = ["aws_api_gateway_integration._"]
}

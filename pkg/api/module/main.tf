locals {
  target      = "${path.root}/../pkg/api"
  dist        = "dist.zip"
  dist_s3_key = "api/lambda.zip"
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

resource "aws_iam_role" "_" {
  name = "api-lambda.${var.domain}"
  assume_role_policy = "${data.aws_iam_policy_document._.json}"
}

# Provides full access to Lambda, S3, DynamoDB, CloudWatch Metrics and Logs.
resource "aws_iam_role_policy_attachment" "_" {
  role       = "${aws_iam_role._.id}"
  policy_arn = "arn:aws:iam::aws:policy/AWSLambdaFullAccess"
}

# Upload packages

# Package and deploy on current git hash is changed
data "external" "githash" {
  program = ["${path.module}/githash.sh"]

  query {
    directory = "${local.target}"
  }
}

# Rebuild if githash got changed
resource "null_resource" "dist_zip" {
  triggers {
    githash = "${data.external.githash.result["githash"]}"
  }

  provisioner "local-exec" {
    command     = "make dist.zip"
    working_dir = "${local.target}"
  }
}

## Lambda Function

resource "aws_lambda_function" "_" {
  depends_on = ["null_resource.dist_zip"]

  filename      = "${local.target}/${local.dist}"

  # not allows '.' character for function name
  function_name = "${replace("api.${var.domain}",".","-")}"
  handler       = "index.handler"
  runtime       = "nodejs8.10"
  publish       = true
  role          = "${aws_iam_role._.arn}"

  memory_size   = 512
  timeout       = 10
}

resource "null_resource" "deploy" {
  triggers {
    githash = "${data.external.githash.result["githash"]}"
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
  timeout_milliseconds    = 9000

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
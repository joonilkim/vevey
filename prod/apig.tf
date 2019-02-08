## Role

data "aws_iam_policy_document" "apig" {
  statement {
    actions   = ["sts:AssumeRole"]
    effect    = "Allow"
    principals {
      type        = "Service"
      identifiers = [
        "apigateway.amazonaws.com",
      ]
    }
  }
}

resource "aws_iam_role" "apig" {
  name = "apig.${var.domain}"
  assume_role_policy = "${data.aws_iam_policy_document.apig.json}"
}

resource "aws_iam_role_policy_attachment" "apig" {
  role       = "${aws_iam_role.apig.id}"
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

resource "aws_api_gateway_account" "_" {
  cloudwatch_role_arn = "${aws_iam_role.apig.arn}"
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
  path_part   = "api"
}

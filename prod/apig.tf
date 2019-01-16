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

data "aws_iam_policy" "apig" {
  arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

resource "aws_iam_role_policy_attachment" "apig" {
  role       = "${aws_iam_role.apig.id}"
  policy_arn = "${data.aws_iam_policy.apig.arn}"
}

resource "aws_api_gateway_account" "_" {
  cloudwatch_role_arn = "${aws_iam_role.apig.arn}"
}

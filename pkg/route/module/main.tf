locals {
  target        = "${path.root}/../pkg/route"
  dist          = "lambda.zip"
  web_origin_id = "web"
  api_origin_id = "api"
}

provider "aws" {
  alias   = "virginia"
  region  = "us-east-1"
}

data "aws_s3_bucket" "web" {
  bucket = "${var.web_bucket}"
}

data "aws_s3_bucket" "log" {
  bucket = "${var.log_bucket}"
}


## Lambda@Edge Policy
# @see: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-edge-permissions.html

data "aws_iam_policy_document" "lambda" {
  statement {
    actions   = ["sts:AssumeRole"]
    effect    = "Allow"
    principals {
      type        = "Service"
      identifiers = [
        "lambda.amazonaws.com",
        "edgelambda.amazonaws.com",
      ]
    }
  }
}

resource "aws_iam_role" "_" {
  name = "route-lambda.${var.domain}"
  assume_role_policy = "${data.aws_iam_policy_document.lambda.json}"
}

resource "aws_iam_role_policy_attachment" "_" {
  role       = "${aws_iam_role._.id}"
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}


## Upload Lambda@Edge

## Lambda@Edge Function

resource "aws_lambda_function" "_" {
  filename         = "${local.target}/${local.dist}"
  source_code_hash = "${base64sha256(file("${local.target}/${local.dist}"))}"

  function_name = "${replace("with_security.${var.domain}",".","-")}"
  handler       = "dist/secure.handler"
  runtime       = "nodejs8.10"
  publish       = true
  role          = "${aws_iam_role._.arn}"

  memory_size   = 512
  timeout       = 3

  # Lambda@Edge function must be located in us-east-1
  provider      = "aws.virginia"
}

resource "aws_lambda_permission" "_" {
  action        = "lambda:InvokeFunction"
  function_name = "${aws_lambda_function._.arn}"
  principal     = "cloudfront.amazonaws.com"
  source_arn    = "${aws_cloudfront_distribution._.arn}"

  provider      = "aws.virginia"
}

## Origin Identity

resource "aws_cloudfront_origin_access_identity" "_" {
  comment = "${var.domain}"
}

data "aws_iam_policy_document" "web" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${data.aws_s3_bucket.web.arn}/*"]

    principals {
      type        = "AWS"
      identifiers = ["${aws_cloudfront_origin_access_identity._.iam_arn}"]
    }
  }

  statement {
    actions   = ["s3:ListBucket"]
    resources = ["${data.aws_s3_bucket.web.arn}"]

    principals {
      type        = "AWS"
      identifiers = ["${aws_cloudfront_origin_access_identity._.iam_arn}"]
    }
  }
}

resource "aws_s3_bucket_policy" "web" {
  bucket = "${data.aws_s3_bucket.web.bucket}"
  policy = "${data.aws_iam_policy_document.web.json}"
}

## Cloudfront

resource "aws_cloudfront_distribution" "_" {
  aliases             = ["${var.domain}"]
  enabled             = true
  is_ipv6_enabled     = true
  price_class         = "PriceClass_All"

  default_root_object = "index.html"

  origin {
    domain_name = "${data.aws_s3_bucket.web.bucket_domain_name}"
    origin_id   = "${local.web_origin_id}"

    s3_origin_config {
      origin_access_identity = "${
        aws_cloudfront_origin_access_identity._.cloudfront_access_identity_path
      }"
    }
  }

  origin {
    domain_name = "${var.apig_id}.execute-api.${var.region}.amazonaws.com"
    origin_id   = "${local.api_origin_id}"

    origin_path = "/${var.stage}"

    custom_origin_config {
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]

      http_port                = 80
      https_port               = 443
      origin_keepalive_timeout = 60
      origin_read_timeout      = 10
    }
  }

  # Top precedence
  ordered_cache_behavior {
    target_origin_id       = "${local.web_origin_id}"
    path_pattern           = "/assets/*"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]

    viewer_protocol_policy = "allow-all"
    compress               = true

    default_ttl            = 86400
    min_ttl                = 0
    max_ttl                = 31536000

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }
  }

  ordered_cache_behavior {
    target_origin_id = "${local.api_origin_id}"
    path_pattern     = "/api/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]

    forwarded_values {
      query_string = true

      # Use only allowed ones except `Host` header
      # https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/RequestAndResponseBehaviorCustomOrigin.html
      headers = [
        "Accept",
        "Accept-Encoding",
        "Accept-Language",
        "Authorization",
        "Referer",
        "User-Agent",
        "X-Forwarded-For",
      ]

      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "https-only"

    compress    = true
  }

  default_cache_behavior {
    target_origin_id       = "${local.web_origin_id}"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]

    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }
  }

  # https://tw.saowen.com/a/398ff4443a069540860bcb2f090e2b052a979959285ada5af9d91ca0e508de48
  custom_error_response {
    error_caching_min_ttl = 0
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
  }

  custom_error_response {
    error_caching_min_ttl = 0
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
  }

  logging_config {
    include_cookies = false
    bucket          = "${data.aws_s3_bucket.log.bucket_domain_name}"
    prefix          = "cloudfront/"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

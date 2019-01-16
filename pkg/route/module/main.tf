locals {
  web_origin_id = "web"
  api_origin_id = "api"
}

data "aws_s3_bucket" "web" {
  bucket = "${var.web_bucket}"
}

data "aws_s3_bucket" "log" {
  bucket = "${var.log_bucket}"
}

resource "aws_cloudfront_origin_access_identity" "_" {}

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
    domain_name = "${var.api_id}.execute-api.${var.region}.amazonaws.com"
    origin_id   = "${local.api_origin_id}"

    origin_path = "/${var.stage}"

    custom_origin_config {
      origin_protocol_policy = "https-only"
      http_port              = 80
      https_port             = 443
      origin_ssl_protocols = ["SSLv3", "TLSv1", "TLSv1.1", "TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "${local.web_origin_id}"

    viewer_protocol_policy = "redirect-to-https"
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

    allowed_methods = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods = ["GET", "HEAD"]

    forwarded_values {
      query_string = true

      headers = [
        "Accept",
        "Authorization",
        "Content-Type",
        "Referer",
      ]

      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "redirect-to-https"

    compress    = true
    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
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
    prefix          = "${var.domain}/"
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

## Add cloudfront access identity to s3 bucket

data "aws_iam_policy_document" "s3_web" {
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
  policy = "${data.aws_iam_policy_document.s3_web.json}"
}

provider "aws" {
  region = "${var.region}"
}

## Bucket for SystemAdmin: terraform state, ...

resource "aws_s3_bucket" "system" {
  bucket         = "system.${var.domain}"
  acl            = "private"
  force_destroy  = "false"

  versioning {
    enabled = true
  }
}

## Bucket for deployable packages

resource "aws_s3_bucket" "pkg" {
  bucket         = "pkg.${var.domain}"
  acl            = "private"
  force_destroy  = "false"

  versioning {
    enabled = true
  }
}

resource "aws_s3_bucket" "log" {
  bucket         = "log.${var.domain}"
  acl            = "private"
  force_destroy  = "false"

  versioning {
    enabled = true
  }
}

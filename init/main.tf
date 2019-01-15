provider "aws" {
  region = "${var.region}"
}

## Bucket for SystemAdmin: terraform state, ...

resource "aws_s3_bucket" "system" {
  bucket         = "${var.project}-system"
  acl            = "private"
  force_destroy  = "false"

  versioning {
    enabled = true
  }
}

## Bucket for deployable packages

resource "aws_s3_bucket" "pkg" {
  bucket         = "${var.project}-pkg"
  acl            = "private"
  force_destroy  = "false"

  versioning {
    enabled = true
  }
}

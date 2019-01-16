locals {
  target = "${path.root}/../pkg/web"
}

## Bucket

resource "aws_s3_bucket" "www" {
  bucket = "www.${var.domain}"
  acl    = "private"
  # policy will be set on the route module

  website {
    index_document = "index.html"
  }
}

## Upload

# Package and deploy on current git hash is changed
data "external" "githash" {
  program = ["${path.module}/githash.sh"]

  query {
    directory = "${local.target}"
  }
}

# Rebuild if githash got changed
resource "null_resource" "dist" {
  triggers {
    githash = "${data.external.githash.result["githash"]}"
  }

  provisioner "local-exec" {
    command     = "make dist"
    working_dir = "${local.target}"
  }
}

resource "aws_s3_bucket_object" "index" {
  depends_on = ["null_resource.dist"]

  bucket        = "${aws_s3_bucket.www.bucket}"
  key           = "index.html"
  source        = "${local.target}/dist/index.html"
  acl           = "private"
  cache_control = "public, max-age=0, must-revalidate"
  content_type  = "text/html"
}

resource "null_resource" "assets" {
  depends_on = ["null_resource.dist"]

  triggers {
    githash = "${data.external.githash.result["githash"]}"
  }

  # Sync whole directory to S3
  provisioner "local-exec" {
    command = "${path.module}/sync.sh"

    environment {
      DIRECTORY = "${local.target}/dist"
      BUCKET    = "${aws_s3_bucket.www.bucket}"
    }
  }
}

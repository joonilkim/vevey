locals {
  target     = "${path.root}/../pkg/web"
  dist_zip   = "dist.zip"
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

# Unzip
resource "null_resource" "unzip" {
  triggers {
    hash = "${base64sha256(file("${local.target}/${local.dist_zip}"))}"
  }

  provisioner "local-exec" {
    command     = "make dist"
    working_dir = "${local.target}"
  }
}

resource "aws_s3_bucket_object" "index" {
  depends_on = ["null_resource.unzip"]

  bucket        = "${aws_s3_bucket.www.bucket}"
  key           = "index.html"
  source        = "${local.target}/dist/index.html"
  acl           = "private"
  cache_control = "public, max-age=0, must-revalidate"
  content_type  = "text/html"
}

resource "null_resource" "assets" {
  depends_on = ["null_resource.unzip"]

  triggers {
    hash = "${base64sha256(file("${local.target}/${local.dist_zip}"))}"
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

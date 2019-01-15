module "api" {
  source = "./api"

  domain    = "${var.domain}"
  region    = "${var.region}"
  stage     = "${var.stage}"
  s3_bucket = "pkg.${var.domain}"
  s3_key    = "api/lambda.zip"
}

module "api" {
  source    = "../pkg/api/module"

  domain    = "${var.domain}"
  region    = "${var.region}"
  stage     = "${var.stage}"
  s3_bucket = "pkg.${var.domain}"
  s3_key    = "api/lambda.zip"
}

module "web" {
  source    = "../pkg/web/module"

  domain    = "${var.domain}"
  region    = "${var.region}"
  stage     = "${var.stage}"
}

module "api" {
  source = "../pkg/api/module"

  domain    = "${var.domain}"
  region    = "${var.region}"
  stage     = "${var.stage}"
  s3_bucket = "${var.pkg_bucket}"
}

module "web" {
  source = "../pkg/web/module"

  domain    = "${var.domain}"
  region    = "${var.region}"
  stage     = "${var.stage}"
}

module "route" {
  source = "../pkg/route/module"

  domain     = "${var.domain}"
  region     = "${var.region}"
  stage      = "${var.stage}"
  api_id     = "${module.api.rest_api_id}"
  web_bucket = "${module.web.bucket_name}"
  log_bucket = "${var.log_bucket}"
}

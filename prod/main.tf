module "api" {
  source    = "../pkg/api/module"

  domain    = "${var.domain}"
  region    = "${var.region}"
  stage     = "${var.stage}"
  dynamodb_prefix = "${var.dynamodb_prefix}"
}

module "auth" {
  source    = "../pkg/auth/module"

  domain    = "${var.domain}"
  region    = "${var.region}"
  stage     = "${var.stage}"
  apig_name       = "${module.api.apig_name}"
  apig_root_id    = "${module.api.apig_root_id}"
  dynamodb_prefix = "${var.dynamodb_prefix}"
}

module "web" {
  source    = "../pkg/web/module"

  domain    = "${var.domain}"
  region    = "${var.region}"
  stage     = "${var.stage}"
}

module "route" {
  source     = "../pkg/route/module"

  domain     = "${var.domain}"
  region     = "${var.region}"
  stage      = "${var.stage}"
  apig_name  = "${module.api.apig_name}"
  web_bucket = "${module.web.bucket_name}"
  log_bucket = "${var.log_bucket}"
}

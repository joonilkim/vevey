module "api" {
  source    = "../pkg/api/module"

  domain    = "${var.domain}"
  region    = "${var.region}"
  stage     = "${var.stage}"
  apig_name       = "${aws_api_gateway_rest_api._.name}"
  apig_root_id    = "${aws_api_gateway_resource._.id}"
  dynamodb_prefix = "${var.dynamodb_prefix}"
}

module "auth" {
  source    = "../pkg/auth/module"

  domain    = "${var.domain}"
  region    = "${var.region}"
  stage     = "${var.stage}"
  apig_name       = "${aws_api_gateway_rest_api._.name}"
  apig_root_id    = "${aws_api_gateway_resource._.id}"
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
  apig_name  = "${aws_api_gateway_rest_api._.name}"
  web_bucket = "${module.web.bucket_name}"
  log_bucket = "${var.log_bucket}"
}

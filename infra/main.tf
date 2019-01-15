module "user" {
  source = "./modules/user"

  domain = "${var.domain}"
}

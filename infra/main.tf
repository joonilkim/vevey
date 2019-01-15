module "user" {
  source = "./modules/user"

  project = "${var.project}"
}

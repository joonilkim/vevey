variable "domain" {
  default = "vevey.co"
}

variable "region" {
  default = "ap-northeast-1"
}

variable "stage" {
  default = "prod"
}

variable "pkg_bucket" {
  default = "pkg.vevey.co"
}

variable "log_bucket" {
  default = "log.vevey.co"
}

variable "dynamodb_prefix" {
  default = "vevey_"
}

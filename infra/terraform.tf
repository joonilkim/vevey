terraform {
  backend "s3" {
    bucket = "vevey-system"
    key    = "terraform.tfstate"
    region = "ap-northeast-1"
  }
}

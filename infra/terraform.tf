terraform {
  backend "s3" {
    bucket = "system.vevey.co"
    key    = "infra.tfstate"
    region = "ap-northeast-1"
  }
}

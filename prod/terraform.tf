terraform {
  backend "s3" {
    bucket = "system.vevey.co"
    key    = "prod.tfstate"
    region = "ap-northeast-1"
  }
}

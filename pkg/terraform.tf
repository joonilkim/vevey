terraform {
  backend "s3" {
    bucket = "pkg.vevey.co"
    key    = "pkg.tfstate"
    region = "ap-northeast-1"
  }
}

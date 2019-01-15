variable "domain" {
  default = "example.co"
}

variable "region" {
  description = "A AWS region"
}

variable "stage" {
  description = "A stage name"
}

variable "s3_bucket" {
  description = "S3 bucket to deploy"
}

variable "s3_key" {
  description = "A package path"
}

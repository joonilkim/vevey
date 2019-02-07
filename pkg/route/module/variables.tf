variable "domain" {
  default = "example.co"
}

variable "region" {
  description = "A AWS region"
}

variable "stage" {
  description = "A stage name"
}

variable "web_bucket" {
  description = "A S3 bucket for /"
}

variable "apig_name" {
  description = "An API Gateway name"
}

variable "log_bucket" {
  description = "A S3 bucket name for Cloudfront logging"
}

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

variable "api_id" {
  description = "An API Gateway id for /api"
}

variable "log_bucket" {
  description = "A S3 bucket name for Cloudfront logging"
}

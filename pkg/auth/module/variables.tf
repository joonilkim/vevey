variable "domain" {
  default = "example.co"
}

variable "region" {
  description = "A AWS region"
}

variable "stage" {
  description = "A stage name"
}

variable "dynamodb_prefix" {
  default = "example_"
}

variable "apig_name" {
  description = "An API Gateway name"
}

variable "apig_root_id" {
  description = "An API Gateway root resource id: /api"
}

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

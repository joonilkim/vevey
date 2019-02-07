output "apig_name" {
  value = "${aws_api_gateway_rest_api._.name}"
}

output "apig_root_id" {
  value = "${aws_api_gateway_resource.root.id}"
}

#!/bin/bash

# @see: https://www.terraform.io/docs/providers/external/data_source.html

set -e

eval "$(jq -r '@sh "DIRECTORY=\(.directory)"')"

# Placeholder for whatever data-fetching logic
GITHASH=`git log --pretty=format:'%H' -n 1 -- ${DIRECTORY}`

# Safely produce a JSON object containing the result value. jq will ensure that
# the value is properly quoted and escaped to produce a valid JSON string.
jq -n --arg githash "$GITHASH" '{"githash":$githash}'

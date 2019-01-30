root = ../..

self = $(shell basename $(shell pwd))
mocha = ${root}/node_modules/.bin/mocha
tsc = ${root}/node_modules/.bin/tsc

test:
	NODE_ENV=test \
	${mocha} -r ts-node/register \
		"src/**/*.spec.{ts,tsx}" --colors

docker-build: $(shell find src) package.json
	docker-compose \
		-f ${root}/support/docker-compose.yml \
		build build

docker-sh:
	docker-compose \
		-f ${root}/support/docker-compose.yml \
		run --rm build bash

package: docker-build
	docker-compose \
		-f ${root}/support/docker-compose.yml \
		run --rm build \
		"cd /build/pkg/${self} && make lambda.zip && mv lambda.zip /repo/pkg/${self}"

lambda.zip: node_modules
	zip -rq $@ package.json dist node_modules

node_modules: compile
	yarn install \
		--prod --frozen-lockfile && \
	rm -rf node_modules/aws-sdk

compile: clean
	@ (yarn install --frozen-lockfile && \
		${tsc} -b .)

clean:
	rm -rf dist

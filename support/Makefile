root = ../..

self    = $(shell basename $(shell pwd))
mocha   = ${root}/node_modules/.bin/mocha
tsc     = ${root}/node_modules/.bin/tsc
nodemon = ${root}/node_modules/.bin/nodemon

test:
	NODE_ENV=test \
	TS_NODE_FILES=true \
	${mocha} --recursive \
		-r ts-node/register \
		"src/**/*.spec.{ts,tsx}" --colors

dev:
	${nodemon} \
		--watch src/**/*.ts \
		--ignore src/**/*.spec.ts \
		--exec "ts-node src/app.local.ts"

docker-build: $(shell find src) package.json ${root}/yarn.lock
	docker-compose \
		-f ${root}/support/docker-compose.yml \
		build build

docker-sh:
	docker-compose \
		-f ${root}/support/docker-compose.yml \
		run --rm build bash

zip: docker-build
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
		${tsc} -b tsconfig.build.json)

deploy:
	test ${function_name} && \
	aws lambda update-function-code \
		--function-name ${function_name} \
		--zip-file fileb://${abspath lambda.zip}\
		--publish

clean:
	rm -rf dist

test:
	NODE_ENV=test \
	mocha -r ts-node/register "src/**/*.spec.{ts,tsx}" --colors

lambda.zip: $(shell find src) package.json yarn.lock
	rm -rf build $@ && mkdir -p build && \
	tsc -p tsconfig.build.json && \
	cp package.json yarn.lock build/ &&  \
	cd build && yarn install --prod && \
	rm -rf yarn.lock node_modules/aws-sdk && \
	zip -rq ../$@ * && \
	cd .. && rm -rf build

deploy: lambda.zip
	test ${function_name} && \
	aws lambda update-function-code \
		--function-name ${function_name} \
		--zip-file fileb://${abspath $<}\
		--publish

clean:
	rm -rf build dist.zip

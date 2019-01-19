test:
	mocha -r ts-node/register "spec/**/*.{ts,tsx}" --colors

lambda.zip: $(shell find src) package.json yarn.lock
	rm -rf build $@ && mkdir -p build && \
	tsc && \
	cp package.json yarn.lock build/ &&  \
	cd build && yarn install --prod && \
	rm -rf yarn.lock node_modules/aws-sdk && \
	zip -rq ../$@ * && \
	cd .. && rm -rf build

deploy: $(abspath lambda.zip)
	aws --region us-east-1 lambda update-function-code \
		--function-name ${function_name} \
		--zip-file fileb://$< \
		--publish

clean:
	rm -rf build lambda.zip

lambda.zip: $(shell find src) package.json yarn.lock
	rm -rf build $@ && mkdir -p build && \
	cp -r --parents $^ build/ &&  \
	mv build/src/* build/ && \
	cd build && yarn install --prod && \
	rm -rf yarn.lock node_modules/aws-sdk __tests__ src && \
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

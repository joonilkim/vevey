dist.zip: src/* package.json yarn.lock
	rm -rf build && \
	mkdir -p build && \
	cp -r $^ build/ && \
	cd build && yarn install --prod && \
	rm -rf yarn.lock node_modules/aws-sdk __tests__ && \
	zip -rq ../$@ * && \
	cd .. && rm -rf build

clean:
	rm -rf build dist.zip

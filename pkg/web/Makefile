dist.zip: index.html
	rm -rf build $@ && mkdir -p build && \
	cp -r $^ build/ && \
	cd build && zip -rq ../$@ * && \
	cd .. && rm -rf build

dist: dist.zip
	rm -rf dist && mkdir -p dist && \
	unzip dist.zip -d dist/

clean:
	rm -rf build dist



run: boid.wasm npm-install
	make -j 2 npm-watch serve



# To build the wasm file (must be in root dir)
boid.wasm:
	GOOS=js GOARCH=wasm go build -C ./boid_stuff/jscanvas/ -o ../../dist/boid.wasm

boid.wat:
	wasm2wat dist/boid.wasm > dist/boid.wat

npm-install:
	npm install

npm-watch: npm-install boid.wasm
	npm run watch

serve:
	python3 -m http.server 8080
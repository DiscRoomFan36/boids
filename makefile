
full_watch: boid.wasm
	make -j 3 npm-watch serve go-watch


boid.wasm:
	GOOS=js GOARCH=wasm go build -C ./boid_stuff/js_go_main/ -o ../../dist/boid.wasm

boid.wat:
	wasm2wat dist/boid.wasm > dist/boid.wat


npm-watch: boid.wasm
	npm install
	npm run watch

serve:
	python3 -m http.server 8080

go-watch:
	GOOS=js GOARCH=wasm nodemon --watch './boid_stuff/**/*.go' --signal SIGTERM -e 'go' --exec 'go build -C ./boid_stuff/js_go_main/ -o ../../dist/boid.wasm'

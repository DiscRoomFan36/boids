# Boid Zoo

Check out the github site thing to see them in action

## Good to note commands

```sh
# NOTE this is currently broken for now. don't currently know of a way to render natively, but you might accept a bunch of ppm's?
# To run go boid code natively (must be in the ./boid directory)
# go build && ./boid

# To build the wasm file (must be in root dir)
GOOS=js GOARCH=wasm go build -C ./boid_stuff/jscanvas/ -o ../../dist/boid.wasm

# wasm to wat
wasm2wat dist/boid.wasm > dist/boid.wat

# To compile and type-check the index.ts file
npm install
npm run watch

# to run the server
python3 -m http.server 8080
```
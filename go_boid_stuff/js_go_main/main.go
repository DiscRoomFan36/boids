//go:build wasm

package main

import (
	"log"
	"syscall/js"
	"time"

	"boidstuff.com/Image"
	"boidstuff.com/boid"
)

var img Image.Image

var boid_sim boid.Boid_simulation

var last_frame_time time.Time

const BOID_FACTOR = 100
const BOID_BOUNDS_WIDTH = 16 * BOID_FACTOR
const BOID_BOUNDS_HEIGHT = 9 * BOID_FACTOR
const NUM_BOIDS = 25

const BOID_SCALE = 2

// Javascript function
//
// Uses reflection to dynamically get the parameters of the simulation
func GetProperties(this js.Value, args []js.Value) any {
	if len(args) != 0 {
		log.Panicf("GetProperties: don't pass anything to this function")
	}

	properties := boid.Get_properties()

	// We have to do this because js.FuncOf() expects this function to return a map to any. (aka a javascript object.)
	properties_to_any := make(map[string]any)
	for k, v := range properties {
		properties_to_any[k] = v
	}
	return properties_to_any
}

// Javascript function
//
// # Uses reflection to dynamically set the parameters of the simulation
//
// TODO this might be slightly stupid... make a method on boid_sim that accepts a map or something.
func SetProperties(this js.Value, args []js.Value) any {
	if len(args) != 1 {
		log.Panicf("SetProperties: please pass in a object with properties to set")
	}

	obj := args[0]
	if obj.Type().String() != "object" {
		log.Panicf("SetProperties: arg is not an object, it is a %v", args[0].Type().String())
	}

	the_map := make(map[string]boid.Boid_Float)
	for _, name := range boid.Get_property_names() {
		value := obj.Get(name)
		if value.IsUndefined() {
			continue
		}

		if value.Type().String() != "number" {
			log.Panicf("SetProperties: property '%v' is not an string, it is a %v", name, value.Type().String())
		}

		the_map[name] = boid.Boid_Float(value.Float())
	}

	if len(the_map) == 0 {
		log.Panicf("SetProperties: Did not set any properties!!\n")
	}

	boid_sim.Set_Properties_with_map(the_map)
	return len(the_map)
}

// Javascript function
//
// USAGE: {Width} {Height} {array}
//
// Will pass back a bunch of pixels, (though array), in [RGBA] format
func GetNextFrame(this js.Value, args []js.Value) any {
	if len(args) != 3 {
		log.Panicf("GetNextFrame: dumb-ass, you gotta pass in specific stuff. check the description of this function")
	}

	width := args[0].Int()
	height := args[1].Int()
	array := args[2]

	// saves space
	if len(img.Buffer) < width*height*Image.NUM_COLOR_COMPONENTS {
		img.Buffer = make([]byte, width*height*Image.NUM_COLOR_COMPONENTS)
	}
	img.Width = width
	img.Height = height

	// TODO theres a bug here if you full screen a window...

	// Cool boid thing that makes the boid follow the screen
	// TODO maybe remove until later.
	boid_sim.Width = boid.Boid_Float(width) * BOID_SCALE
	boid_sim.Height = boid.Boid_Float(height) * BOID_SCALE

	// TODO accept dt maybe
	new_frame_time := time.Now()
	dt := new_frame_time.Sub(last_frame_time).Seconds()
	last_frame_time = new_frame_time

	// Clamp dt to something reasonable.
	const REASONABLE_DT = 0.3
	dt = min(dt, REASONABLE_DT)

	// Calculate the next frame of boids
	// Times 60 because we want this to run at 60fps and dt=1 is supposed to be one time step
	// TODO ^ this comment is dumb, just make it work. '1 time step' is a dumb unit, just use m/s
	boid_sim.Update_boids(dt * 60)

	// this might end up taking the most amount of time.
	// TODO make a 'Draw a thing' file. (maybe in this module, stop boid from requiring Image...)
	Draw_boids_into_image(&img, &boid_sim)
	// boid_sim.Draw_Into_Image(&img)

	// copy the pixels
	copied_bytes := js.CopyBytesToJS(array, img.Buffer[:width*height*Image.NUM_COLOR_COMPONENTS])
	return copied_bytes
}

func main() {
	println("Hello From Boid.go")

	// set img to screen size, and shrink
	img = Image.New_image(1920, 1080)
	boid_sim = boid.New_boid_simulation(BOID_BOUNDS_WIDTH, BOID_BOUNDS_HEIGHT, NUM_BOIDS)

	last_frame_time = time.Now()

	js.Global().Set("GetProperties", js.FuncOf(GetProperties))
	js.Global().Set("SetProperties", js.FuncOf(SetProperties))
	js.Global().Set("GetNextFrame", js.FuncOf(GetNextFrame))

	// this stalls the go program, because go has a 'run time' that needs to be aware of everything. bleh
	<-make(chan struct{})
}

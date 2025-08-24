//go:build wasm

package main

import (
	"log"
	"syscall/js"
	"time"
)

var img Image

var boid_sim Boid_simulation

var last_frame_time time.Time

const BOID_FACTOR = 50
const BOID_BOUNDS_WIDTH = 16 * BOID_FACTOR
const BOID_BOUNDS_HEIGHT = 9 * BOID_FACTOR


// Javascript function
//
// Uses reflection to dynamically get the parameters of the simulation
func GetProperties(this js.Value, args []js.Value) any {
	if len(args) != 0 {
		log.Panicf("GetProperties: don't pass anything to this function")
	}

	property_structs := Get_property_structs()

	// We have to do this because js.FuncOf() expects this function to return a map to any. (aka a javascript object.)
	properties_to_any := make(map[string]any)
	for k, v := range property_structs {
		properties_to_any[k] = v.Tag_as_string
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

	the_map := make(map[string]Union_Like)
	for name, prop_struct := range Get_property_structs() {
		value := obj.Get(name)
		if value.IsUndefined() {
			continue
		}

		union := Union_Like{}

		// the .Float() and others will panic is something is not right. Good behavior
		switch prop_struct.Property_type {
		case Property_Float: union.As_float = value.Float()
		case Property_Int:   union.As_int   = value.Int()
		case Property_Bool:  union.As_bool  = value.Bool()

		default: log.Panicf("%v: unknown property in 'SetProperty()'", name)
		}

		the_map[name] = union
	}

	if len(the_map) == 0 {
		log.Panicf("SetProperties: Did not set any properties!!\n")
	}

	boid_sim.Set_Properties_with_map(the_map)
	return len(the_map)
}


func js_to_Vector(obj js.Value) Vec2[Boid_Float] {
	result := Vec2[float64]{
		X: obj.Get("x").Float(),
		Y: obj.Get("y").Float(),
	}
	return Transform[float64, Boid_Float](result)
}


// I feel like go is guilt tripping me with this syntax
var input_status Input_Status


// Javascript function
//
// Will pass back a bunch of pixels, (though array), in [RGBA] format
func GetNextFrame(this js.Value, args []js.Value) any {
	width  := args[0].Get("width").Int()
	height := args[0].Get("height").Int()
	array  := args[0].Get("buffer")

	mouse := args[0].Get("mouse")

	mouse_pos := js_to_Vector(mouse.Get("pos"))
	mouse_pos = World_to_boid_vec(mouse_pos)

	input_status = Update_Input(
		input_status,
		mouse.Get("left_down")  .Bool(),
		mouse.Get("middle_down").Bool(),
		mouse.Get("right_down") .Bool(),
		mouse_pos,
	)

	// saves space
	if len(img.Buffer) < width*height*NUM_COLOR_COMPONENTS {
		img.Buffer = make([]byte, width*height*NUM_COLOR_COMPONENTS)
	}
	img.Width = width
	img.Height = height

	// TODO theres a bug here if you full screen a window...

	// Cool boid thing that makes the boid follow the screen
	// TODO maybe remove until later.
	boid_sim.Width  = World_to_boid(Boid_Float(width))
	boid_sim.Height = World_to_boid(Boid_Float(height))

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
	boid_sim.Update_boids(dt, input_status)

	// this might end up taking the most amount of time.
	// TODO make a 'Draw a thing' file. (maybe in this module, stop boid from requiring Image...)
	Draw_boids_into_image(&img, &boid_sim)

	// copy the pixels, must be in RGBA format
	copied_bytes := js.CopyBytesToJS(array, img.Buffer[:width*height*NUM_COLOR_COMPONENTS])
	return copied_bytes
}

func main() {
	println("Hello From Boid.go")

	// set img to screen size, and shrink
	img = New_image(1920, 1080)
	boid_sim = New_boid_simulation(BOID_BOUNDS_WIDTH, BOID_BOUNDS_HEIGHT)

	last_frame_time = time.Now()

	js.Global().Set("GetProperties", js.FuncOf(GetProperties))
	js.Global().Set("SetProperties", js.FuncOf(SetProperties))
	js.Global().Set("GetNextFrame",  js.FuncOf(GetNextFrame))

	// this stalls the go program, because go has a 'run time' that needs to be aware of everything. bleh
	<-make(chan struct{})
}

//go:build wasm

package main

import (
	"log"
	"syscall/js"
	"time"

	"boidstuff.com/boid"
)

var img Image

var boid_sim boid.Boid_simulation

var last_frame_time time.Time

const BOID_FACTOR = 50
const BOID_BOUNDS_WIDTH = 16 * BOID_FACTOR
const BOID_BOUNDS_HEIGHT = 9 * BOID_FACTOR

const BOID_SCALE = 0.5

// Javascript function
//
// Uses reflection to dynamically get the parameters of the simulation
func GetProperties(this js.Value, args []js.Value) any {
	if len(args) != 0 {
		log.Panicf("GetProperties: don't pass anything to this function")
	}

	property_structs := boid.Get_property_structs()

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

	the_map := make(map[string]boid.Union_Like)
	for name, prop_struct := range boid.Get_property_structs() {
		value := obj.Get(name)
		if value.IsUndefined() {
			continue
		}

		union := boid.Union_Like{}

		// the .Float() and others will panic is something is not right. Good behavior
		switch prop_struct.Property_type {
		case boid.Property_Float: union.As_float = value.Float()
		case boid.Property_Int:   union.As_int   = value.Int()
		case boid.Property_Bool:  union.As_bool  = value.Bool()

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


// I feel like go is guilt tripping me with this syntax
var mouse_pos           boid.Vector2[Boid_Float]
var mouse_status        boid.Mouse_Status

func js_to_Vector(obj js.Value) boid.Vector2[Boid_Float] {
	result := boid.Vector2[float64]{
		X: obj.Get("x").Float(),
		Y: obj.Get("y").Float(),
	}
	return boid.Transform[float64, Boid_Float](result)
}

// Javascript function
//
// Will pass back a bunch of pixels, (though array), in [RGBA] format
func GetNextFrame(this js.Value, args []js.Value) any {
	width := args[0].Get("width").Int()
	height := args[0].Get("height").Int()
	array := args[0].Get("buffer")

	mouse := args[0].Get("mouse")

	mouse_pos = js_to_Vector(mouse.Get("pos"))
	// into boid space
	mouse_pos.Mult(BOID_SCALE)

	new_mouse_flags := boid.Mouse_Flag(0);
	if mouse.Get("left_down")  .Bool() { new_mouse_flags |= boid.Left_down   }
	if mouse.Get("middle_down").Bool() { new_mouse_flags |= boid.Middle_down }
	if mouse.Get("right_down") .Bool() { new_mouse_flags |= boid.Right_down  }

	mouse_status = boid.Get_New_State(mouse_status, new_mouse_flags)

	boid_args := boid.Update_Boid_Arguments{
		Mouse_pos: mouse_pos,
		Mouse_status: mouse_status,
	}


	// saves space
	if len(img.Buffer) < width*height*NUM_COLOR_COMPONENTS {
		img.Buffer = make([]byte, width*height*NUM_COLOR_COMPONENTS)
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
	boid_sim.Update_boids(dt, boid_args)

	// this might end up taking the most amount of time.
	// TODO make a 'Draw a thing' file. (maybe in this module, stop boid from requiring Image...)
	Draw_boids_into_image(&img, &boid_sim)
	// boid_sim.Draw_Into_Image(&img)

	// copy the pixels
	copied_bytes := js.CopyBytesToJS(array, img.Buffer[:width*height*NUM_COLOR_COMPONENTS])
	return copied_bytes
}

func main() {
	println("Hello From Boid.go")

	// set img to screen size, and shrink
	img = New_image(1920, 1080)
	boid_sim = boid.New_boid_simulation(BOID_BOUNDS_WIDTH, BOID_BOUNDS_HEIGHT)

	last_frame_time = time.Now()

	js.Global().Set("GetProperties", js.FuncOf(GetProperties))
	js.Global().Set("SetProperties", js.FuncOf(SetProperties))
	js.Global().Set("GetNextFrame", js.FuncOf(GetNextFrame))

	// this stalls the go program, because go has a 'run time' that needs to be aware of everything. bleh
	<-make(chan struct{})
}

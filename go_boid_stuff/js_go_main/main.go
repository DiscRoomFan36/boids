//go:build wasm

package main

import (
	"fmt"
	"log"
	"reflect"
	"strconv"
	"strings"
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

func parse_property_tag(tag string) (float64, float64, error) {
	result := strings.Split(tag, ";")
	if len(result) != 2 {
		return 0, 0, fmt.Errorf("length of split is %v", len(result))
	}

	min, err := strconv.ParseFloat(result[0], 64)
	if err != nil {
		return 0, 0, err
	}

	max, err := strconv.ParseFloat(result[1], 64)
	if err != nil {
		return 0, 0, err
	}

	if max < min {
		return 0, 0, fmt.Errorf("Max is greater than min")
	}

	return min, max, nil
}

// Javascript function
//
// Uses reflection to dynamically get the parameters of the simulation
func GetProperties(this js.Value, args []js.Value) any {
	if len(args) != 0 {
		return "don't pass anything to this function"
	}

	properties := make(map[string]any)

	s := reflect.ValueOf(&boid_sim).Elem()
	typeOfT := s.Type()
	for i := 0; i < s.NumField(); i++ {
		f := s.Field(i)
		tag := typeOfT.Field(i).Tag.Get("Property")
		if len(tag) == 0 {
			continue
		}
		if !f.CanInterface() {
			log.Panicf("tag that has property cannot be interfaced. %d: %v %v\n", i, typeOfT.Field(i).Name, f.Type())
		}

		fmt.Printf("%d: %s %s = %v\n", i, typeOfT.Field(i).Name, f.Type(), tag)

		// we don't have to do this, because typescript will handle it, but well do it anyway
		min, max, err := parse_property_tag(tag)
		if err != nil {
			log.Panicf("could not parse property %v with error: %v\n", typeOfT.Field(i).Name, err)
		}

		default_tag := typeOfT.Field(i).Tag.Get("Default")
		if len(default_tag) == 0 {
			log.Fatalf("Property %v needs a default\n", typeOfT.Field(i).Name)
		}
		default_value, err := strconv.ParseFloat(default_tag, 64)
		if err != nil {
			log.Fatalf("default value (from %v) could not be parsed into float\n", typeOfT.Field(i).Name)
		}

		fmt.Printf("min %v, max %v, default %v\n", min, max, default_value)

		properties[typeOfT.Field(i).Name] = fmt.Sprintf("%v;%v;%v", min, max, default_value)
	}

	return properties
}

// Javascript function
//
// # Uses reflection to dynamically set the parameters of the simulation
//
// TODO this might be slightly stupid... make a method on boid_sim that accepts a map or something.
func SetProperties(this js.Value, args []js.Value) any {
	if len(args) != 1 {
		return "SetProperties: please pass in a object with properties to set"
	}

	obj := args[0]

	if obj.Type().String() != "object" {
		log.Panicf("SetProperties: arg is not an object, it is a %v", args[0].Type().String())
	}

	properties_set := 0

	s := reflect.ValueOf(&boid_sim).Elem()
	typeOfT := s.Type()
	for i := 0; i < s.NumField(); i++ {
		f := s.Field(i)
		field_name := typeOfT.Field(i).Name
		tag := typeOfT.Field(i).Tag.Get("Property")

		if len(tag) == 0 {
			continue
		}

		value := obj.Get(field_name)
		if value.IsUndefined() {
			fmt.Printf("%v is not in obj\n", field_name)
			continue
		}

		fmt.Printf("%v is in obj\n", field_name)
		if value.Type().String() != "number" {
			log.Panicf("SetProperties: value is not an string, it is a %v", value.Type().String())
		}

		println(value.Float())
		f.SetFloat(value.Float())

		properties_set += 1
	}

	if properties_set == 0 {
		log.Panicf("SetProperties: Did not set any properties!!\n")
	}

	return properties_set
}

// Javascript function
//
// USAGE: {Width} {Height} {array}
//
// Will pass back a bunch of pixels, (though array), in [RGBA] format
func GetNextFrame(this js.Value, args []js.Value) any {
	if len(args) != 3 {
		return "dumb-ass, you gotta pass in specific stuff. check the description of this function"
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

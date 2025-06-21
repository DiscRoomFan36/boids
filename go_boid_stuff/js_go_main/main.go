//go:build wasm

package main

import (
	"log"
	"math/rand"
	"syscall/js"
	"time"

	"boidstuff.com/Image"
	"boidstuff.com/Vector"
	"boidstuff.com/boid"
)

var img Image.Image

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
	boid_sim.Update_boids(dt)

	// this might end up taking the most amount of time.
	// TODO make a 'Draw a thing' file. (maybe in this module, stop boid from requiring Image...)
	Draw_boids_into_image(&img, &boid_sim)
	// boid_sim.Draw_Into_Image(&img)

	{ // test ball stuff
		const PAD = 100

		bounds_xy := Vector.Vector2[Boid_Float]{X: PAD, Y: PAD}
		bounds_wh := Vector.Vector2[Boid_Float]{X: (boid_sim.Width - PAD) / BOID_SCALE, Y: (boid_sim.Height - PAD) / BOID_SCALE}

		bounds_x := bounds_xy.X
		bounds_y := bounds_xy.Y
		bounds_w := bounds_wh.X
		bounds_h := bounds_wh.Y

		ball_r := boid_sim.Boid_Draw_Radius * 5

		// update ball pos
		for i := range NUM_TEST_BALLS {
			ball_pos := &test_balls_pos[i]
			ball_vel := &test_balls_vel[i]

			ball_x := &ball_pos.X
			ball_y := &ball_pos.Y

			ball_vx := &ball_vel.X
			ball_vy := &ball_vel.Y

			ball_vx_dt := *ball_vx * Boid_Float(dt)
			ball_vy_dt := *ball_vy * Boid_Float(dt)

			new_x := *ball_x + ball_vx_dt
			new_y := *ball_y + ball_vy_dt

			// assume previous ball was in bounds
			if new_x - ball_r <= bounds_x {
				if *ball_vx < 0 {
					// flip around the bounce point.
					new_x = bounce_1d(*ball_x, ball_r, ball_vx_dt, bounds_x)

					*ball_vx *= -1
				}
			} else if new_x + ball_r >= bounds_x + bounds_w {
				if *ball_vx > 0 {
					new_x = bounce_1d(*ball_x, ball_r, ball_vx_dt, bounds_x + bounds_w)

					*ball_vx *= -1
				}
			}

			if new_y - ball_r <= bounds_y {
				if *ball_vy < 0 {
					// flip around the bounce point.
					new_y = bounce_1d(*ball_y, ball_r, ball_vy_dt, bounds_y)

					*ball_vy *= -1
				}
			} else if new_y + ball_r >= bounds_y + bounds_h {
				if *ball_vy > 0 {
					new_y = bounce_1d(*ball_y, ball_r, ball_vy_dt, bounds_y + bounds_h)

					*ball_vy *= -1
				}
			}


			test_balls_pos[i].X = new_x
			test_balls_pos[i].Y = new_y
		}

		Image.Draw_Rect(&img, 0, 0, PAD, img.Height, Image.New_Color(0, 0, 255, 255))
		Image.Draw_Rect(&img, 0, 0, img.Width, PAD, Image.New_Color(0, 255, 0, 255))

		Image.Draw_Rect(&img, img.Width-PAD, 0, PAD, img.Height, Image.New_Color(0, 0, 255, 255))
		Image.Draw_Rect(&img, 0, img.Height-PAD, img.Width, PAD, Image.New_Color(0, 255, 0, 255))

		ball_color := Image.New_Color(255, 0, 0, 255)
		for i := range NUM_TEST_BALLS {
			ball := test_balls_pos[i]
			Image.Draw_Circle(&img, int(ball.X), int(ball.Y), int(ball_r), ball_color)
		}
	}

	// copy the pixels
	copied_bytes := js.CopyBytesToJS(array, img.Buffer[:width*height*Image.NUM_COLOR_COMPONENTS])
	return copied_bytes
}

// takes a position, radius, velocity, and a wall position.
func bounce_1d[T Vector.Number](x, r, v, w T) T {
	if v == 0 { return x } // no movement base case.

	// take into account which side the radius applies.
	if v < 0 {
		return 2*w - (x - r + v) + r
	} else {
		return 2*w - (x + r + v) - r
	}
}

const NUM_TEST_BALLS = 25
var test_balls_pos [NUM_TEST_BALLS]Vector.Vector2[Boid_Float]
var test_balls_vel [NUM_TEST_BALLS]Vector.Vector2[Boid_Float]

func main() {
	println("Hello From Boid.go")

	for i := range NUM_TEST_BALLS {
		new_pos := Vector.Make_Vector2(rand.Float32() * BOID_BOUNDS_WIDTH, rand.Float32() * BOID_BOUNDS_HEIGHT)

		test_balls_pos[i] = Vector.Transform[float32, Boid_Float](new_pos)

		test_balls_vel[i] = Vector.Mult(Vector.Random_unit_vector[Boid_Float](), 100)
	}

	// set img to screen size, and shrink
	img = Image.New_image(1920, 1080)
	boid_sim = boid.New_boid_simulation(BOID_BOUNDS_WIDTH, BOID_BOUNDS_HEIGHT)

	last_frame_time = time.Now()

	js.Global().Set("GetProperties", js.FuncOf(GetProperties))
	js.Global().Set("SetProperties", js.FuncOf(SetProperties))
	js.Global().Set("GetNextFrame", js.FuncOf(GetNextFrame))

	// this stalls the go program, because go has a 'run time' that needs to be aware of everything. bleh
	<-make(chan struct{})
}

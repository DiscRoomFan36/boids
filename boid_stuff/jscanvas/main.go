package main

import (
	"syscall/js"
	"time"

	"boidstuff.com/Image"
	"boidstuff.com/boid"
)

var img Image.Image

var boid_sim boid.Boid_simulation[float32]

var last_frame_time time.Time

const BOID_FACTOR = 100
const BOID_BOUNDS_WIDTH = 16 * BOID_FACTOR
const BOID_BOUNDS_HEIGHT = 9 * BOID_FACTOR
const NUM_BOIDS = 5000

const BOID_SCALE = 5

// USAGE: {Width} {Height} {array}
//
// Will pass back a bunch of pixels, (though array), in [RGBA] format
func GetNextFrame() js.Func {
	fun := js.FuncOf(func(this js.Value, args []js.Value) any {
		if len(args) != 3 {
			return "dumb-ass, you gotta pass in specific stuff. check the description of this function"
		}
		// TODO this could work but i think Type() just returns Object. no love for ts
		// if args[0].Type().String() != "Uint8ClampedArray" {
		// 	return "dumb-ass, you gotta pass in an array buffer to this function"
		// }

		width := args[0].Int()
		height := args[1].Int()
		array := args[2]

		// saves space
		if len(img.Buffer) < width*height*4 {
			img.Buffer = make([]byte, width*height*4)
		}
		img.Width = width
		img.Height = height

		// TODO theres a bug here if you full screen a window...

		// Cool boid thing that makes the boid follow the screen
		boid_sim.Width = float32(width) * BOID_SCALE
		boid_sim.Height = float32(height) * BOID_SCALE

		// TODO accept dt maybe
		new_frame_time := time.Now()
		dt := new_frame_time.Sub(last_frame_time).Seconds()
		last_frame_time = new_frame_time

		// Calculate the next frame of boids
		boid_sim.Update_boids(float32(dt) * 60) // Times 60 because we want this to run at 60fps and dt=1 is supposed to be one time step
		// boid_sim.Update_boids(0.1)

		// this might end up taking the most amount of time.
		boid_sim.Draw_Into_Image(&img)

		// copy the pixels
		return js.CopyBytesToJS(array, img.Buffer[:width*height*Image.NUM_COLOR_COMPONENTS])
	})

	return fun
}

func main() {
	println("Hello From Boid.go")

	// set img to some small thing that will grow
	img = Image.New_image(256, 256)
	boid_sim = boid.New_boid_simulation[float32](BOID_BOUNDS_WIDTH, BOID_BOUNDS_HEIGHT, NUM_BOIDS)

	last_frame_time = time.Now()

	js.Global().Set("GetNextFrame", GetNextFrame())

	// this stalls the go program, because go has a 'run time' that needs to be aware of everything. bleh
	<-make(chan struct{})
}

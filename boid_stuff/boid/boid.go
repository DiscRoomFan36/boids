package boid

import (
	"math"
	"math/rand"

	"boidstuff.com/Image"
	"boidstuff.com/Vector"
)

// TODO clean up all of these!
const VISUAL_RANGE = 50
const SEPARATION_MIN_DISTANCE = 15

// TODO change this to be a percent of total boundary size
const BOID_DRAW_RADIUS = 7

const SEPARATION_FACTOR = 0.05
const ALIGNMENT_FACTOR = 0.05
const COHESION_FACTOR = 0.005

const MARGIN = 100
const MARGIN_TURN_FACTOR = 1

const MAX_SPEED = 25
const MIN_SPEED = 5

const BOUNDING = true
const WRAPPING = false

const DEBUG_HEADING = false
const DEBUG_BOUNDARY = true

type Boid[T Vector.Float] struct {
	Position Vector.Vector2[T]
	Velocity Vector.Vector2[T]
}

type Boid_simulation[T Vector.Float] struct {
	Boids         []Boid[T]
	accelerations []Vector.Vector2[T]
	Width, Height T
	// TODO add factors here (Sep, ali, coh, ect...)
}

func New_boid_simulation[T Vector.Float](width, height T, num_boids int) Boid_simulation[T] {
	boid_sim := Boid_simulation[T]{
		Boids:         make([]Boid[T], num_boids),
		accelerations: make([]Vector.Vector2[T], num_boids),
		Width:         width,
		Height:        height,
	}

	for i := range boid_sim.Boids {
		boid_sim.Boids[i].Position = Vector.Vector2[T]{
			X: T(rand.Float32() * float32(boid_sim.Width)),
			Y: T(rand.Float32() * float32(boid_sim.Height)),
		}
		boid_sim.Boids[i].Velocity = Vector.Mult(Vector.Random_unit_vector[T](), 10)
	}

	return boid_sim
}

// TODO: make this return a Vector, so it can also be affected by dt
func (b *Boid[T]) adjust_speed() {
	speed := b.Velocity.Mag()
	if speed > MAX_SPEED {
		b.Velocity.Mult(MAX_SPEED / speed)
	} else if speed < MIN_SPEED {
		b.Velocity.Mult(MIN_SPEED / speed)
	}
}

func (boid_sim Boid_simulation[T]) bounding_force(index int) Vector.Vector2[T] {
	vel := Vector.Vector2[T]{}

	if boid_sim.Boids[index].Position.X < MARGIN {
		vel.X += MARGIN_TURN_FACTOR
	}
	if boid_sim.Boids[index].Position.X > T(boid_sim.Width-MARGIN) {
		vel.X -= MARGIN_TURN_FACTOR
	}

	if boid_sim.Boids[index].Position.Y < MARGIN {
		vel.Y += MARGIN_TURN_FACTOR
	}
	if boid_sim.Boids[index].Position.Y > T(boid_sim.Height-MARGIN) {
		vel.Y -= MARGIN_TURN_FACTOR
	}

	return vel
}

// TODO speed
// NOTE dt is in seconds
func (boid_sim Boid_simulation[T]) Update_boids(dt T) {
	// SOA for the rescue!
	type boid_array[T Vector.Float] struct {
		positions  []Vector.Vector2[T]
		velocities []Vector.Vector2[T]
	}

	close_boids := boid_array[T]{
		positions:  make([]Vector.Vector2[T], 32),
		velocities: make([]Vector.Vector2[T], 32),
	}

	// TODO 1. Add super close boids, and remove them from close into super_close
	// TODO 2. use a smarter algorithm here, like a quad-tree
	get_close_boids := func(i int, my_boid Boid[T]) {
		for j, other_boid := range boid_sim.Boids {
			if i == j {
				continue
			}
			if Vector.DistSqr(my_boid.Position, other_boid.Position) >= VISUAL_RANGE*VISUAL_RANGE {
				continue
			}
			close_boids.positions = append(close_boids.positions, other_boid.Position)
			close_boids.velocities = append(close_boids.velocities, other_boid.Velocity)
		}
	}

	for i, my_boid := range boid_sim.Boids {
		// find the boids in range
		close_boids.positions = close_boids.positions[:0]   // clear the slice, mem optimize
		close_boids.velocities = close_boids.velocities[:0] // clear the slice, mem optimize
		get_close_boids(i, my_boid)

		// Separation
		move := Vector.Vector2[T]{}
		// Alignment
		avg_vel := Vector.Add(Vector.Vector2[T]{}, close_boids.velocities...)
		// Cohesion
		pos_sum := Vector.Add(Vector.Vector2[T]{}, close_boids.positions...)

		for _, pos := range close_boids.positions {
			// TODO hmm, i don't like this branch. maybe move away from all boids in range? but have a falloff
			if Vector.DistSqr(my_boid.Position, pos) < SEPARATION_MIN_DISTANCE*SEPARATION_MIN_DISTANCE {

				// Theory, we can do some smart shit here, even if we need to change the formula
				// move := Vector.Mult(my_boid, num_close)
				// move.Sub(close_boids.positions...)

				move.Add(Vector.Sub(my_boid.Position, pos))
			}
		}

		num_close_boids := len(close_boids.positions)
		if num_close_boids > 0 {
			avg_vel.Mult(1 / T(num_close_boids))
			avg_vel.Sub(my_boid.Velocity)

			pos_sum.Mult(1 / T(num_close_boids))
			pos_sum.Sub(my_boid.Position)
		}

		// TODO refactor so move is sep ect... maybe?
		sep := Vector.Mult(move, SEPARATION_FACTOR)
		align := Vector.Mult(avg_vel, ALIGNMENT_FACTOR)
		coh := Vector.Mult(pos_sum, COHESION_FACTOR)

		// TODO get rid of bounding force function, pull it in
		bounding := Vector.Vector2[T]{}
		if BOUNDING {
			bounding = boid_sim.bounding_force(i)
		}

		// TODO somehow put limiting speed here?

		// NOTE remember to not change accelerations, just assign to it. its got trash in it
		boid_sim.accelerations[i] = Vector.Add(sep, align, coh, bounding)
	}

	// outputs a number from [0, b). ignore the float64. go math module is dumb.
	proper_mod := func(a, b T) T {
		return T(math.Mod(math.Mod(float64(a), float64(b))+float64(b), float64(b)))
	}

	// Now update boids
	for i := 0; i < len(boid_sim.Boids); i++ {
		// this could be better
		boid_sim.Boids[i].Velocity.Add(Vector.Mult(boid_sim.accelerations[i], dt))

		// TODO make this cleaner somehow, do we even have to limit speed?
		boid_sim.Boids[i].adjust_speed()

		boid_sim.Boids[i].Position.Add(Vector.Mult(boid_sim.Boids[i].Velocity, dt))

		// makes them wrap around the screen
		if WRAPPING {
			boid_sim.Boids[i].Position.X = proper_mod(boid_sim.Boids[i].Position.X, boid_sim.Width)
			boid_sim.Boids[i].Position.Y = proper_mod(boid_sim.Boids[i].Position.Y, boid_sim.Height)
		}
	}
}

// TODO HSL colors
var boid_heading_color = Image.Color{R: 10, G: 240, B: 10, A: 255}
var boid_boundary_color = Image.Color{R: 240, G: 240, B: 240, A: 255}

// TODO have some sort of view mode here, so we can 'move' the 'camera'
func (boid_sim Boid_simulation[T]) Draw_Into_Image(img *Image.Image) {
	img.Clear_background(Image.Color{R: 24, G: 24, B: 24, A: 255})

	// we map the world-space to match the image space
	scale_factor := T(img.Width) / boid_sim.Width

	if DEBUG_BOUNDARY {
		margin := int(MARGIN * scale_factor)
		boundary_points := [4]Vector.Vector2[int]{
			{X: margin, Y: margin},
			{X: img.Width - margin, Y: margin},
			{X: img.Width - margin, Y: img.Height - margin},
			{X: margin, Y: img.Height - margin},
		}

		for i := 0; i < len(boundary_points); i++ {
			Image.Draw_Line(img, boundary_points[i], boundary_points[(i+1)%len(boundary_points)], boid_boundary_color)
		}
	}

	// NOTE i would put this in a go routine, but wasm doesn't do multithreading, fuck
	for _, b := range boid_sim.Boids {
		// img.Draw_Circle(int(b.Position.X*scale_factor), int(b.Position.Y*scale_factor), BOID_DRAW_RADIUS, boid_color2)

		// put them in img space
		b.Position.Mult(scale_factor)

		// Draw boid body
		boid_shape := [4]Vector.Vector2[T]{
			{X: 0, Y: 1},      // tip
			{X: 0, Y: -0.5},   // back
			{X: 1, Y: -0.75},  // wing1
			{X: -1, Y: -0.75}, // wing2
		}

		// Rotate to face them in the right direction
		theta := Vector.GetTheta(b.Velocity)
		// TODO i don't think the wings are rotating right. hmmm
		for i := 0; i < len(boid_shape); i++ {
			// someone who knows math explain this
			to_rotate := theta + math.Pi
			if b.Velocity.Y > 0 {
				to_rotate = -theta
			}
			boid_shape[i].Rotate(to_rotate)

			boid_shape[i].Mult(BOID_DRAW_RADIUS * scale_factor)
			boid_shape[i].Add(b.Position)
		}

		// get cool color for boid

		// [0, 1]
		speed := b.Velocity.Mag() / MAX_SPEED

		// TODO HSL
		boid_color := Image.Color{
			R: uint8(Vector.Round(speed * 255)),
			// G: uint8(Vector.Round(speed * 255)),
			G: 240,
			// B: uint8(Vector.Round(speed * 255)),
			B: uint8(Vector.Round((1 - speed) * 255)),
			A: 255,
		}

		// Draw both sides
		Image.Draw_Triangle(img, boid_shape[0], boid_shape[1], boid_shape[2], boid_color)
		Image.Draw_Triangle(img, boid_shape[0], boid_shape[1], boid_shape[3], boid_color)

		if DEBUG_HEADING {
			// Draw heading line
			where_boid_will_be := Vector.Add(b.Position, b.Velocity)
			Image.Draw_Line(img, b.Position, where_boid_will_be, boid_heading_color)
		}
	}
}

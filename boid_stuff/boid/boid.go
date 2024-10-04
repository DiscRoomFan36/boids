package boid

import (
	"math"
	"math/rand"

	"boidstuff.com/Image"
	quadtree "boidstuff.com/Quadtree"
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
const WRAPPING = true

const DEBUG_HEADING = false
const DEBUG_BOUNDARY = true

type Boid[T Vector.Float] struct {
	Position Vector.Vector2[T]
	Velocity Vector.Vector2[T]
}

// SOA for the rescue!
// TODO SOA the vectors too? yes, but after quad tree
type boid_array[T Vector.Float] struct {
	positions  []Vector.Vector2[T]
	velocities []Vector.Vector2[T]
}

type Boid_simulation[T Vector.Float] struct {
	Boids []Boid[T]

	Width, Height T
	// TODO add factors here (Sep, ali, coh, ect...)

	// Working Areas
	accelerations         []Vector.Vector2[T]
	close_boids           boid_array[T]
	super_close_positions []Vector.Vector2[T]

	quadtree quadtree.Quadtree[T]
}

const INITIAL_ARRAY_SIZE = 32

func New_boid_simulation[T Vector.Float](width, height T, num_boids int) Boid_simulation[T] {
	boid_sim := Boid_simulation[T]{
		Boids: make([]Boid[T], num_boids),

		Width:  width,
		Height: height,

		accelerations: make([]Vector.Vector2[T], num_boids),
		close_boids: boid_array[T]{
			positions:  make([]Vector.Vector2[T], INITIAL_ARRAY_SIZE),
			velocities: make([]Vector.Vector2[T], INITIAL_ARRAY_SIZE),
		},
		super_close_positions: make([]Vector.Vector2[T], INITIAL_ARRAY_SIZE),

		// quadtree: quadtree.Quadtree[T]{},
		quadtree: quadtree.New_quadtree(quadtree.Axis_aligned_bb[T]{
			Bottom_left: Vector.Vector2[T]{},
			Dim:         max(width, height),
		}),
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

func (boid_sim *Boid_simulation[T]) set_up_quadtree() {
	boid_sim.quadtree.Clear()
	// TODO set bounding box better, to combat oob boids
	for _, b := range boid_sim.Boids {
		// res := boid_sim.quadtree.Insert(b.Position)
		boid_sim.quadtree.Insert(b.Position)
		// if !res {
		// 	fmt.Printf("boid out of bounds %v\n", b.Position)
		// 	log.Fatalf("boid out of bounds %v\n", b.Position)
		// }
	}
}

// NOTE 56.6% of run time is here. wow
// TODO 2. use a smarter algorithm here, like a quad-tree
func (boid_sim *Boid_simulation[T]) set_close_boids(index int) {

	my_boid_pos := boid_sim.Boids[index].Position
	cur_boid_bound := quadtree.Circle_To_AABB(my_boid_pos, VISUAL_RANGE)

	bounded_boids_indexes := boid_sim.quadtree.QueryRange(cur_boid_bound)

	// fmt.Printf("my_boid: %v, boid_bound %v, bounded_boids %v\n", my_boid_pos, cur_boid_bound, bounded_boids_indexes)

	// clear the slices, mem optimize
	boid_sim.close_boids.positions = boid_sim.close_boids.positions[:0]
	boid_sim.close_boids.velocities = boid_sim.close_boids.velocities[:0]

	boid_sim.super_close_positions = boid_sim.super_close_positions[:0]

	// this is possible if your out of bounds
	// if len(bounded_boids_indexes) == 0 {
	// 	log.Fatalf("that isn't possible, you must get yourself at least. %v\n", boid_sim.quadtree)
	// }

	for _, other_boid_index := range bounded_boids_indexes {
		// if your comparing the boid to itself
		if index == other_boid_index {
			continue
		}

		other_boid := boid_sim.Boids[other_boid_index]
		// }

		// for j, other_boid := range boid_sim.Boids {
		// 	if index == j {
		// 		continue
		// 	}

		dist_sqr := Vector.DistSqr(my_boid_pos, other_boid.Position)

		if dist_sqr >= VISUAL_RANGE*VISUAL_RANGE {
			continue
		}

		// super close boids get treated differently
		if dist_sqr < SEPARATION_MIN_DISTANCE*SEPARATION_MIN_DISTANCE {
			boid_sim.super_close_positions = append(boid_sim.super_close_positions, other_boid.Position)
		} else {
			boid_sim.close_boids.positions = append(boid_sim.close_boids.positions, other_boid.Position)
			boid_sim.close_boids.velocities = append(boid_sim.close_boids.velocities, other_boid.Velocity)
		}
	}
}

// TODO speed
// NOTE dt is in seconds
func (boid_sim *Boid_simulation[T]) Update_boids(dt T) {
	boid_sim.set_up_quadtree()
	for i, my_boid := range boid_sim.Boids {
		// find the boids in range
		boid_sim.set_close_boids(i)

		// Separation
		// NOTE this is the same as move += (my_boid-pos) for all super_close_boids
		move := Vector.Mult(my_boid.Position, T(len(boid_sim.super_close_positions)))
		move.Sub(boid_sim.super_close_positions...)

		// Alignment
		avg_vel := Vector.Add(Vector.Vector2[T]{}, boid_sim.close_boids.velocities...)
		// Cohesion
		pos_sum := Vector.Add(Vector.Vector2[T]{}, boid_sim.close_boids.positions...)

		num_close_boids := len(boid_sim.close_boids.positions)
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
		// TODO maybe some LOD shit, where its just a triangle? 2x speed?
		boid_shape := [4]Vector.Vector2[T]{
			{X: 0, Y: 1},      // tip
			{X: 0, Y: -0.5},   // back
			{X: 1, Y: -0.75},  // wing1
			{X: -1, Y: -0.75}, // wing2
		}

		// Rotate to face them in the right direction
		theta := Vector.GetTheta(b.Velocity)
		// TODO i don't think the wings are rotating right. hmmm
		// TODO i also think this is slowing us down, put in own function
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

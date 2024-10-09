package boid

import (
	"fmt"
	"math"
	"math/rand"

	"boidstuff.com/Image"
	quadtree "boidstuff.com/Quadtree"
	"boidstuff.com/Vector"
)

// TODO clean up all of these!
const SEPARATION_FACTOR = 0.05
const ALIGNMENT_FACTOR = 0.05
const COHESION_FACTOR = 0.005

const MARGIN = 100
const MARGIN_TURN_FACTOR = 0.4

const BOUNDING = true
const WRAPPING = false

const DEBUG_HEADING = false
const DEBUG_BOUNDARY = true
const DEBUG_QUADTREE = false

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

	// Properties
	// TODO Set defaults based on tags, and also inform typescript
	Visual_Range            T `Property:"1-100"`
	Separation_Min_Distance T `Property:"0-50"`

	Max_Speed T `Property:"1-50"`
	Min_Speed T `Property:"0-25"`

	Boid_Draw_Radius T `Property:"0-20"`

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

		// Properties, (TODO make a note about not using constants)
		Visual_Range:            50,
		Separation_Min_Distance: 20,

		Max_Speed: 25,
		Min_Speed: 5,

		Boid_Draw_Radius: 7,

		accelerations: make([]Vector.Vector2[T], num_boids),
		close_boids: boid_array[T]{
			positions:  make([]Vector.Vector2[T], 0, INITIAL_ARRAY_SIZE),
			velocities: make([]Vector.Vector2[T], 0, INITIAL_ARRAY_SIZE),
		},
		super_close_positions: make([]Vector.Vector2[T], 0, INITIAL_ARRAY_SIZE),

		// quadtree: quadtree.Quadtree[T]{},
		quadtree: quadtree.New_quadtree[T](),
	}

	for i := range boid_sim.Boids {
		boid_sim.Boids[i].Position = Vector.Make_Vector2(
			T(rand.Float32()*float32(boid_sim.Width)),
			T(rand.Float32()*float32(boid_sim.Height)),
		)
		boid_sim.Boids[i].Velocity = Vector.Mult(Vector.Random_unit_vector[T](), 10)
	}

	return boid_sim
}

// TODO: make this return a Vector, so it can also be affected by dt
func (boid_sim *Boid_simulation[T]) adjust_speed(b *Boid[T]) {
	// func (b *Boid[T]) adjust_speed() {
	speed := b.Velocity.Mag()
	if speed > boid_sim.Max_Speed {
		b.Velocity.Mult(boid_sim.Max_Speed / speed)
	} else if speed < boid_sim.Min_Speed {
		b.Velocity.Mult(boid_sim.Min_Speed / speed)
	}
}

func (boid_sim Boid_simulation[T]) bounding_force(index int) Vector.Vector2[T] {
	vel := Vector.Vector2[T]{}

	if boid_sim.Boids[index].Position.X < MARGIN {
		vel.X += 1
	}
	if boid_sim.Boids[index].Position.X > T(boid_sim.Width-MARGIN) {
		vel.X -= 1
	}

	if boid_sim.Boids[index].Position.Y < MARGIN {
		vel.Y += 1
	}
	if boid_sim.Boids[index].Position.Y > T(boid_sim.Height-MARGIN) {
		vel.Y -= 1
	}

	return vel
}

func (boid_sim *Boid_simulation[T]) set_up_quadtree() {
	// TODO shouldn't need to call this. just get setup to do what you want
	boid_sim.quadtree.Clear()

	// TODO make this just how we store boid positions
	boid_positions := make([]Vector.Vector2[T], 0, len(boid_sim.Boids))
	for _, b := range boid_sim.Boids {
		boid_positions = append(boid_positions, b.Position)
	}

	num_bad_boids := boid_sim.quadtree.Setup_tree(boid_positions)
	if num_bad_boids > 0 {
		// NOTE im actually fine with this, in this case, one frame where one boid didn't see its neighbors? im fine with that
		// But NOTE Fucking this, i 100% could fix these fuckers, by making a "bad_boid_array" to store them in to check, id end back up in n^2 territory, but its not about the speed. its about sending a message
		fmt.Printf("boids slipped though the cracks num %v\n", num_bad_boids)
	}
}

// TODO make a thing in the quad tree that dose some of the circle detection for us
func (boid_sim *Boid_simulation[T]) set_close_boids(index int) {

	my_boid_pos := boid_sim.Boids[index].Position
	cur_boid_bound := quadtree.Circle_To_Rectangle(my_boid_pos, boid_sim.Visual_Range)

	bounded_boids_indexes := boid_sim.quadtree.QueryRange(cur_boid_bound)

	// clear the slices, mem optimize
	boid_sim.close_boids.positions = boid_sim.close_boids.positions[:0]
	boid_sim.close_boids.velocities = boid_sim.close_boids.velocities[:0]

	boid_sim.super_close_positions = boid_sim.super_close_positions[:0]

	for _, other_boid_index := range bounded_boids_indexes {
		// if your comparing the boid to itself
		if index == int(other_boid_index) {
			continue
		}

		other_boid := boid_sim.Boids[other_boid_index]

		dist_sqr := Vector.DistSqr(my_boid_pos, other_boid.Position)

		if dist_sqr >= boid_sim.Visual_Range*boid_sim.Visual_Range {
			continue
		}

		// super close boids get treated differently
		if dist_sqr < boid_sim.Separation_Min_Distance*boid_sim.Separation_Min_Distance {
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

	for i := range boid_sim.quadtree.Traverse() {
		my_boid := boid_sim.Boids[i]

		// for i, my_boid := range boid_sim.Boids {
		// find the boids in range
		boid_sim.set_close_boids(int(i))

		// Separation
		// NOTE this is the same as move += (my_boid-pos) for all super_close_boids
		move := Vector.Vector2[T]{}
		// move := Vector.Mult(my_boid.Position, T(len(boid_sim.super_close_positions)))
		// move.Sub(boid_sim.super_close_positions...)
		for _, other_pos := range boid_sim.super_close_positions {
			move.Add(Vector.Sub(my_boid.Position, other_pos))
		}

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
			bounding = Vector.Mult(boid_sim.bounding_force(int(i)), MARGIN_TURN_FACTOR)
		}

		// NOTE remember to not change accelerations, just assign to it. its got trash in it
		// TODO somehow put limiting speed here?
		boid_sim.accelerations[i] = Vector.Add(sep, align, coh, bounding)

		// OTHER Additions

		// TODO add noise instead
		// const WOBBLE_FACTOR = 0.01
		// wobble := Vector.Mult(Vector.Random_unit_vector[T](), WOBBLE_FACTOR)

		// just move some of them in different directions, semi randomly
		const RANDOM_DRAW_FACTOR = 0.01
		random_draw := Vector.Vector2[T]{}
		if i%3 == 0 {
			random_draw.X += 1
		} else if i%3 == 1 {
			random_draw.X -= 1
			// draw.Y += 1
		}
		random_draw.Mult(RANDOM_DRAW_FACTOR)
		boid_sim.accelerations[i].Add(random_draw)

		const CENTER_DRAW_FACTOR = 0.1
		center := Vector.Make_Vector2(boid_sim.Width/2, boid_sim.Height/2)
		if Vector.Dist(my_boid.Position, center) > min(boid_sim.Width, boid_sim.Height)/5 {
			center_pointer := Vector.Normalized(Vector.Sub(center, my_boid.Position))
			center_draw := Vector.Mult(center_pointer, CENTER_DRAW_FACTOR)

			boid_sim.accelerations[i].Add(center_draw)
		}

		wind := Vector.Make_Vector2[T](-0.05, -0.05)
		boid_sim.accelerations[i].Add(wind)

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
		boid_sim.adjust_speed(&boid_sim.Boids[i])
		// boid_sim.Boids[i].adjust_speed()

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

	if DEBUG_QUADTREE {
		boid_sim.set_up_quadtree() // so our visualization is accurate
		quadtree.Draw_quadtree_onto(boid_sim.quadtree, img, scale_factor)
	}

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
		to_rotate := theta + math.Pi
		if b.Velocity.Y > 0 {
			to_rotate = -theta
		}
		// TODO i also think this is slowing us down, put in own function
		for i := 0; i < len(boid_shape); i++ {
			// someone who knows math explain this
			boid_shape[i].Rotate(to_rotate)

			boid_shape[i].Mult(boid_sim.Boid_Draw_Radius * scale_factor)
			boid_shape[i].Add(b.Position)
		}

		// get cool color for boid

		speed := b.Velocity.Mag() / boid_sim.Max_Speed

		clamp := func(x, mini, maxi T) T {
			return max(mini, min(x, maxi))
		}

		const SHIFT_FACTOR = 2
		H := math.Mod(float64(clamp(speed, 0, 1)*360)*SHIFT_FACTOR, 360)

		boid_color := Image.HSL_to_RGB(H, 0.75, 0.6)

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

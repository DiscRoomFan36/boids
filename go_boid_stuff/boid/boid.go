package boid

import (
	"fmt"
	"math"
	"math/rand"

	spacialarray "boidstuff.com/Spacial_Array"
	"boidstuff.com/Vector"
)

// TODO put these into the boid_sim as well.
const BOUNDING = true
const WRAPPING = true

const NUM_RANDOM_GENERATORS = 32

type Boid_Float float32

type Boid struct {
	Position Vector.Vector2[Boid_Float]
	Velocity Vector.Vector2[Boid_Float]
}

type Boid_simulation struct {
	Boids []Boid

	Width, Height Boid_Float

	// Working Area
	Accelerations []Vector.Vector2[Boid_Float]

	// for fast proximity detection.
	Spacial_array spacialarray.Spacial_Array[Boid_Float]

	// used for random draw forces
	generators [NUM_RANDOM_GENERATORS]Random_Generator

	// ---------------------------------------------
	// Properties, in rough order of when their used
	// ---------------------------------------------

	Visual_Range            Boid_Float `Property:"1;25" Default:"15"`
	Separation_Min_Distance Boid_Float `Property:"0;20" Default:"8.5"`

	Separation_Factor Boid_Float `Property:"0;1" Default:"0.15"`
	Alignment_Factor  Boid_Float `Property:"0;1" Default:"0.15"`
	Cohesion_Factor   Boid_Float `Property:"0;1" Default:"0.015"`

	Margin             Boid_Float `Property:"0;1000" Default:"50"`
	Margin_Turn_Factor Boid_Float `Property:"0;1000" Default:"4"`

	Random_Draw_Factor        Boid_Float `Property:"0;10" Default:"2"`
	Random_Draw_Time_Dilation Boid_Float `Property:"1;10" Default:"2"`

	Center_Draw_Radius_Div Boid_Float `Property:"0;10" Default:"3"`
	Center_Draw_Factor     Boid_Float `Property:"0;10" Default:"1"`

	Wind_X_Factor Boid_Float `Property:"-10;10" Default:"0"`
	Wind_Y_Factor Boid_Float `Property:"-10;10" Default:"0"`

	Final_Acceleration_Boost Boid_Float `Property:"1;25" Default:"5"`
	Final_Drag_Coefficient   Boid_Float `Property:"0;2" Default:"1"`

	Max_Speed Boid_Float `Property:"1;500" Default:"100"`
	Min_Speed Boid_Float `Property:"1;50" Default:"10"`

	Boid_Draw_Radius Boid_Float `Property:"0;10" Default:"2.5"`
}

const INITIAL_ARRAY_SIZE = 32

func New_boid_simulation(width, height Boid_Float, num_boids int) Boid_simulation {
	boid_sim := Boid_simulation{
		Boids: make([]Boid, num_boids),

		Width:  width,
		Height: height,

		Accelerations: make([]Vector.Vector2[Boid_Float], num_boids),

		Spacial_array: spacialarray.New_Spacial_Array[Boid_Float](),
	}

	set_boid_defaults(&boid_sim)

	for i := range boid_sim.Boids {
		boid_sim.Boids[i].Position = Vector.Make_Vector2(
			Boid_Float(rand.Float32()*float32(boid_sim.Width)),
			Boid_Float(rand.Float32()*float32(boid_sim.Height)),
		)
		boid_sim.Boids[i].Velocity = Vector.Mult(Vector.Random_unit_vector[Boid_Float](), 10)
	}

	for i := range NUM_RANDOM_GENERATORS {
		boid_sim.generators[i] = New_Random_Generator(true)
		// offset the generators a bit.
		// this doesn't have to be random. could just be 'i / NUM_RANDOM_GENERATORS'
		boid_sim.generators[i].t = random_32()
	}

	return boid_sim
}

// TODO: make this return a Vector, so it can also be affected by dt
func (boid_sim *Boid_simulation) adjust_speed(b *Boid) {
	// func (b *Boid[T]) adjust_speed() {
	speed := b.Velocity.Mag()
	if speed > boid_sim.Max_Speed {
		fmt.Printf("boid is faster than max\n")
		b.Velocity.Mult(boid_sim.Max_Speed / speed)
	} else if speed < boid_sim.Min_Speed {
		b.Velocity.Mult(boid_sim.Min_Speed / speed)
	}
}

func (boid_sim Boid_simulation) bounding_force(index int) Vector.Vector2[Boid_Float] {
	vel := Vector.Vector2[Boid_Float]{}

	if boid_sim.Boids[index].Position.X < boid_sim.Margin {
		vel.X += 1
	}
	if boid_sim.Boids[index].Position.X > boid_sim.Width-boid_sim.Margin {
		vel.X -= 1
	}

	if boid_sim.Boids[index].Position.Y < boid_sim.Margin {
		vel.Y += 1
	}
	if boid_sim.Boids[index].Position.Y > boid_sim.Height-boid_sim.Margin {
		vel.Y -= 1
	}

	return vel
}

func (boid_sim *Boid_simulation) Set_up_Spacial_Array() {
	// Clear out previous uses.
	boid_sim.Spacial_array.Clear()

	// TODO make this just how we store boid positions or something.
	boid_positions := make([]Vector.Vector2[Boid_Float], 0, len(boid_sim.Boids))
	for _, b := range boid_sim.Boids {
		boid_positions = append(boid_positions, b.Position)
	}

	boid_sim.Spacial_array.Append_points(boid_positions)
}

// NOTE dt is in seconds
func (boid_sim *Boid_simulation) Update_boids(dt float64) {
	// TODO inline
	boid_sim.Set_up_Spacial_Array()

	// Set the Accelerations to zero.
	for i := range len(boid_sim.Accelerations) {
		boid_sim.Accelerations[i] = Vector.Vector2[Boid_Float]{}
	}

	// ------------------------------------
	//   Separation, Alignment, Cohesion
	// ------------------------------------
	for i := range len(boid_sim.Boids) {
		this_boid := boid_sim.Boids[i]

		// Separation
		sep := Vector.Vector2[Boid_Float]{}
		// Alignment
		align := Vector.Vector2[Boid_Float]{}
		// Cohesion
		coh := Vector.Vector2[Boid_Float]{}

		num_close_boids := 0
		for j, near_pos := range boid_sim.Spacial_array.Iter_Over_Near(this_boid.Position, boid_sim.Visual_Range) {
			num_close_boids += 1

			// if the near guy is super close. move away
			dist_sqr := Vector.DistSqr(this_boid.Position, near_pos)
			sep_min_dist_sqr := square(boid_sim.Separation_Min_Distance)
			if dist_sqr < sep_min_dist_sqr {

				// in percent, how close it is, 0 is same position
				closeness := dist_sqr / sep_min_dist_sqr

				// limit the min distance.
				closeness = max(closeness, 0.00001)
				// the closer the stronger
				force := 1 / closeness

				sep.X += (this_boid.Position.X - near_pos.X) * force
				sep.Y += (this_boid.Position.Y - near_pos.Y) * force
			}

			// make the velocity's match.
			align.Add(boid_sim.Boids[j].Velocity)
			// go to the center of the pack.
			coh.Add(near_pos)
		}

		// divide by number of close boids.
		if num_close_boids > 0 {
			align.SetMag(boid_sim.Max_Speed)
			align.Sub(this_boid.Velocity)
			align.Mult(1 / Boid_Float(num_close_boids))
			align.Sub(this_boid.Velocity)

			coh.Mult(1 / Boid_Float(num_close_boids))
			coh.Sub(this_boid.Position)
			// coh.SetMag(boid_sim.Max_Speed)
			// coh.Sub(this_boid.Velocity)
		}

		sep.Mult(boid_sim.Separation_Factor)
		align.Mult(boid_sim.Alignment_Factor)
		coh.Mult(boid_sim.Cohesion_Factor)

		boid_sim.Accelerations[i].Add(sep, align, coh)
	}

	// ------------------------------------
	//          Bounding forces
	// ------------------------------------
	if BOUNDING {
		for i := range len(boid_sim.Boids) {
			// TODO get rid of bounding force function, pull it in
			bounding := Vector.Mult(boid_sim.bounding_force(i), boid_sim.Margin_Turn_Factor)
			boid_sim.Accelerations[i].Add(bounding)
		}
	}

	// ------------------------------------
	//         Random draw forces
	// ------------------------------------
	{
		// use the generators to generate a random unit vector, smoothly

		// how far to advance the random generator,
		// ..._Time_Dilation == seconds to switch generator.
		time_advance := dt / float64(boid_sim.Random_Draw_Time_Dilation)

		var force_vectors [NUM_RANDOM_GENERATORS]Vector.Vector2[Boid_Float]
		for i := range NUM_RANDOM_GENERATORS {
			random_number := boid_sim.generators[i].Next(float32(time_advance))
			theta := random_number * 2 * math.Pi

			rotated_vector := Vector.Unit_Vector_With_Rotation(Boid_Float(theta))
			rotated_vector.Mult(boid_sim.Random_Draw_Factor)

			force_vectors[i] = rotated_vector
		}

		// apply forces to groups.
		for i := range len(boid_sim.Boids) {
			// for all intense and purposes, this is random to the viewer.
			force := force_vectors[i%NUM_RANDOM_GENERATORS]
			boid_sim.Accelerations[i].X += force.X
			boid_sim.Accelerations[i].Y += force.Y
		}
	}

	// ------------------------------------
	//         Center draw forces
	// ------------------------------------
	if boid_sim.Center_Draw_Factor != 0 && boid_sim.Center_Draw_Radius_Div != 0 {
		for i := range len(boid_sim.Boids) {
			this_boid := boid_sim.Boids[i]

			// center of the simulation
			center := Vector.Make_Vector2(boid_sim.Width/2, boid_sim.Height/2)

			// if they in in this circle, don't be drawn into the center.
			min_radius := min(boid_sim.Width, boid_sim.Height) / boid_sim.Center_Draw_Radius_Div

			if Vector.DistSqr(this_boid.Position, center) < square(min_radius) {
				continue
			}

			// vector pointing towards the center.
			center_pointer := Vector.Normalized(Vector.Sub(center, this_boid.Position))

			center_draw := Vector.Mult(center_pointer, boid_sim.Center_Draw_Factor)
			boid_sim.Accelerations[i].Add(center_draw)
		}
	}

	// ------------------------------------
	//                 Wind
	// ------------------------------------
	for i := range len(boid_sim.Boids) {
		wind := Vector.Make_Vector2(boid_sim.Wind_X_Factor, boid_sim.Wind_Y_Factor)
		boid_sim.Accelerations[i].Add(wind)
	}

	// ------------------------------------
	//                 Other Ideas
	// ------------------------------------
	// TODO add noise instead
	// const WOBBLE_FACTOR = 0.01
	// wobble := Vector.Mult(Vector.Random_unit_vector[T](), WOBBLE_FACTOR)

	// ------------------------------------
	//   Update positions and velocities
	// ------------------------------------
	time := Boid_Float(dt)
	for i := 0; i < len(boid_sim.Boids); i++ {

		// Handmade Hero Day 043 - The Equations of Motion: https://www.youtube.com/watch?v=LoTRzRFEk5I

		p0 := boid_sim.Boids[i].Position
		v0 := boid_sim.Boids[i].Velocity
		a := boid_sim.Accelerations[i]

		a.Mult(boid_sim.Final_Acceleration_Boost)
		// just the negative velocity for drag, must be after the final acceleration boost.
		// this stops things from getting to out of hand.
		drag := Vector.Mult(v0, -boid_sim.Final_Drag_Coefficient)
		a.Add(drag)

		// p1 = (1/2)*a*t^2 + v0*t + p0
		p1 := Vector.Add(Vector.Mult(a, 0.5*square(time)), Vector.Mult(v0, time), p0)
		// v1 = a*t + v0
		v1 := Vector.Add(Vector.Mult(a, time), v0)

		// adjust the velocity
		// TODO do we even have to limit speed? drag dose that for us.
		boid_sim.adjust_speed(&boid_sim.Boids[i])

		boid_sim.Boids[i].Position = p1
		boid_sim.Boids[i].Velocity = v1

		// makes them wrap around the screen
		if WRAPPING {
			boid_sim.Boids[i].Position.X = proper_mod(boid_sim.Boids[i].Position.X, boid_sim.Width)
			boid_sim.Boids[i].Position.Y = proper_mod(boid_sim.Boids[i].Position.Y, boid_sim.Height)
		}
	}
}

// outputs a number from [0, b). ignore the float64. go math module is dumb.
func proper_mod[T Vector.Float](a, b T) T {
	return T(math.Mod(math.Mod(float64(a), float64(b))+float64(b), float64(b)))
}

func square[T Vector.Number](x T) T {
	return x * x
}

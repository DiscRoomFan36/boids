package boid

import (
	"math"
	"math/rand"

	spacialarray "boidstuff.com/Spacial_Array"
	"boidstuff.com/Vector"
)

// TODO put these into the boid_sim as well.
const BOUNDING = true
const WRAPPING = false

type Boid_Float float32

type Boid struct {
	Position Vector.Vector2[Boid_Float]
	Velocity Vector.Vector2[Boid_Float]
}

type Boid_simulation struct {
	Boids []Boid

	Width, Height Boid_Float

	// Properties, in rough order of when their used

	Visual_Range            Boid_Float `Property:"1;100" Default:"50"`
	Separation_Min_Distance Boid_Float `Property:"0;50" Default:"20"`

	Separation_Factor Boid_Float `Property:"0;1" Default:"0.05"`
	Alignment_Factor  Boid_Float `Property:"0;1" Default:"0.05"`
	Cohesion_Factor   Boid_Float `Property:"0;1" Default:"0.005"`

	Margin             Boid_Float `Property:"0;1000" Default:"100"`
	Margin_Turn_Factor Boid_Float `Property:"0;1000" Default:"0.4"`

	Random_Draw_Factor Boid_Float `Property:"0;1" Default:"0.01"`
	Center_Draw_Factor Boid_Float `Property:"0;1" Default:"0.1"`

	Wind_X_Factor Boid_Float `Property:"-1;1" Default:"-0.05"`
	Wind_Y_Factor Boid_Float `Property:"-1;1" Default:"-0.05"`

	Max_Speed Boid_Float `Property:"1;50" Default:"25"`
	Min_Speed Boid_Float `Property:"0;25" Default:"5"`

	Boid_Draw_Radius Boid_Float `Property:"0;50" Default:"50"`

	// Working Areas
	Accelerations []Vector.Vector2[Boid_Float]

	Spacial_array spacialarray.Spacial_Array[Boid_Float]
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

	return boid_sim
}

// TODO: make this return a Vector, so it can also be affected by dt
func (boid_sim *Boid_simulation) adjust_speed(b *Boid) {
	// func (b *Boid[T]) adjust_speed() {
	speed := b.Velocity.Mag()
	if speed > boid_sim.Max_Speed {
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

	// get the new velocities for all the boids
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
			if Vector.DistSqr(this_boid.Position, near_pos) < boid_sim.Separation_Min_Distance*boid_sim.Separation_Min_Distance {
				sep.Add(Vector.Sub(this_boid.Position, near_pos))
			}

			// make the velocity's match.
			align.Add(boid_sim.Boids[j].Velocity)
			// go to the center of the pack.
			coh.Add(near_pos)
		}

		// divide by number of close boids.
		if num_close_boids > 0 {
			align.Mult(1 / Boid_Float(num_close_boids))
			align.Sub(this_boid.Velocity)

			coh.Mult(1 / Boid_Float(num_close_boids))
			coh.Sub(this_boid.Position)
		}

		sep.Mult(boid_sim.Separation_Factor)
		align.Mult(boid_sim.Alignment_Factor)
		coh.Mult(boid_sim.Cohesion_Factor)

		// NOTE this assign clears the trash that was here before.
		boid_sim.Accelerations[i] = Vector.Add(sep, align, coh)

		if BOUNDING {
			// TODO get rid of bounding force function, pull it in
			bounding := Vector.Mult(boid_sim.bounding_force(i), boid_sim.Margin_Turn_Factor)
			boid_sim.Accelerations[i].Add(bounding)
		}

		// TODO somehow put limiting speed around here?

		// OTHER Additions

		// TODO add noise instead
		// const WOBBLE_FACTOR = 0.01
		// wobble := Vector.Mult(Vector.Random_unit_vector[T](), WOBBLE_FACTOR)

		// just move some of them in different directions, semi randomly
		// const RANDOM_DRAW_FACTOR = 0.01
		random_draw := Vector.Vector2[Boid_Float]{}
		if i%3 == 0 {
			random_draw.X += 1
		} else if i%3 == 1 {
			random_draw.X -= 1
			// draw.Y += 1
		}
		random_draw.Mult(boid_sim.Random_Draw_Factor)
		boid_sim.Accelerations[i].Add(random_draw)

		// const CENTER_DRAW_FACTOR = 0.1
		center := Vector.Make_Vector2(boid_sim.Width/2, boid_sim.Height/2)
		if Vector.Dist(this_boid.Position, center) > min(boid_sim.Width, boid_sim.Height)/5 {
			center_pointer := Vector.Normalized(Vector.Sub(center, this_boid.Position))
			center_draw := Vector.Mult(center_pointer, boid_sim.Center_Draw_Factor)

			boid_sim.Accelerations[i].Add(center_draw)
		}

		wind := Vector.Make_Vector2[Boid_Float](boid_sim.Wind_X_Factor, boid_sim.Wind_Y_Factor)
		boid_sim.Accelerations[i].Add(wind)
	}

	// Now update boids
	for i := 0; i < len(boid_sim.Boids); i++ {
		// this could be better
		boid_sim.Boids[i].Velocity.Add(Vector.Mult(boid_sim.Accelerations[i], Boid_Float(dt)))

		// TODO make this cleaner somehow, do we even have to limit speed?
		boid_sim.adjust_speed(&boid_sim.Boids[i])
		// TODO add drag force, cant fo this until dt get set back to a reasonable number
		// boid_sim.Boids[i].Velocity.Mult(0.9)

		// add velocity * dt to position.
		boid_sim.Boids[i].Position.Add(Vector.Mult(boid_sim.Boids[i].Velocity, Boid_Float(dt)))

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

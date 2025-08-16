package boid

import (
	"math"
	"math/rand"
)

const NUM_RANDOM_GENERATORS = 32

type Boid_Float float32

type Rectangle struct {
	x, y, w, h Boid_Float
}

func make_rectangle(x, y, w, h Boid_Float) Rectangle {
	return Rectangle{x: x, y: y, w: w, h: h}
}

func (rect Rectangle) Splat() (Boid_Float, Boid_Float, Boid_Float, Boid_Float) {
	return rect.x, rect.y, rect.w, rect.h
}

type Boid struct {
	Position Vector2[Boid_Float]
	Velocity Vector2[Boid_Float]
	Acceleration Vector2[Boid_Float]
}

type Boid_simulation struct {
	Boids []Boid

	Width, Height Boid_Float

	// for fast proximity detection.
	Spacial_array Spacial_Array[Boid_Float]

	// used for random draw forces
	generators [NUM_RANDOM_GENERATORS]Random_Generator

	// Thing a boid can hit, maybe they can see it as well?
	Walls []Rectangle

	// used to calculate how long until the next boid is spawned / de-spawned
	//
	// should this be a float64 since its about time?
	spawn_timer Boid_Float

	// ---------------------------------------------
	// Properties, in rough order of when their used
	// ---------------------------------------------

	Max_Boids          int `Property:"int" Range:"0;5000" Default:"100"`
	// how many spawn / de-spawn per second.
	Boid_Spawn_Rate    Boid_Float `Property:"float" Range:"10;1000" Default:"100"`

	Visual_Range            Boid_Float `Property:"float" Range:"1;25" Default:"15"`
	Separation_Min_Distance Boid_Float `Property:"float" Range:"0;20" Default:"8.5"`

	Separation_Factor Boid_Float `Property:"float" Range:"0;1" Default:"0.15"`
	Alignment_Factor  Boid_Float `Property:"float" Range:"0;1" Default:"0.15"`
	Cohesion_Factor   Boid_Float `Property:"float" Range:"0;1" Default:"0.015"`

	Margin             Boid_Float `Property:"float" Range:"0;100" Default:"50"`
	Margin_Turn_Factor Boid_Float `Property:"float" Range:"0;20" Default:"4"`

	Random_Draw_Factor        Boid_Float `Property:"float" Range:"0;10" Default:"2"`
	Random_Draw_Time_Dilation Boid_Float `Property:"float" Range:"1;10" Default:"2"`

	Center_Draw_Radius_Div Boid_Float `Property:"float" Range:"0;10" Default:"3"`
	Center_Draw_Factor     Boid_Float `Property:"float" Range:"0;10" Default:"1"`

	Wind_X_Factor Boid_Float `Property:"float" Range:"-10;10" Default:"0"`
	Wind_Y_Factor Boid_Float `Property:"float" Range:"-10;10" Default:"0"`

	Mouse_Draw_Factor Boid_Float `Property:"float" Range:"1;100" Default:"10"`

	Final_Acceleration_Boost Boid_Float `Property:"float" Range:"1;25" Default:"5"`
	Final_Drag_Coefficient   Boid_Float `Property:"float" Range:"0;2" Default:"1"`

	Max_Speed Boid_Float `Property:"float" Range:"1;500" Default:"100"`
	Min_Speed Boid_Float `Property:"float" Range:"1;50" Default:"10"`


	Toggle_Wrapping bool `Property:"bool" Default:"true"`
	Toggle_Bounding bool `Property:"bool" Default:"true"`


	// This doesn't make sense to have here, but it is convenient.
	Boid_Radius Boid_Float `Property:"float" Range:"0;10" Default:"2.5"`
}

func New_boid_simulation(width, height Boid_Float) Boid_simulation {
	boid_sim := Boid_simulation{
		Boids: make([]Boid, 0, 512),

		Width:  width,
		Height: height,

		Spacial_array: New_Spacial_Array[Boid_Float](),

		// just make a temp thing in the middle of the field.
		Walls: make([]Rectangle, 1),

		spawn_timer: 0,
	}

	set_boid_defaults(&boid_sim)

	for i := range NUM_RANDOM_GENERATORS {
		boid_sim.generators[i] = New_Random_Generator(true)
		// offset the generators a bit.
		// this doesn't have to be random. could just be 'i / NUM_RANDOM_GENERATORS'
		boid_sim.generators[i].t = random_32()
	}

	boid_sim.Walls[0] = make_rectangle(width/2-50, height/2-50, 100, 100)

	return boid_sim
}

func (boid_sim *Boid_simulation) adjust_speed(vel Vector2[Boid_Float]) Vector2[Boid_Float] {
	speed := vel.Mag()
	if speed > boid_sim.Max_Speed {
		// we don't really need this now that we have drag
		// fmt.Printf("boid is faster than max\n")
		// vel.Mult(boid_sim.Max_Speed / speed)
	} else if speed < boid_sim.Min_Speed {
		vel.Mult(boid_sim.Min_Speed / speed)
	}

	return vel
}

func (boid_sim Boid_simulation) bounding_force(index int) Vector2[Boid_Float] {
	vel := Vector2[Boid_Float]{}

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


// because go cannot have named arguments.
type Update_Boid_Arguments struct {
	Mouse_pos Vector2[Boid_Float]
	Mouse_status Mouse_Status
}

// NOTE dt is in seconds
func (boid_sim *Boid_simulation) Update_boids(dt float64, args Update_Boid_Arguments) {
	mouse_state := args.Mouse_status.state

	// if Has_Flag(mouse_state, Left_clicked) {
	// 	fmt.Printf("Clicked\n")
	// }

	// put the wall in the center
	boid_sim.Walls[0] = make_rectangle(boid_sim.Width/2-50, boid_sim.Height/2-50, 100, 100)


	{ // spawn / despawn boids.
		// TODO this could maybe do a ramp up / down?
		boid_sim.spawn_timer += Boid_Float(dt)
		time_to_spawn := 1 / boid_sim.Boid_Spawn_Rate

		for boid_sim.spawn_timer >= time_to_spawn {
			boid_sim.spawn_timer -= time_to_spawn

			// check if we even need to add a new boid.
			if len(boid_sim.Boids) == boid_sim.Max_Boids { continue; }

			if len(boid_sim.Boids) < boid_sim.Max_Boids {
				// add 1 boid.

				new_boid := Boid{
					Position: Make_Vector2(
						Boid_Float(rand.Float32()*float32(boid_sim.Width)),
						Boid_Float(rand.Float32()*float32(boid_sim.Height)),
					),
					Velocity: Mult(Random_unit_vector[Boid_Float](), (boid_sim.Min_Speed + boid_sim.Max_Speed) / 2),
				}

				boid_sim.Boids = append(boid_sim.Boids, new_boid)
			} else {
				// remove 1 boid.
				// do it randomly so its cooler.

				random_index := rand.Intn(len(boid_sim.Boids))
				last_index := len(boid_sim.Boids)-1

				// a good old swap and remove, without the swap.
				if random_index != last_index { boid_sim.Boids[random_index] = boid_sim.Boids[last_index] }

				// remove the last element
				boid_sim.Boids = boid_sim.Boids[:last_index]
			}
		}
	}


	{ // Setup the spacial array.
		// Clear out previous uses.
		boid_sim.Spacial_array.Clear()

		// TODO make this just how we store boid positions or something.
		boid_positions := make([]Vector2[Boid_Float], 0, len(boid_sim.Boids))
		for _, b := range boid_sim.Boids {
			boid_positions = append(boid_positions, b.Position)
		}

		boid_sim.Spacial_array.Append_points(boid_positions)
	}

	// Set the Accelerations to zero.
	for i := range len(boid_sim.Boids) {
		boid_sim.Boids[i].Acceleration = Vector2[Boid_Float]{}
	}

	// ------------------------------------
	//   Separation, Alignment, Cohesion
	// ------------------------------------
	for i := range len(boid_sim.Boids) {
		this_boid := boid_sim.Boids[i]

		// Separation
		sep := Vector2[Boid_Float]{}
		// Alignment
		align := Vector2[Boid_Float]{}
		// Cohesion
		coh := Vector2[Boid_Float]{}

		num_close_boids := 0
		for j, near_pos := range boid_sim.Spacial_array.Iter_Over_Near(this_boid.Position, boid_sim.Visual_Range) {
			num_close_boids += 1

			// if the near guy is super close. move away
			dist_sqr := DistSqr(this_boid.Position, near_pos)
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
			// TODO ? what was i doing here?
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

		boid_sim.Boids[i].Acceleration.Add(sep, align, coh)
	}

	// ------------------------------------
	//          Bounding forces
	// ------------------------------------
	if boid_sim.Toggle_Bounding {
		for i := range len(boid_sim.Boids) {
			// TODO get rid of bounding force function, pull it in
			bounding := Mult(boid_sim.bounding_force(i), boid_sim.Margin_Turn_Factor)
			boid_sim.Boids[i].Acceleration.Add(bounding)
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

		var force_vectors [NUM_RANDOM_GENERATORS]Vector2[Boid_Float]
		for i := range NUM_RANDOM_GENERATORS {
			random_number := boid_sim.generators[i].Next(float32(time_advance))
			theta := random_number * 2 * math.Pi

			rotated_vector := Unit_Vector_With_Rotation(Boid_Float(theta))
			rotated_vector.Mult(boid_sim.Random_Draw_Factor)

			force_vectors[i] = rotated_vector
		}

		// apply forces to groups.
		for i := range len(boid_sim.Boids) {
			// for all intense and purposes, this is random to the viewer.
			force := force_vectors[i%NUM_RANDOM_GENERATORS]
			boid_sim.Boids[i].Acceleration.X += force.X
			boid_sim.Boids[i].Acceleration.Y += force.Y
		}
	}

	// ------------------------------------
	//         Center draw forces
	// ------------------------------------
	if boid_sim.Center_Draw_Factor != 0 && boid_sim.Center_Draw_Radius_Div != 0 {
		for i := range len(boid_sim.Boids) {
			this_boid := boid_sim.Boids[i]

			// center of the simulation
			center := Make_Vector2(boid_sim.Width/2, boid_sim.Height/2)

			// if they in in this circle, don't be drawn into the center.
			min_radius := min(boid_sim.Width, boid_sim.Height) / boid_sim.Center_Draw_Radius_Div

			if DistSqr(this_boid.Position, center) < square(min_radius) {
				continue
			}

			// vector pointing towards the center.
			center_pointer := Normalized(Sub(center, this_boid.Position))

			center_draw := Mult(center_pointer, boid_sim.Center_Draw_Factor)
			boid_sim.Boids[i].Acceleration.Add(center_draw)
		}
	}

	// ------------------------------------
	//                 Wind
	// ------------------------------------
	for i := range len(boid_sim.Boids) {
		wind := Make_Vector2(boid_sim.Wind_X_Factor, boid_sim.Wind_Y_Factor)
		boid_sim.Boids[i].Acceleration.Add(wind)
	}


	// ------------------------------------
	//            Mouse stuff
	// ------------------------------------
	// on mouse down, move all boids towards mouse.
	if HasFlag(mouse_state, Left_down) {
		for i := range len(boid_sim.Boids) {
			toward_mouse := Sub(args.Mouse_pos, boid_sim.Boids[i].Position)
			force := Mult(Normalized(toward_mouse), boid_sim.Mouse_Draw_Factor)
			boid_sim.Boids[i].Acceleration.Add(force)
		}
	}


	// ------------------------------------
	//              Other Ideas
	// ------------------------------------
	// TODO add noise instead
	// const WOBBLE_FACTOR = 0.01
	// wobble := Mult(Random_unit_vector[T](), WOBBLE_FACTOR)


	// ----------------------------
	//       And Finally Drag
	// ----------------------------
	for i := range len(boid_sim.Boids) {
		v0 := boid_sim.Boids[i].Velocity
		a := boid_sim.Boids[i].Acceleration

		a.Mult(boid_sim.Final_Acceleration_Boost)
		// just the negative velocity for drag, must be after the final acceleration boost.
		// this stops things from getting to out of hand.
		drag := Mult(v0, -boid_sim.Final_Drag_Coefficient)
		a.Add(drag)

		boid_sim.Boids[i].Acceleration = a
	}

	// ------------------------------------
	//   Update positions and velocities
	// ------------------------------------
	boid_sim.finally_move_and_collide(dt)
}

func (boid_sim *Boid_simulation) finally_move_and_collide(dt float64) {
	// make a bounding box.
	bounds_x1 := boid_sim.Margin
	bounds_x2 := boid_sim.Width  - boid_sim.Margin

	bounds_y1 := boid_sim.Margin
	bounds_y2 := boid_sim.Height - boid_sim.Margin

	boid_radius := boid_sim.Boid_Radius

	time := Boid_Float(dt)
	for i := range len(boid_sim.Boids) {
		boid := &boid_sim.Boids[i]

		// Handmade Hero Day 043 - The Equations of Motion: https://www.youtube.com/watch?v=LoTRzRFEk5I

		p0 := boid.Position
		v0 := boid.Velocity
		a := boid.Acceleration

		// v1 = a*t + v0
		v1 := Add(Mult(a, time), v0)

		// adjust the velocity
		// TODO do we even have to limit speed? drag dose that for us.
		v1 = boid_sim.adjust_speed(v1)

		// a very nice way to calculate displacement.
		// v_avg = (v0 + v1) / 2
		v_avg_x := (v0.X + v1.X) / 2
		v_avg_y := (v0.Y + v1.Y) / 2


		// -------------------------------
		//          Collisions
		// -------------------------------

		vx := v_avg_x * time
		vy := v_avg_y * time

		boid_x, boid_y := p0.Splat()

		// make it so a boid can only hit one thing.
		// TODO be smarter?
		hit_something := false

		new_x := boid_x + vx
		new_y := boid_y + vy

		new_vx, new_vy := v1.Splat()

		// --------------------------------------
		//     Margin bounding box collision
		// --------------------------------------
		if !hit_something {
			// collide with outer wall
			hit_in_x, maybe_new_x := bounce_point_between_two_walls(boid_x, boid_radius, vx, bounds_x1, bounds_x2)
			hit_in_y, maybe_new_y := bounce_point_between_two_walls(boid_y, boid_radius, vy, bounds_y1, bounds_y2)

			if hit_in_x { new_vx *= -1 }
			if hit_in_y { new_vy *= -1 }

			hit_something = hit_in_x || hit_in_y

			if hit_something {
				new_x = maybe_new_x
				new_y = maybe_new_y
			}
		}


		// --------------------------------------
		//           wall collisions
		// --------------------------------------

		// loop over all walls,
		// TODO maybe use spacial array for speed?
		for _, wall := range boid_sim.Walls {

			if !hit_something {
				// collide with boid_sim.wall

				// circle rectangle collision
				hit, px, py := circle_rectangle_collision(new_x, new_y, boid_radius, wall)

				if hit {
					hit_something = true

					// check if we are already in the rectangle
					prev_frame_hit, _, _ := circle_rectangle_collision(boid_x, boid_y, boid_radius, wall)

					if prev_frame_hit {
						// just pass?
						// panic("TODO move the boid out of the box... maybe just teleport?")

					} else {


						// bounce the boid off the box

						// if the px == boid_x, you hit a wall, just flip a sign.
						if sloppy_equal(new_x, px) {
							new_y = bounce_1d(boid_y, boid_radius, vy, py)
							new_vy *= -1 // flip the y velocity

						} else if sloppy_equal(new_y, py) {
							new_x = bounce_1d(boid_x, boid_radius, vx, px)
							new_vx *= -1 // flip the x velocity

						} else {
							// oh no, we hit a corner. fuck.

							// https://math.stackexchange.com/questions/428546/collision-between-a-circle-and-a-rectangle

							// TODO calculate position at moment of collision
							// for now the boids just get a fun little speed boost
							cx := boid_x
							cy := boid_y

							q := -(2 * (vx*(cx - px) + vy*(cy - py))) / square(boid_radius)

							// velocity after collision with corner.
							vx_after := vx + q*(cx - px)
							vy_after := vy + q*(cy - py)

							// two questions:

							// - where are we now

							// it actually doesn't really matter where we end up,
							// I cant figure out the math right now, so im going to cheat.
							//
							// this assumes it bounce perfectly diagonally,
							// but its good enough for our purposes/
							new_x = bounce_1d(boid_x, boid_radius, vx, px)
							new_y = bounce_1d(boid_y, boid_radius, vy, py)

							// - whats the boids velocity now?
							//
							// solve for v1
							// vx = ((v0.X + v1.X) / 2) * time
							// (vx / time) = (v0.X + v1.X) / 2
							// (vx / time) * 2 = v0.X + v1.X
							// (vx / time) * 2 - v0.X = v1.X
							// v1.X = (vx / time) * 2 - v0.X

							new_vx = vx_after / time * 2 - v0.X
							new_vy = vy_after / time * 2 - v0.Y
						}

					}
				}

			}

		}

		boid.Position.X = new_x
		boid.Position.Y = new_y

		boid.Velocity.X = new_vx
		boid.Velocity.Y = new_vy

		// TODO is this needed?
		// // makes them wrap around the screen
		// if boid_sim.Toggle_Wrapping {
		// 	boid_sim.Boids[i].Position.X = proper_mod(boid_sim.Boids[i].Position.X, boid_sim.Width)
		// 	boid_sim.Boids[i].Position.Y = proper_mod(boid_sim.Boids[i].Position.Y, boid_sim.Height)
		// }
	}
}

func sloppy_equal[T Float](a, b T) bool {
	// some small number
	const EPSILON = 0.000000001
	return abs(a - b) < EPSILON
}

// returns if there was a collision, and the closest point on the rectangle.
func circle_rectangle_collision(x, y, r Boid_Float, rect Rectangle) (bool, Boid_Float, Boid_Float) {
	px := x
	py := y
	px = max(px, rect.x)
	px = min(px, rect.x + rect.w)
	py = max(py, rect.y)
	py = min(py, rect.y + rect.h)

	// check for collision
	collision := square(x - px) + square(y - py) < square(r)

	return collision, px, py
}


// takes a initial position, radius, velocity, two walls, and a time value
//
// returns weather you hit something, and the new position.
func bounce_point_between_two_walls[T Number](x, r, v, w1, w2 T) (bool, T){
	if w2 < w1 {
		// swap them, this case might happen when resizing the window.
		tmp := w1
		w1 = w2
		w2 = tmp
	}

	new_x := x + v

	if new_x - r <= w1 {
		if v < 0 {
			// if it wasn't out of bounds in the previous frame.
			if !(x - r <= w1) {
				// flip around the bounce point.
				new_x = bounce_1d(x, r, v, w1)
			}

			return true, new_x
		}
	} else if new_x + r >= w2 {
		if v > 0 {
			// if it wasn't out of bounds in the previous frame.
			if !(x + r >= w2) {
				new_x = bounce_1d(x, r, v, w2)
			}

			return true, new_x
		}
	}

	return false, new_x
}

// takes a position, radius, velocity, and a wall position.
func bounce_1d[T Number](x, r, v, w T) T {
	if v == 0 { return x } // no movement base case.

	// this takes into account which direction your moving,
	// to figure out where the r should be supplied.
	if v < 0 { r = -r }

	return 2*w - (x + r + v) - r
}


// outputs a number from [0, b). ignore the float64. go math module is dumb.
func proper_mod[T Float](a, b T) T {
	return T(math.Mod(math.Mod(float64(a), float64(b))+float64(b), float64(b)))
}

func square[T Number](x T) T {
	return x * x
}

func abs[T Float](x T) T {
	if x < 0 { return -x }
	return x
}

func sqrt[T Float](x T) T {
	return T(math.Sqrt(float64(x)))
}

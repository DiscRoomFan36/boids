package main

import (
	"math"
	"time"
)

const NUM_RANDOM_GENERATORS = 32

// in seconds.
const CLICK_FADE_TIME = 1


type Boid_Float float32

type Boid struct {
	Position Vec2[Boid_Float]
	Velocity Vec2[Boid_Float]
	Acceleration Vec2[Boid_Float]
}

type Position_And_Time struct {
	Pos Vec2[Boid_Float]
	Time time.Time
}

type Properties struct {
	// in rough order of when their used

	Max_Boids          int `Property:"int" Range:"0;5000" Default:"1000"`
	// how many spawn / de-spawn per second.
	Boid_Spawn_Rate    Boid_Float `Property:"float" Range:"10;1000" Default:"100"`

	Visual_Range            Boid_Float `Property:"float" Range:"1;25" Default:"15"`
	Separation_Min_Distance Boid_Float `Property:"float" Range:"0;20" Default:"8.5"`

	Separation_Factor Boid_Float `Property:"float" Range:"0;1" Default:"0.50"` // 0.15
	Alignment_Factor  Boid_Float `Property:"float" Range:"0;1" Default:"0.30"` // 0.15
	Cohesion_Factor   Boid_Float `Property:"float" Range:"0;1" Default:"0.15"` // 0.015

	Margin             Boid_Float `Property:"float" Range:"0;100" Default:"50"`
	Margin_Turn_Factor Boid_Float `Property:"float" Range:"0;20" Default:"4"`

	Random_Draw_Factor        Boid_Float `Property:"float" Range:"0;10" Default:"2"`
	Random_Draw_Time_Dilation Boid_Float `Property:"float" Range:"1;10" Default:"2"`

	Center_Draw_Radius_Div Boid_Float `Property:"float" Range:"0;10" Default:"3"`
	Center_Draw_Factor     Boid_Float `Property:"float" Range:"0;10" Default:"1"`

	Wind_X_Factor Boid_Float `Property:"float" Range:"-10;10" Default:"0"`
	Wind_Y_Factor Boid_Float `Property:"float" Range:"-10;10" Default:"0"`

	Mouse_Draw_Factor Boid_Float `Property:"float" Range:"1;100" Default:"5"`

	Num_Boid_Rays      int        `Property:"int" Range:"1;10" Default:"5"`
	// in radians
	Visual_Cone_Radius Boid_Float `Property:"float" Range:"0;360" Default:"140"`
	Boid_Vision_Factor Boid_Float `Property:"float" Range:"0;5" Default:"1"`

	Final_Acceleration_Boost Boid_Float `Property:"float" Range:"1;25" Default:"10"` // 5
	Final_Drag_Coefficient   Boid_Float `Property:"float" Range:"0;2" Default:"0.15"` // 1


	Toggle_Wrapping bool `Property:"bool" Default:"true"`
	Toggle_Bounding bool `Property:"bool" Default:"false"`


	Boid_Radius Boid_Float `Property:"float" Range:"0;10" Default:"2.5"`
}

type Boid_simulation struct {
	Boids []Boid

	Width, Height Boid_Float

	// for fast proximity detection.
	Spacial_array Spacial_Array[Boid_Float]

	// used for random draw forces
	generators [NUM_RANDOM_GENERATORS]Random_Generator


	// for animations.
	Click_Positions_And_Times []Position_And_Time


	making_new_wall bool
	new_wall_start Vec2[Boid_Float]


	// Thing a boid can hit, maybe they can see it as well?
	Walls []Line
	Rectangles []Rectangle

	// used to calculate how long until the next boid is spawned / de-spawned
	//
	// should this be a float64 since its about time?
	spawn_timer Boid_Float

	props Properties
}

func New_boid_simulation(width, height Boid_Float) Boid_simulation {
	boid_sim := Boid_simulation{
		Boids: make([]Boid, 0, 512),

		Width:  width,
		Height: height,

		Spacial_array: New_Spacial_Array[Boid_Float](),

		Click_Positions_And_Times: make([]Position_And_Time, 0, 32),

		making_new_wall: false,

		// just make a temp thing in the middle of the field.
		Walls: make([]Line, 0),
		Rectangles: make([]Rectangle, 0),

		spawn_timer: 0,
	}

	set_boid_defaults(&boid_sim)

	for i := range NUM_RANDOM_GENERATORS {
		boid_sim.generators[i] = New_Random_Generator(true)
		// offset the generators a bit.
		// this doesn't have to be random. could just be 'i / NUM_RANDOM_GENERATORS'
		boid_sim.generators[i].t = rand_f32()
	}

	return boid_sim
}

func (boid_sim *Boid_simulation) bounds_as_rect() Rectangle {
	return Rectangle{
		boid_sim.props.Margin,
		boid_sim.props.Margin,
		boid_sim.Width  - 2*boid_sim.props.Margin,
		boid_sim.Height - 2*boid_sim.props.Margin,
	}
}


// NOTE dt is in seconds
func (boid_sim *Boid_simulation) Update_boids(dt float64, input Input_Status) {
	now := time.Now()

	// ------------------------------------------------------
	//               handle user input.
	// ------------------------------------------------------

	// make a little splash effect on left click.
	if input.Left_Clicked {
		Append(&boid_sim.Click_Positions_And_Times, Position_And_Time{input.Mouse_Pos, now})
	}
	for i := 0; i < len(boid_sim.Click_Positions_And_Times); i++ {
		// remove if its been to long.
		pos_and_time := boid_sim.Click_Positions_And_Times[i]
		if now.Sub(pos_and_time.Time).Seconds() > CLICK_FADE_TIME {
			Remove_Unordered(&boid_sim.Click_Positions_And_Times, i)
			i -= 1 // hack, to check the thing that was just put here,
			// maybe it would be better to just remove everything later, after the loop is done.
		}
	}

	// make a new wall on right click and drag
	if input.Middle_Clicked {
		boid_sim.making_new_wall = true
		boid_sim.new_wall_start = input.Mouse_Pos
	}
	if boid_sim.making_new_wall {
		if input.Middle_Released {
			boid_sim.making_new_wall = false

			// middle click must be held down for some time until it counts as a drag movement.
			if input.Middle_Held_Prev {
				new_line := Line{
					boid_sim.new_wall_start.x, boid_sim.new_wall_start.y,
					input.Mouse_Pos.x, input.Mouse_Pos.y,
				}
	
				Append(&boid_sim.Walls, new_line)
			}
		}
	}


	{ // spawn / despawn boids.
		// TODO this could maybe do a ramp up / down?
		boid_sim.spawn_timer += Boid_Float(dt)
		time_to_spawn := 1 / boid_sim.props.Boid_Spawn_Rate

		for boid_sim.spawn_timer >= time_to_spawn {
			boid_sim.spawn_timer -= time_to_spawn

			// check if we even need to add a new boid.
			if len(boid_sim.Boids) == boid_sim.props.Max_Boids { continue; }

			if len(boid_sim.Boids) < boid_sim.props.Max_Boids {
				// add 1 boid.

				var pos Vec2[Boid_Float]
				for range 5 { // no inf loops here
					pos = Make_Vec2(
						Boid_Float(rand_f32()*float32(boid_sim.Width )),
						Boid_Float(rand_f32()*float32(boid_sim.Height)),
					)
					is_blocked_from_spawning := boid_sim.props.Toggle_Bounding && !point_rect_collision_vr(pos, boid_sim.bounds_as_rect())
					if !is_blocked_from_spawning {
						for _, rect := range boid_sim.Rectangles {
							if point_rect_collision_vr(pos, rect) {
								is_blocked_from_spawning = true; break
							}
						}
					}
					if !is_blocked_from_spawning { break }
				}

				new_boid := Boid{
					Position: pos,
					// just a bit of starting speed. these numbers mean nothing,
					// I just wanted to finally remove Min and Max Speed
					Velocity: Mult(Random_unit_vector[Boid_Float](), 20),
				}

				Append(&boid_sim.Boids, new_boid)
			} else {
				// remove 1 boid.
				// do it randomly so its cooler.

				random_index := rand_n(len(boid_sim.Boids))
				Remove_Unordered(&boid_sim.Boids, random_index)
			}
		}
	}



	{ // fix all rectangles so they all have positive values.
		for i := range len(boid_sim.Rectangles) {
			rect := &boid_sim.Rectangles[i]
			*rect = fix_rectangle_so_that_width_and_height_are_positive(*rect)
		}

		// make sure not to modify the rectangles after this point!

		// TODO do this with the walls maybe?
	}



	{ // Setup the spacial array.
		// Clear out previous uses.
		boid_sim.Spacial_array.Clear()

		// TODO make this just how we store boid positions or something.
		boid_positions := make([]Vec2[Boid_Float], len(boid_sim.Boids))
		for i, b := range boid_sim.Boids { boid_positions[i] = b.Position }

		boid_sim.Spacial_array.Append_points(boid_positions, 0, 0, boid_sim.Width, boid_sim.Height)
	}



	// Reset Acceleration for new update.
	for i := range len(boid_sim.Boids) { boid_sim.Boids[i].Acceleration = Vec2[Boid_Float]{} }

	// ------------------------------------
	//   Separation, Alignment, Cohesion
	// ------------------------------------
	for i := range len(boid_sim.Boids) {
		this_boid := boid_sim.Boids[i]

		// Separation
		sep := Vec2[Boid_Float]{}
		// Alignment
		align := Vec2[Boid_Float]{}
		// Cohesion
		coh := Vec2[Boid_Float]{}

		num_close_boids := 0
		for other_boid_index, near_pos := range boid_sim.Spacial_array.Iter_Over_Near(this_boid.Position, boid_sim.props.Visual_Range) {
			// don't count it if it sees itself.
			if int(other_boid_index) == i { continue }

			num_close_boids += 1

			// if the near guy is super close. move away
			dist_sqr := DistSqr(this_boid.Position, near_pos)
			sep_min_dist_sqr := Square(boid_sim.props.Separation_Min_Distance)
			if dist_sqr < sep_min_dist_sqr {

				// in percent, how close it is, 0 is same position
				closeness := dist_sqr / sep_min_dist_sqr

				// limit the min distance.
				closeness = max(closeness, 0.00001)
				// the closer the stronger
				force := 1 / closeness

				sep.x += (this_boid.Position.x - near_pos.x) * force
				sep.y += (this_boid.Position.y - near_pos.y) * force
			}

			// make the velocity's match.
			align.Add(boid_sim.Boids[other_boid_index].Velocity)
			// go to the center of the pack. we subtract this_boid.position later
			coh.Add(near_pos)
		}

		// divide by number of close boids.
		if num_close_boids > 0 {
			align.Mult(1 / Boid_Float(num_close_boids))
			// because we want the difference between our
			// velocity and the near ones. so we sub here to
			// sub from every near one. probably be more clear
			// to not do it here, i don't think this is the slow
			// part of that loop.
			align.Sub(this_boid.Velocity)

			coh.Mult(1 / Boid_Float(num_close_boids))
			// remove its own position from every near boid,
			// faster than subtracting from every individual, probably
			coh.Sub(this_boid.Position)
		}

		sep.Mult(boid_sim.props.Separation_Factor)
		align.Mult(boid_sim.props.Alignment_Factor)
		coh.Mult(boid_sim.props.Cohesion_Factor)

		boid_sim.Boids[i].Acceleration.Add(sep, align, coh)
	}

	// ------------------------------------
	//          Bounding forces
	// ------------------------------------
	if boid_sim.props.Toggle_Bounding {
		rect := boid_sim.bounds_as_rect()

		for i := range len(boid_sim.Boids) {
			boid_pos := boid_sim.Boids[i].Position
			vel := Vec2[Boid_Float]{}

			if boid_pos.x < rect.x          { vel.x += 1 }
			if boid_pos.x > rect.x + rect.w { vel.x -= 1 }

			if boid_pos.y < rect.y          { vel.y += 1 }
			if boid_pos.y > rect.y + rect.h { vel.y -= 1 }

			bounding := Mult(vel, boid_sim.props.Margin_Turn_Factor)
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
		time_advance := dt / float64(boid_sim.props.Random_Draw_Time_Dilation)

		force_vectors := [NUM_RANDOM_GENERATORS]Vec2[Boid_Float]{}
		for i := range NUM_RANDOM_GENERATORS {
			random_number := boid_sim.generators[i].Next(float32(time_advance))
			theta := random_number * 2 * math.Pi

			rotated_vector := Unit_Vector_With_Rotation(Boid_Float(theta))
			rotated_vector.Mult(boid_sim.props.Random_Draw_Factor)

			force_vectors[i] = rotated_vector
		}

		// apply forces to groups.
		for i := range len(boid_sim.Boids) {
			// for all intense and purposes, this is random to the viewer.
			force := force_vectors[i%NUM_RANDOM_GENERATORS]
			boid_sim.Boids[i].Acceleration.x += force.x
			boid_sim.Boids[i].Acceleration.y += force.y
		}
	}

	// ------------------------------------
	//         Center draw forces
	// ------------------------------------
	if boid_sim.props.Center_Draw_Factor != 0 && boid_sim.props.Center_Draw_Radius_Div != 0 {
		for i := range len(boid_sim.Boids) {
			this_boid := boid_sim.Boids[i]

			// center of the simulation
			center := Make_Vec2(boid_sim.Width/2, boid_sim.Height/2)

			// if they in in this circle, don't be drawn into the center.
			min_radius := min(boid_sim.Width, boid_sim.Height) / boid_sim.props.Center_Draw_Radius_Div

			if DistSqr(this_boid.Position, center) < Square(min_radius) { continue }

			// vector pointing towards the center.
			center_pointer := Normalized(Sub(center, this_boid.Position))

			center_draw := Mult(center_pointer, boid_sim.props.Center_Draw_Factor)
			boid_sim.Boids[i].Acceleration.Add(center_draw)
		}
	}

	// ------------------------------------
	//                 Wind
	// ------------------------------------
	for i := range len(boid_sim.Boids) {
		wind := Make_Vec2(boid_sim.props.Wind_X_Factor, boid_sim.props.Wind_Y_Factor)
		boid_sim.Boids[i].Acceleration.Add(wind)
	}


	// ------------------------------------
	//            Mouse stuff
	// ------------------------------------
	// on mouse down, move all boids towards mouse.
	if input.Left_Down {
		for i := range len(boid_sim.Boids) {
			toward_mouse := Sub(input.Mouse_Pos, boid_sim.Boids[i].Position)
			force := Mult(Normalized(toward_mouse), boid_sim.props.Mouse_Draw_Factor)
			boid_sim.Boids[i].Acceleration.Add(force)
		}
	}


	// ------------------------------------
	//            Boid Vision
	// ------------------------------------
	//
	// works by shooting rays that collide against everything in the scene
	// if this is ever the slow part, there are tones of ways to make this faster.
	//
	// Im not saying that I want this to be slow, its just that the slow part right
	// now is drawing and I wish that wasn't the slow part.
	//
	// Also this Sloppy_Equal is to stop this from running if the factor is zero,
	// might apply this to other things as well, but this feels like it
	// could maybe make a difference here
	if !Sloppy_Equal(boid_sim.props.Boid_Vision_Factor, 0) || boid_sim.props.Num_Boid_Rays == 0 {

		for i := range len(boid_sim.Boids) {
			boid := boid_sim.Boids[i]

			ray_results := boid_sim.get_ray_results_for_boid_by_colliding_with_every_wall(boid)

			combined_ray := Vec2[Boid_Float]{}

			for _, ray_result := range ray_results {
				end := ray_result.end_point
				// should be zero when it sees nothing, otherwise provides a push in the other direction.
				new_force := Sub(ray_result.hit_point, end)
				// square the vector. yes this is squaring
				new_force.Mult(boid_sim.props.Visual_Range - Sqrt(ray_result.dist_sqr))

				combined_ray.Add(new_force)
			}

			// reduce the total forces by the number of rays.
			combined_ray.Mult(1 / Boid_Float(boid_sim.props.Num_Boid_Rays))

			combined_ray.Mult(boid_sim.props.Boid_Vision_Factor)

			boid_sim.Boids[i].Acceleration.Add(combined_ray)
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

		a.Mult(boid_sim.props.Final_Acceleration_Boost)
		// just the negative velocity for drag, must be after the final acceleration boost.
		// this stops things from getting to out of hand.
		drag := Mult(v0, -boid_sim.props.Final_Drag_Coefficient)
		a.Add(drag)

		boid_sim.Boids[i].Acceleration = a
	}

	// ------------------------------------
	//   Update positions and velocities
	// ------------------------------------
	boid_sim.finally_move_and_collide(dt)
}

func (boid_sim *Boid_simulation) finally_move_and_collide(dt_ float64) {
	// make a bounding box.
	bounds_x1, bounds_y1, bounds_x2, bounds_y2 := boid_sim.bounds_as_rect().Splat_Vec()

	boid_radius := boid_sim.props.Boid_Radius

	dt := Boid_Float(dt_)

	// TODO clean this mess up. god damn, its messy

	for i := range len(boid_sim.Boids) {
		boid := &boid_sim.Boids[i]

		// Handmade Hero Day 043 - The Equations of Motion: https://www.youtube.com/watch?v=LoTRzRFEk5I

		p0 := boid.Position
		v0 := boid.Velocity
		a := boid.Acceleration

		// v1 = a*t + v0
		v1 := Add(Mult(a, dt), v0)

		{ // this Code is kinda Meh.
			// this is kinda replacing Min_Speed, but i kinda don't want to think about it anymore.
			// Also i already have to many properties. gotta cut down on them
			//
			// also for some reason i feal as if this code is doing nothing? huh?
			const BOID_MIN_SPEED = 10
			v1_mag := v1.Mag()
			if v1_mag < BOID_MIN_SPEED {
				if Sloppy_Equal(v1_mag, 0) {
					// just move in a direction. probably should make this unique for each boid...
					v1 = Vec2[Boid_Float]{-BOID_MIN_SPEED, -BOID_MIN_SPEED}
				} else {
					v1.SetMag(BOID_MIN_SPEED)
				}
			}

			const BOID_MAX_SPEED = 500
			if v1_mag > BOID_MAX_SPEED { v1.SetMag(BOID_MAX_SPEED) }
		}

		// a very nice way to calculate displacement.
		// v_avg = (v0 + v1) / 2
		v_avg_x := (v0.x + v1.x) / 2
		v_avg_y := (v0.y + v1.y) / 2


		// -------------------------------
		//          Collisions
		// -------------------------------

		vx := v_avg_x * dt
		vy := v_avg_y * dt

		start_boid_pos := p0
		boid_x, boid_y := start_boid_pos.Splat()

		// make it so a boid can only hit one thing.
		// TODO be smarter?
		hit_something := false

		new_x := boid_x + vx
		new_y := boid_y + vy

		new_vx, new_vy := v1.Splat()

		// --------------------------------------
		//     Margin bounding box collision
		// --------------------------------------
		if boid_sim.props.Toggle_Bounding {
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
		}


		// --------------------------------------
		//           wall collisions
		// --------------------------------------

		for _, line := range boid_sim.Walls {
			if hit_something { continue }

			l0, l1 := line.to_vec()

			new_boid_pos := Make_Vec2(new_x, new_y)

			closest := closest_point_on_line_to_point(l0, l1, new_boid_pos)
			if DistSqr(closest, start_boid_pos) > Square(boid_radius) { continue }

			hit_something = true
			// TODO bounce off line.

			normal := Normalized(Sub(start_boid_pos, closest))
			dot := Dot(normal, Make_Vec2(new_vx, new_vy))

			// if the boid is already going in the same direction.
			// maybe also hit_something = false?
			if dot > 0 { continue }

			new_vx -= 2 * dot * normal.x;
			new_vy -= 2 * dot * normal.y;
		}

		// loop over all Rectangles,
		// TODO maybe use spacial array for speed?
		for _, wall := range boid_sim.Rectangles {

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
						if Sloppy_Equal(new_x, px) {
							new_y = bounce_1d(boid_y, boid_radius, vy, py)
							new_vy *= -1 // flip the y velocity

						} else if Sloppy_Equal(new_y, py) {
							new_x = bounce_1d(boid_x, boid_radius, vx, px)
							new_vx *= -1 // flip the x velocity

						} else {
							// oh no, we hit a corner. fuck.

							// https://math.stackexchange.com/questions/428546/collision-between-a-circle-and-a-rectangle

							// TODO calculate position at moment of collision
							// for now the boids just get a fun little speed boost
							cx := boid_x
							cy := boid_y

							q := -(2 * (vx*(cx - px) + vy*(cy - py))) / Square(boid_radius)

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

							new_vx = vx_after / dt * 2 - v0.x
							new_vy = vy_after / dt * 2 - v0.y
						}

					}
				}

			}

		}

		boid.Position.x = new_x
		boid.Position.y = new_y

		boid.Velocity.x = new_vx
		boid.Velocity.y = new_vy

		// makes them wrap around the screen
		if boid_sim.props.Toggle_Wrapping {
			boid_sim.Boids[i].Position.x = Proper_Mod(boid_sim.Boids[i].Position.x, boid_sim.Width)
			boid_sim.Boids[i].Position.y = Proper_Mod(boid_sim.Boids[i].Position.y, boid_sim.Height)
		}
	}
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
	collision := Square(x - px) + Square(y - py) < Square(r)

	return collision, px, py
}


// Returns the minimum distance between line segment vw and point p
//
// https://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment
func closest_point_on_line_to_point[T Float](v Vec2[T], w Vec2[T], p Vec2[T]) Vec2[T] {

	length_sqr := DistSqr(v, w)                   // i.e. |w-v|^2 -  avoid a sqrt
	if (Sloppy_Equal(length_sqr, 0)) { return v } // v == w case

	// Consider the line extending the segment, parameterized as v + t (w - v).
	// We find projection of point p onto the line. 
	// It falls where t = [(p-v) . (w-v)] / |w-v|^2
	p_sub_v := Sub(p, v);
	w_sub_v := Sub(w, v);
	t := Dot(p_sub_v, w_sub_v) / length_sqr;

	// We clamp t from [0,1] to handle points outside the segment vw.
	if        (t < 0) { t = 0
	} else if (t > 1) { t = 1 }

	// projection = v + t * (w - v);
	projection := Add(v, Mult(w_sub_v, t)) // Projection falls on the segment
	return projection;
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


const MAX_RAYS = 32
var static_rays_storage [MAX_RAYS]Line

func (boid_sim *Boid_simulation) get_boid_rays(boid Boid) []Line {
	num_rays    := boid_sim.props.Num_Boid_Rays
	cone_radius := boid_sim.props.Visual_Cone_Radius

	if num_rays > MAX_RAYS { panic("Why are there this many rays") }
	result := static_rays_storage[:num_rays]

	cone_radians := (cone_radius * DEG_TO_RAD) / 2

	for i := range num_rays {
		var angle Boid_Float = 0
		if num_rays > 1 {
			angle = Lerp(-cone_radians, cone_radians, Boid_Float(i) / Boid_Float(num_rays - 1))
		}
		dir := Rotate(boid.Velocity, angle)

		dir.SetMag(boid_sim.props.Visual_Range) // Visual_Range is the farthest it can see.

		pos := boid.Position
		ray := Line{pos.x, pos.y, pos.x + dir.x, pos.y + dir.y}

		result[i] = ray
	}

	return result
}



type Ray_Result struct {
	end_point Vec2[Boid_Float]
	hit_point Vec2[Boid_Float]
	dist_sqr Boid_Float
}

var static_ray_results_storage [MAX_RAYS]Ray_Result

func (boid_sim *Boid_simulation) get_ray_results_for_boid_by_colliding_with_every_wall(boid Boid) ([]Ray_Result) {
	boid_pos := boid.Position

	// TODO maybe pull this in? the results can reconstruct this anyway...
	// if i wanted to draw these.
	//
	// TODO remove these rays, just store stuff in the Ray_Result...
	rays := boid_sim.get_boid_rays(boid)
	// this is kinda dumb now.
	num_rays := len(rays)

	result := static_ray_results_storage[:num_rays]
	if num_rays == 0 { return result }

	// surrounding all the lines. to make a faster check hopefully.
	//
	// since we know all rays have the same starting position,
	// we can start with this and just check the other end
	//
	// TODO maybe the ray can just be an ending position?
	// not a line. I construct the line myself...
	// or would that be slower?
	rays_bounding_box := Axis_Aligned_Bounding_Box{
		x1: boid.Position.x, y1: boid.Position.y,
		x2: boid.Position.x, y2: boid.Position.y,
	}

	for i := range num_rays {
		// start is just boid.Position
		_, end := rays[i].to_vec()
		result[i].end_point = end
		result[i].dist_sqr = DistSqr(boid_pos, end)
		result[i].hit_point = end

		rays_bounding_box.x1 = min(rays_bounding_box.x1, end.x)
		rays_bounding_box.y1 = min(rays_bounding_box.y1, end.y)
		rays_bounding_box.x2 = max(rays_bounding_box.x2, end.x)
		rays_bounding_box.y2 = max(rays_bounding_box.y2, end.y)
	}


	for _, line := range boid_sim.Walls {
		// we don't have a lot of walls, (unless you make your own.)
		// but the min's and max's in it are probably not good.
		// maybe fix all the lines before coming into here?
		line_aabb := line_to_aabb(line)
		if !aabb_aabb_collision(rays_bounding_box, line_aabb) { continue }

		for i, ray := range rays {
			// god i hope this dose the right thing... (efficiently pass arguments)
			hit, loc := line_line_intersection_l(ray, line)
			if !hit { continue }

			dist_sqr := DistSqr(boid_pos, loc)
			if dist_sqr < result[i].dist_sqr {
				result[i].dist_sqr = dist_sqr
				result[i].hit_point = loc
			}
		}
	}

	for _, rect := range boid_sim.Rectangles {
		// we *Know* that the rectangles have been
		// fixed before calling this function.
		//
		// this skips a lot of min's and max's
		rect_aabb := rect_to_aabb_unchecked(rect)
		if !aabb_aabb_collision(rays_bounding_box, rect_aabb) { continue }

		// if the ray starts in the rectangle, don't hit the rectangle.
		if point_rect_collision_vr(boid_pos, rect) { continue }

		for i, ray := range rays {
			// TODO should we run the aabb again for these guys?
			lines := rectangle_to_lines(rect.x, rect.y, rect.w, rect.h)
			// @Copypasta!
			for _, line := range lines {
				hit, loc := line_line_intersection_l(ray, line)
				if !hit { continue }

				dist_sqr := DistSqr(boid_pos, loc)
				if dist_sqr < result[i].dist_sqr {
					result[i].dist_sqr = dist_sqr
					result[i].hit_point = loc
				}
			}
		}
	}

	if boid_sim.props.Toggle_Bounding {
		// this rectangle could have negative widths and heights...
		bounding_box := boid_sim.bounds_as_rect()

		rect_aabb := rect_to_aabb(bounding_box)
		if aabb_aabb_collision(rays_bounding_box, rect_aabb) {

			// if the start if outside of the bounding box, don't check
			//
			// TODO this will slightly fail if the boid is just
			// outside and facing a different edge.
			if point_rect_collision_vr(boid_pos, bounding_box) {

				for i, ray := range rays {
					// @Copypasta!
					for _, line := range rectangle_to_lines_r(bounding_box) {
						hit, loc := line_line_intersection_l(ray, line)
						if !hit { continue }

						dist_sqr := DistSqr(boid_pos, loc)
						if dist_sqr < result[i].dist_sqr {
							result[i].dist_sqr = dist_sqr
							result[i].hit_point = loc
						}
					}
				}
			}
		}
	}


	return result
}



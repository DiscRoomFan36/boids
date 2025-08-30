package main

import (
	"math"
	"time"
)

// I feel like go is guilt tripping me with this syntax.
// Also this has to be here because go-static is dumb
var input Input_Status


const DEBUG_SPACIAL_ARRAY = false
const DEBUG_BOUNDARY      = true
const DEBUG_HEADING       = false
const DEBUG_VISUAL_RANGES = false


// TODO have some sort of view mode here, so we can 'move' the 'camera'
//
// go incorrectly reports this function as unused if it is not public...
func Draw_boids_into_image(img *Image, boid_sim *Boid_simulation) {
	boid_boundary_color := rgb(240, 240, 240)

	img.Clear_background(Color{r: 24, g: 24, b: 24, a: 255})

	// we map the world-space to match the image space
	scale_factor := Boid_Float(1) / BOID_SCALE

	if DEBUG_SPACIAL_ARRAY {
		draw_spacial_array_into_image(img, boid_sim.Spacial_array, scale_factor)
	}

	if DEBUG_BOUNDARY {
		margin := int(boid_sim.props.Margin * scale_factor)
		boundary_points := [4]Vec2[int]{
			{x: margin, y: margin},
			{x: img.Width - margin, y: margin},
			{x: img.Width - margin, y: img.Height - margin},
			{x: margin, y: img.Height - margin},
		}

		for i := range len(boundary_points) {
			Draw_Line(img, boundary_points[i], boundary_points[(i+1)%len(boundary_points)], boid_boundary_color)
		}
	}

	if DEBUG_VISUAL_RANGES {
		// Draw visual radius.
		visual_radius_color := HSL_to_RGB(50, 0.7, 0.9)
		for _, b := range boid_sim.Boids {
			x := b.Position.x * scale_factor
			y := b.Position.y * scale_factor
			r := boid_sim.props.Visual_Range * scale_factor
			Draw_Circle(img, x, y, r, visual_radius_color)
		}

		// Draw minimum visual radius. (for separation.)
		minimum_radius_color := HSL_to_RGB(270, 0.7, 0.7)
		for _, b := range boid_sim.Boids {
			x := b.Position.x * scale_factor
			y := b.Position.y * scale_factor
			r := boid_sim.props.Separation_Min_Distance * scale_factor
			Draw_Circle(img, x, y, r, minimum_radius_color)
		}
	}

	{ // draw the rectangles
		for _, wall := range boid_sim.Rectangles {
			x, y, w, h := wall.Splat()
			boundary_points := [4]Vec2[Boid_Float]{
				{x: x,     y: y    },
				{x: x + w, y: y    },
				{x: x + w, y: y + h},
				{x: x,     y: y + h},
			}

			// scale the points
			for i := range len(boundary_points) {
				boundary_points[i].x *= scale_factor
				boundary_points[i].y *= scale_factor
			}

			for i := range len(boundary_points) {
				Draw_Line(img, boundary_points[i], boundary_points[(i+1)%len(boundary_points)], rgb(240, 14, 14))
			}
		}
	}

	{ // Walls / Lines
		for _, line := range boid_sim.Walls {
			p1, p2 := line.to_vec()
			p1.Mult(scale_factor)
			p2.Mult(scale_factor)
			Draw_Line(img, p1, p2, rgb(240, 14, 14))
		}
	}

	if boid_sim.making_new_wall {
		p1 := boid_sim.new_wall_start
		// get a better static analyzer.
		p2 := input.Mouse_Pos
		p1.Mult(scale_factor)
		p2.Mult(scale_factor)
		color := rgb(236, 236, 10)
		if input.Middle_Held { color = rgb(10, 245, 10) }
		Draw_Line(img, p1, p2, color)
	}

	// NOTE i would put this in a go routine, but wasm doesn't do multithreading, fuck
	for _, b := range boid_sim.Boids {
		// img.Draw_Circle(int(b.Position.X*scale_factor), int(b.Position.Y*scale_factor), BOID_DRAW_RADIUS, boid_color2)

		// put them in img space
		b.Position.Mult(scale_factor)

		// Draw boid body
		// TODO maybe some LOD shit, where its just a triangle? 2x speed?
		boid_shape := [4]Vec2[Boid_Float]{
			{x: 0, y: 1},      // tip
			{x: 0, y: -0.5},   // back
			{x: 1, y: -0.75},  // wing1
			{x: -1, y: -0.75}, // wing2
		}

		// Rotate to face them in the right direction
		theta := GetTheta(b.Velocity) - math.Pi/2
		// TODO i also think this is slowing us down, put in own function
		for i := range len(boid_shape) {
			// someone who knows math explain this
			boid_shape[i] = Rotate(boid_shape[i], theta)

			boid_shape[i].Mult(boid_sim.props.Boid_Radius * scale_factor)
			boid_shape[i].Add(b.Position)
		}

		// get cool color for boid
		speed := b.Velocity.Mag() / boid_sim.props.Max_Speed

		const SHIFT_FACTOR = 2
		H := math.Mod(float64(Clamp(speed, 0, 1)*360)*SHIFT_FACTOR, 360)

		boid_color := HSL_to_RGB(H, 0.75, 0.6)

		// Draw both sides
		Draw_Triangle(img, boid_shape[0], boid_shape[1], boid_shape[2], boid_color)
		Draw_Triangle(img, boid_shape[0], boid_shape[1], boid_shape[3], boid_color)

		if DEBUG_HEADING {
			// Draw heading line
			where_boid_will_be := Add(b.Position, b.Velocity)
			Draw_Line(img, b.Position, where_boid_will_be, rgba(43, 231, 26, 1))
		}
	}

	now := time.Now()
	for _, pos_and_time := range boid_sim.Click_Positions_And_Times {
		pos := pos_and_time.Pos
		pos.Mult(scale_factor) // into world co-ord's

		time := pos_and_time.Time
		secs := float32(now.Sub(time).Seconds())
		percent := secs / CLICK_FADE_TIME

		color := rgba(226, 226, 226, 0.77)
		color.Set_Alpha(1 - ease_in_out_quint(percent))

		// in image pixels
		const SIZE_SCALE = 20
		// in image pixels
		const RING_WIDTH = 2

		size_factor := ease_out_quint(percent)
		Draw_Ring(img, pos.x, pos.y, Boid_Float(size_factor*SIZE_SCALE), Boid_Float(size_factor*SIZE_SCALE+RING_WIDTH), color)
	}


	////////////////////////////////////////////////////////
	//                 Debug Boid Vision
	////////////////////////////////////////////////////////
	// this is kinda Copypasta from the real code.
	/*
	// draw the boid rays, not all of them though
	for i := range min(len(boid_sim.Boids), 10) {
		boid := boid_sim.Boids[i]
		rays := boid_sim.get_boid_rays(boid)

		combined_ray := Vec2[Boid_Float]{}

		for _, ray := range rays {
			dist_sqr, pos := boid_sim.ray_collide_against_all_lines_and_find_smallest(ray)

			// should be zero when it sees nothing, otherwise provides a push in the other direction.
			new_force := Sub(pos, Vec2[Boid_Float]{ray.x2, ray.y2})
			new_force.Mult(boid_sim.props.Visual_Range - Sqrt(dist_sqr))

			combined_ray.Add(new_force)

			ray = Scale(ray, scale_factor)
			pos.Mult(scale_factor)

			Draw_Line_l(img, ray, rgba(245, 130, 22, 0.5))

			Draw_Circle_v(img, pos, 5, rgba(20, 228, 228, 0.5))
		}

		combined_ray.Mult(1 / Boid_Float(boid_sim.props.Num_Boid_Rays))

		combined_ray.Add(boid.Position)
		combined_ray.Mult(scale_factor)

		Draw_Line(img, Mult(boid.Position, scale_factor), combined_ray, rgba(165, 33, 143, 1))
		Draw_Circle_v(img, combined_ray, 5, rgba(235, 41, 41, 1))
	}
	*/


	// { // debug mouse pos
	// 	color := Color_Yellow()
	// 	if mouse_state == Left_down { color = Color_Red() }

	// 	Draw_Rect(
	// 		img,
	// 		mouse_pos.X, mouse_pos.Y, 10, 10,
	// 		color,
	// 	)
	// }
}

// https://easings.net
func ease_out_quint[T Float](x T) T {
	xp := 1 - x
	return 1 - (xp*xp*xp*xp*xp);
}
// https://easings.net
func ease_in_out_quint[T Float](x T) T {
	if x < 0.5 {
		return 16 * x * x * x * x * x
	} else {
		return T(1 - math.Pow(-2 * float64(x) + 2, 5) / 2)
	}
}


func draw_spacial_array_into_image[T Number](img *Image, sp_array Spacial_Array[T], scale T) {

	min_x, min_y := sp_array.Min_x, sp_array.Min_y
	max_x, max_y := sp_array.Max_x, sp_array.Max_y

	// width and height
	w, h := sp_array.Max_x-sp_array.Min_x, sp_array.Max_y-sp_array.Min_y

	// how big the boxes are.
	step_x, step_y := w/T(sp_array.Boxes_wide), h/T(sp_array.Boxes_high)

	{ // draw the outsides.

		bounding_box := [4]Vec2[T]{
			{x: min_x, y: min_y},
			{x: max_x, y: min_y},
			{x: max_x, y: max_y},
			{x: min_x, y: max_y},
		}
		for i := range len(bounding_box) { bounding_box[i].Mult(scale) }

		for i := range len(bounding_box) {
			Draw_Line(
				img,
				bounding_box[i],
				bounding_box[(i+1)%len(bounding_box)],
				rgb(223, 223, 223),
			)
		}
	}

	{ // now draw the inner lines.
		inner_color := rgb(163, 21, 21)

		// Vertical
		for i := 1; i < sp_array.Boxes_wide; i++ {
			x := sp_array.Min_x + step_x*T(i)

			p1 := Vec2[T]{x: x, y: sp_array.Min_y}
			p2 := Vec2[T]{x: x, y: sp_array.Max_y}

			p1.Mult(scale)
			p2.Mult(scale)

			Draw_Line(img, p1, p2, inner_color)
		}

		// Horizontal
		for j := 1; j < sp_array.Boxes_high; j++ {
			y := sp_array.Min_y + step_y*T(j)

			p1 := Vec2[T]{x: sp_array.Min_x, y: y}
			p2 := Vec2[T]{x: sp_array.Max_x, y: y}

			p1.Mult(scale)
			p2.Mult(scale)

			Draw_Line(img, p1, p2, inner_color)
		}
	}

	{ // finally, draw the cells that contain the boids. (intensity on how many boids.)
		for j := range sp_array.Boxes_high {
			for i := range sp_array.Boxes_wide {
				// where we are,
				x := sp_array.Min_x + step_x*T(i)
				y := sp_array.Min_y + step_y*T(j)

				// if there is some points in the box, show a color.
				box := &sp_array.Boxes[j*sp_array.Boxes_wide+i]
				if box.Count == 0 { continue }

				// The colors from blue to red.
				// it would be better if we had something that could blend a color.
				const start_number = 230
				const end_number = 360

				fill_amount := float32(box.Count) / BOX_SIZE
				fill_amount = min(fill_amount, 1)

				blended := Lerp(start_number, end_number, fill_amount)

				// fade alpha based on how many points are in it.
				faded_color := HSL_to_RGB(blended, 0.9, 0.5)

				Draw_Rect(img, x*scale, y*scale, step_x*scale, step_y*scale, faded_color)
			}
		}
	}
}



// -----------------------------------------
//   Code for testing Color interpolation.
// -----------------------------------------

// { // Test Color interpolation
// 	const STEP = 10
// 	for i := 0; i < img.Width; i += STEP {
// 		const start_number = 230
// 		const end_number = 360

// 		percent := float32(i) / float32(img.Width)
// 		color := HSL_to_RGB(lerp(start_number, end_number, percent), 0.9, 0.5)
// 		Draw_Rect(img, i, 0, STEP, 25, color)
// 	}
// }

// -----------------------------------------
// Code for testing random number generator.
// -----------------------------------------

// {
// 	test_color := HSL_to_RGB(180, 0.75, 0.6)

// 	// Test random generator.
// 	new_random_number := nocheckin_generator.Next(float32(nocheckin_dt) * 0.25)

// 	h := img.Height / 2
// 	x := new_random_number * float32(img.Width)
// 	Draw_Rect(img, int(x-10), h, 20, 20, test_color)

// 	unit_vector := Make_Vec2[float32](1, 0)
// 	theta := new_random_number * 2 * math.Pi

// 	rotated := Rotate(unit_vector, theta)
// 	// give it some length
// 	rotated.Mult(300)
// 	// move to center
// 	rotated.Add(Make_Vec2(float32(img.Width)/2, float32(img.Height)/2))

// 	Draw_Circle(img, rotated.X, rotated.Y, 10, test_color)

// 	p1 := Make_Vec2(float32(img.Width/2), float32(img.Height/2))
// 	Draw_Line(img, p1, rotated, test_color)

// // for testing. move these to global scope.
// 	var nocheckin_generator = New_Random_Generator(true)
// 	var nocheckin_dt = 0.0

// }

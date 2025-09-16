package main

import (
	"math"
	"time"
)

const DEBUG_SPACIAL_ARRAY = false
const DEBUG_BOUNDARY      = true
const DEBUG_HEADING       = false
const DEBUG_VISUAL_RANGES = false
const DEBUG_RECTANGLES    = false


// multiply by this to map boid space into image space.
const SCALE_FACTOR = 1 / BOID_SCALE


// TODO have some sort of view mode here, so we can 'move' the 'camera'
//
// go incorrectly reports this function as unused if it is not public...
func Draw_Everything(img *Image, boid_sim *Boid_simulation, dt float64, input Input_Status) {
	Draw_Cool_Background(img, boid_sim, dt, input)

	if DEBUG_SPACIAL_ARRAY {
		draw_spacial_array_into_image(img, boid_sim.Spacial_array, SCALE_FACTOR)
	}

	if DEBUG_BOUNDARY && boid_sim.props.Toggle_Bounding {
		boid_boundary_color := rgb(240, 240, 240)

		margin := int(boid_sim.props.Margin * SCALE_FACTOR)
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
			x := b.Position.x * SCALE_FACTOR
			y := b.Position.y * SCALE_FACTOR
			r := boid_sim.props.Visual_Range * SCALE_FACTOR
			Draw_Circle(img, x, y, r, visual_radius_color)
		}

		// Draw minimum visual radius. (for separation.)
		minimum_radius_color := HSL_to_RGB(270, 0.7, 0.7)
		for _, b := range boid_sim.Boids {
			x := b.Position.x * SCALE_FACTOR
			y := b.Position.y * SCALE_FACTOR
			r := boid_sim.props.Separation_Min_Distance * SCALE_FACTOR
			Draw_Circle(img, x, y, r, minimum_radius_color)
		}
	}

	if DEBUG_RECTANGLES {
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
				boundary_points[i].x *= SCALE_FACTOR
				boundary_points[i].y *= SCALE_FACTOR
			}

			for i := range len(boundary_points) {
				Draw_Line(img, boundary_points[i], boundary_points[(i+1)%len(boundary_points)], rgb(240, 14, 14))
			}
		}
	}

	{ // Walls / Lines
		for _, line := range boid_sim.Walls {
			p1, p2 := line.to_vec()
			p1.Mult(SCALE_FACTOR)
			p2.Mult(SCALE_FACTOR)
			Draw_Line(img, p1, p2, rgb(240, 14, 14))
		}
	}

	if boid_sim.making_new_wall {
		p1 := Mult(boid_sim.new_wall_start, SCALE_FACTOR)
		p2 := Mult(input.Mouse_Pos, SCALE_FACTOR)

		const NUM_ROTATIONS_PER_SECOND = 0.25
		t := Proper_Mod(Get_Time(), 10000)
		added := 2 * math.Pi * Boid_Float(t) * NUM_ROTATIONS_PER_SECOND

		Draw_Triangles_Circling(img, p1, 8, 20, added, rgba(30, 236, 202, 1))
		Draw_Triangles_Circling(img, p2, 8, 20, added, rgba(30, 236, 202, 1))

		color := rgb(236, 236, 10)
		if input.Middle_Held { color = rgb(10, 245, 10) }
		Draw_Line(img, p1, p2, color)
	}

	// NOTE i would put this in a go routine, but wasm doesn't do multithreading, fuck
	for _, b := range boid_sim.Boids {
		// img.Draw_Circle(int(b.Position.X*scale_factor), int(b.Position.Y*scale_factor), BOID_DRAW_RADIUS, boid_color2)

		// put them in img space
		b.Position.Mult(SCALE_FACTOR)

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

			boid_shape[i].Mult(boid_sim.props.Boid_Radius * SCALE_FACTOR)
			boid_shape[i].Add(b.Position)
		}

		// get cool color for boid
		//
		// 100 <- random number, no basis in reality
		// used to be based on Max_Speed but we got rid of that
		// speed := b.Velocity.Mag() / 100
		speed := b.Velocity.Mag() / 40

		const SHIFT_FACTOR = 1
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
		pos.Mult(SCALE_FACTOR) // into world co-ord's

		time := pos_and_time.Time
		secs := float32(now.Sub(time).Seconds())
		percent := secs / CLICK_FADE_TIME

		color := rgba(226, 226, 226, 0.77)
		color.Set_Alpha(1 - ease_in_out_quint(percent))

		// in image pixels
		const SIZE = 20
		// in image pixels
		const RING_WIDTH = 2

		size_factor := Boid_Float(ease_out_quint(percent))
		Draw_Ring(
			img,
			pos.x, pos.y,
			size_factor*SIZE, size_factor*SIZE+RING_WIDTH,
			color,
		)
	}


	// { // debug mouse pos
	// 	center   := Mult(input.Mouse_Pos, SCALE_FACTOR)
	// 	// adjusted := center
	// 	// adjusted.x *= 1.01

	// 	const LEN = 10

	// 	Draw_Line(
	// 		img,
	// 		Add(center, Vec2[Boid_Float]{0, -LEN}),
	// 		Add(center, Vec2[Boid_Float]{0,  LEN}),
	// 		rgba(76, 114, 240, 1),
	// 	)
	// 	Draw_Line(
	// 		img,
	// 		Add(center, Vec2[Boid_Float]{-LEN, 0}),
	// 		Add(center, Vec2[Boid_Float]{ LEN, 0}),
	// 		rgba(76, 114, 240, 1),
	// 	)

	// 	// Draw_Line(
	// 	// 	img,
	// 	// 	Add(adjusted, Vec2[Boid_Float]{0, -LEN}),
	// 	// 	Add(adjusted, Vec2[Boid_Float]{0,  LEN}),
	// 	// 	rgba(235, 126, 83, 1),
	// 	// )
	// 	// Draw_Line(
	// 	// 	img,
	// 	// 	Add(adjusted, Vec2[Boid_Float]{-LEN, 0}),
	// 	// 	Add(adjusted, Vec2[Boid_Float]{ LEN, 0}),
	// 	// 	rgba(235, 126, 83, 1),
	// 	// )
	// }

	// {
	// 	center := Mult(input.Mouse_Pos, scale_factor)

	// 	const NUM_ROTATIONS_PER_SECOND = 0.25
	// 	t := Proper_Mod(Get_Time(), 10000)
	// 	added := 2 * math.Pi * Boid_Float(t) * NUM_ROTATIONS_PER_SECOND

	// 	Draw_Triangles_Circling(img, center, 8, 20, added, rgba(30, 236, 202, 1))
	// }



	/*
	var high_water_mark = 0 // this is a global
	{
		sp_array := &boid_sim.Spacial_array
		maximum_in_boxes := 0
		for i := range len(sp_array.Boxes) {
			box := &sp_array.Boxes[i]

			count := 0
			for box != nil {
				count += int(box.Count)
				box = box.Next
			}

			maximum_in_boxes = max(maximum_in_boxes, count)
		}

		high_water_mark = max(high_water_mark, maximum_in_boxes)
		fmt.Printf("High Water Mark: %d, current max %d\n", high_water_mark, maximum_in_boxes)
	}
	*/
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



const (
	// If I crank this number up to high,
	// it effects the startup time.
	//
	// Would like to remove it entirely, but we need the colors to be consistent...
	//
	// maybe have the colors generated only when we need them?
	// and use a hashmap to store the positions.
	NUM_BOX_WIDE  = 256
	NUM_BOX_HIGH  = NUM_BOX_WIDE / 2

	BOX_WIDTH     = 25
	BOX_HEIGHT    = BOX_WIDTH

	BOX_MARGIN    = 3
	BOX_INNER_PAD = 3

	// in bob's per second
	BOX_BOB_SPEED = 0.25
	BOX_BOB_MAX_OFFSET = 10

	BOX_PATTERNS_REPEAT_EVERY = 10
	
	PI = math.Pi
)

var box_y_offsets [NUM_BOX_WIDE * NUM_BOX_HIGH]float64
var box_colors    [NUM_BOX_WIDE * NUM_BOX_HIGH]Color

func init() {
	for j := range NUM_BOX_HIGH {
		for i := range NUM_BOX_WIDE {
			box_y_offset := &box_y_offsets[j * NUM_BOX_WIDE + i]
			box_color    := &box_colors   [j * NUM_BOX_WIDE + i]

			// box.offset_y = rand_f64() * 10
			const INDEX_OFFSET = 2 * PI / BOX_PATTERNS_REPEAT_EVERY
			// if the offset is deterministic, we could calculate this in
			// the main loop and not store it here, but i think the
			// 'HSL_to_RGB()' is the slow thing, not this
			*box_y_offset = float64(i) * INDEX_OFFSET + float64(j) * INDEX_OFFSET


			// a very muted rainbow color.
			*box_color = HSL_to_RGB(rand_f32() * 360, 0.35, 0.05)
			// *box_color = rgb(51, 51, 51)
		}
	}
}


// so we don't have to call the sin function for every box.
const PRECOMPUTED_OFFSET_TABLE_SIZE = 64
var precomputed_offset_table [PRECOMPUTED_OFFSET_TABLE_SIZE]int

func init() {
	for i := range PRECOMPUTED_OFFSET_TABLE_SIZE {
		x := float64(i) / PRECOMPUTED_OFFSET_TABLE_SIZE * 2 * PI
		precomputed_offset_table[i] = Round(math.Sin(x) * BOX_BOB_MAX_OFFSET)
	}
}

// t should not be negative.
func get_y_offset(t float64) int {
	const T_MULT = PRECOMPUTED_OFFSET_TABLE_SIZE / (2 * PI)
	index := int(t * T_MULT) % PRECOMPUTED_OFFSET_TABLE_SIZE
	return precomputed_offset_table[index]
}


func Draw_Cool_Background(img *Image, boid_sim *Boid_simulation, dt float64, input Input_Status) {
	// this call is super slow.
	//
	// who knew that writing to over a million pixels would be so slow?
	img.Clear_background(rgb(29, 29, 29))


	t := Get_Time_Repeating()
	time_base := PI * 2 * BOX_BOB_SPEED * t

	// +1 and +2 here to get the ones that are offscreen as well.
	height_to_check := Div_Ceil(img.Height, BOX_HEIGHT) + 2
	width_to_check := Div_Ceil(img.Width, BOX_WIDTH) + 1

	for j := range height_to_check {
		for i := range width_to_check {
			box_y_offset := box_y_offsets[j * NUM_BOX_WIDE + i]
			box_color    := box_colors   [j * NUM_BOX_WIDE + i]

			// starting positions
			//
			// -1 is so it appears offscreen as well.
			x := (i-1) * BOX_WIDTH
			y := (j-1) * BOX_HEIGHT
			w, h := BOX_WIDTH, BOX_HEIGHT

			y += get_y_offset(time_base + box_y_offset)

			// NOTE this is the slow part of rendering, we draw an insane
			// amount of these things, and each of them calls
			// 'draw_rect_no_blend' 4 times.
			Draw_Rect_Outline(
				img,
				x + BOX_MARGIN, y + BOX_MARGIN,
				w - BOX_MARGIN*2, h - BOX_MARGIN*2,
				BOX_INNER_PAD,
				box_color,
			)
		}
	}
}




///////////////////////////////////////////////////////////
//                 Code Grave Yard
///////////////////////////////////////////////////////////



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

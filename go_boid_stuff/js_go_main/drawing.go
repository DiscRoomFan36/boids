package main

import (
	"math"

	"boidstuff.com/Image"
	spacialarray "boidstuff.com/Spacial_Array"
	"boidstuff.com/Vector"
	"boidstuff.com/boid"
)

const DEBUG_SPACIAL_ARRAY = false
const DEBUG_BOUNDARY = true
const DEBUG_HEADING = true
const DEBUG_VISUAL_RANGES = false

var boid_heading_color = Image.Color{R: 10, G: 240, B: 10, A: 255}
var boid_boundary_color = Image.Color{R: 240, G: 240, B: 240, A: 255}

type Boid_Float = boid.Boid_Float

// TODO have some sort of view mode here, so we can 'move' the 'camera'
//
// go incorrectly reports this function as unused if it is not public...
func Draw_boids_into_image(img *Image.Image, boid_sim *boid.Boid_simulation) {

	img.Clear_background(Image.Color{R: 24, G: 24, B: 24, A: 255})

	// we map the world-space to match the image space
	scale_factor := boid.Boid_Float(img.Width) / boid_sim.Width

	if DEBUG_SPACIAL_ARRAY {
		// // TODO this is giga slow... and do we even have to do it?
		boid_sim.Set_up_Spacial_Array()
		draw_spacial_array_into_image(img, boid_sim.Spacial_array, scale_factor)
	}

	if DEBUG_BOUNDARY {
		margin := int(boid_sim.Margin * scale_factor)
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

	if DEBUG_VISUAL_RANGES {
		// Draw visual radius.
		visual_radius_color := Image.HSL_to_RGB(50, 0.7, 0.9)
		for _, b := range boid_sim.Boids {
			x := int(b.Position.X * scale_factor)
			y := int(b.Position.Y * scale_factor)
			r := int(boid_sim.Visual_Range * scale_factor)
			Image.Draw_Circle(img, x, y, r, visual_radius_color)
		}

		// Draw minimum visual radius. (for separation.)
		minimum_radius_color := Image.HSL_to_RGB(270, 0.7, 0.7)
		for _, b := range boid_sim.Boids {
			x := int(b.Position.X * scale_factor)
			y := int(b.Position.Y * scale_factor)
			r := int(boid_sim.Separation_Min_Distance * scale_factor)
			Image.Draw_Circle(img, x, y, r, minimum_radius_color)
		}
	}

	// NOTE i would put this in a go routine, but wasm doesn't do multithreading, fuck
	for _, b := range boid_sim.Boids {
		// img.Draw_Circle(int(b.Position.X*scale_factor), int(b.Position.Y*scale_factor), BOID_DRAW_RADIUS, boid_color2)

		// put them in img space
		b.Position.Mult(scale_factor)

		// Draw boid body
		// TODO maybe some LOD shit, where its just a triangle? 2x speed?
		boid_shape := [4]Vector.Vector2[Boid_Float]{
			{X: 0, Y: 1},      // tip
			{X: 0, Y: -0.5},   // back
			{X: 1, Y: -0.75},  // wing1
			{X: -1, Y: -0.75}, // wing2
		}

		// Rotate to face them in the right direction
		theta := Vector.GetTheta(b.Velocity) - math.Pi/2
		// TODO i also think this is slowing us down, put in own function
		for i := 0; i < len(boid_shape); i++ {
			// someone who knows math explain this
			boid_shape[i] = Vector.Rotate(boid_shape[i], theta)

			boid_shape[i].Mult(boid_sim.Boid_Draw_Radius * scale_factor)
			boid_shape[i].Add(b.Position)
		}

		// get cool color for boid

		speed := b.Velocity.Mag() / boid_sim.Max_Speed

		clamp := func(x, mini, maxi Boid_Float) Boid_Float {
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

func draw_spacial_array_into_image[T Vector.Number](img *Image.Image, sp_array spacialarray.Spacial_Array[T], scale T) {

	min_x, min_y := sp_array.Min_x, sp_array.Min_y
	max_x, max_y := sp_array.Max_x, sp_array.Max_y

	// width and height
	w, h := sp_array.Max_x-sp_array.Min_x, sp_array.Max_y-sp_array.Min_y

	// how big the boxes are.
	step_x, step_y := w/T(sp_array.Boxes_wide), h/T(sp_array.Boxes_high)

	{
		// draw the outsides.
		var outer_color = Image.Color{R: 255, G: 255, B: 255, A: 255} // WHITE.

		bounding_box := [4]Vector.Vector2[T]{
			{X: min_x, Y: min_y},
			{X: max_x, Y: min_y},
			{X: max_x, Y: max_y},
			{X: min_x, Y: max_y},
		}
		for i := 0; i < len(bounding_box); i++ {
			bounding_box[i].Mult(scale)
		}

		for i := 0; i < len(bounding_box); i++ {
			Image.Draw_Line(
				img,
				bounding_box[i],
				bounding_box[(i+1)%len(bounding_box)],
				outer_color,
			)
		}
	}

	{ // now draw the inner lines.
		var inner_color = Image.Color{R: 255, G: 0, B: 0, A: 255}

		// Vertical
		for i := 1; i < sp_array.Boxes_wide; i++ {
			x := sp_array.Min_x + step_x*T(i)

			p1 := Vector.Vector2[T]{X: x, Y: sp_array.Min_y}
			p2 := Vector.Vector2[T]{X: x, Y: sp_array.Max_y}

			p1.Mult(scale)
			p2.Mult(scale)

			Image.Draw_Line(img, p1, p2, inner_color)
		}

		// Horizontal
		for j := 1; j < sp_array.Boxes_high; j++ {
			y := sp_array.Min_y + step_y*T(j)

			p1 := Vector.Vector2[T]{X: sp_array.Min_x, Y: y}
			p2 := Vector.Vector2[T]{X: sp_array.Max_x, Y: y}

			p1.Mult(scale)
			p2.Mult(scale)

			Image.Draw_Line(img, p1, p2, inner_color)
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
				if box.Count == 0 {
					continue
				}

				// The colors from blue to red.
				// it would be better if we had something that could blend a color.
				const start_number = 230
				const end_number = 360

				fill_amount := float32(box.Count) / spacialarray.BOX_SIZE
				fill_amount = min(fill_amount, 1)

				blended := lerp(start_number, end_number, fill_amount)

				// fade alpha based on how many points are in it.
				faded_color := Image.HSL_to_RGB(blended, 0.9, 0.5)

				Image.Draw_Rect(img, int(x*scale), int(y*scale), int(step_x*scale), int(step_y*scale), faded_color)
			}
		}
	}

	// { // Test Color interpolation
	// 	const STEP = 10
	// 	for i := 0; i < img.Width; i += STEP {
	// 		const start_number = 230
	// 		const end_number = 360

	// 		percent := float32(i) / float32(img.Width)
	// 		color := Image.HSL_to_RGB(lerp(start_number, end_number, percent), 0.9, 0.5)
	// 		Image.Draw_Rect(img, i, 0, STEP, 25, color)
	// 	}
	// }
}

func lerp(a, b, t float32) float32 {
	return (1-t)*a + t*b
}

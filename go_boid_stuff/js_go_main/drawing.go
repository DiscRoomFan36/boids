package main

import (
	"log"
	"math"

	"boidstuff.com/Image"
	quadtree "boidstuff.com/Quadtree"
	"boidstuff.com/Vector"
	"boidstuff.com/boid"
)

const DEBUG_QUADTREE = false
const DEBUG_BOUNDARY = true
const DEBUG_HEADING = true

var boid_heading_color = Image.Color{R: 10, G: 240, B: 10, A: 255}
var boid_boundary_color = Image.Color{R: 240, G: 240, B: 240, A: 255}

type Boid_Float = boid.Boid_Float

// TODO have some sort of view mode here, so we can 'move' the 'camera'
func draw_boids_into_image(img *Image.Image, boid_sim *boid.Boid_simulation) {

	// func (boid_sim boid.Boid_simulation) Draw_Into_Image(img *Image.Image) {
	img.Clear_background(Image.Color{R: 24, G: 24, B: 24, A: 255})

	// we map the world-space to match the image space
	scale_factor := boid.Boid_Float(img.Width) / boid_sim.Width

	if DEBUG_QUADTREE {
		// TODO this is giga slow...
		boid_sim.Set_up_quadtree() // so our visualization is accurate
		draw_quadtree_onto_image(img, boid_sim.Quadtree, scale_factor)
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
		theta := Vector.GetTheta(b.Velocity)
		// TODO i don't think the wings are rotating right. hmmm
		// TODO this is broken...
		to_rotate := theta
		if b.Velocity.Y > 0 {
			to_rotate = -theta
		}
		// TODO i also think this is slowing us down, put in own function
		for i := 0; i < len(boid_shape); i++ {
			// someone who knows math explain this
			boid_shape[i] = Vector.Rotate(boid_shape[i], to_rotate)

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

func draw_quadtree_onto_image[T Vector.Number](img *Image.Image, my_quadtree quadtree.Quadtree[T], scale T) {
	// scale = 1 / scale
	var outer_color = Image.Color{R: 255, G: 255, B: 255, A: 255}

	root_node := my_quadtree.Child_array[0]
	// fmt.Printf("root children? %v\n", quadtree.child_array)

	{ // draw bounding box
		x, y, w, h := root_node.Boundary.Splat()

		// these guys are messing up, fix them then onto colors
		bounding_box := [4]Vector.Vector2[T]{
			{X: x, Y: y},
			{X: x + w, Y: y},
			{X: x + w, Y: y + h},
			{X: x, Y: y + h},
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

	type tuple struct {
		id    quadtree.Node_ID_Type
		depth int
	}

	draw_cross := func(checking quadtree.Node_ID_Type, depth int) Image.Color {
		node := my_quadtree.Child_array[checking]

		H := math.Mod(float64(depth)/10*360, 360)
		inner_color := Image.HSL_to_RGB(H, 0.8, 0.5)

		x, y, w, h := node.Boundary.Splat()

		points := [4]Vector.Vector2[T]{
			{X: x + w/2, Y: y},     // TOP
			{X: x + w/2, Y: y + h}, // BOTTOM
			{X: x, Y: y + h/2},     // LEFT
			{X: x + w, Y: y + h/2}, // RIGHT
		}

		for i := 0; i < len(points); i++ {
			points[i].Mult(scale)
		}

		// top to bottom
		Image.Draw_Line(img, points[0], points[1], inner_color)

		// left to right
		Image.Draw_Line(img, points[2], points[3], inner_color)

		return inner_color
	}

	// Start with root node
	stack := make([]tuple, 1, 4)
	stack[0] = tuple{0, 0}

	for len(stack) > 0 {
		tup := stack[len(stack)-1]
		stack = stack[:len(stack)-1]

		checking := tup.id
		depth := tup.depth

		node := my_quadtree.Child_array[checking]
		if node.Children_start_index == 0 {
			continue
		}

		draw_cross(checking, depth)

		if node.Children_start_index == 0 {
			log.Fatalf("a node cannot have child 0 at this time. node: %v\n", node)
		}

		for i := 0; i < quadtree.QT_CHILDREN_LENGTH; i++ {
			stack = append(stack, tuple{id: node.Children_start_index + quadtree.Node_ID_Type(i), depth: depth + 1})
		}
	}

	// Start with root node
	// recur(0, outer_color)
}

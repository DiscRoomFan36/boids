package quadtree

import (
	"fmt"
	"log"
	"os"

	"boidstuff.com/Image"
	"boidstuff.com/Vector"
)

// this whole thing is pseudocode from: https://en.wikipedia.org/wiki/Quadtree

const DEBUG_INSERTION = false

// Axis-aligned bounding box with half dimension and center
type Rectangle[T Vector.Number] struct {
	// Bottom_left Vector.Vector2[T]
	// dimension aka width/height
	// Dim T
	x, y, w, h T
	// width T
	// height T
	// center        Vector.Vector2[T]
	// half dimension
	// halfDim T
}

func (r Rectangle[Number]) Splat() (Number, Number, Number, Number) {
	return r.x, r.y, r.w, r.h
}

func Make_Rectangle[T Vector.Number](x, y, w, h T) Rectangle[T] {
	return Rectangle[T]{
		x: x,
		y: y,
		w: w,
		h: h,
		// Bottom_left: Vector.Vector2[T]{X: x, Y: y},
		// Dim:         dim,
	}
}

// nodes are [X, X+width), i keep flip flopping between [, ] and [, )
func (rect Rectangle[T]) containsPoint(p Vector.Vector2[T]) bool {
	// return (aabb.center.X-aabb.halfDim <= p.X) && (p.X < aabb.center.X+aabb.halfDim) &&
	// 	(aabb.center.Y-aabb.halfDim <= p.Y) && (p.Y < aabb.center.Y+aabb.halfDim)

	// return (aabb.Bottom_left.X <= p.X) && (p.X <= aabb.Bottom_left.X+aabb.Dim) &&
	// 	(aabb.Bottom_left.Y <= p.Y) && (p.Y <= aabb.Bottom_left.Y+aabb.Dim)

	// return (aabb.Bottom_left.X <= p.X) && (p.X < aabb.Bottom_left.X+aabb.Dim) &&
	// 	(aabb.Bottom_left.Y <= p.Y) && (p.Y < aabb.Bottom_left.Y+aabb.Dim)

	return (rect.x <= p.X) && (p.X < rect.x+rect.w) &&
		(rect.y <= p.Y) && (p.Y < rect.y+rect.h)
}

// help from: https://jeffreythompson.org/collision-detection/rect-rect.php
func (r1 Rectangle[T]) rect_rect_collision(r2 Rectangle[T]) bool {
	return (r1.x+r1.w >= r2.x &&
		r1.x <= r2.x+r2.w &&
		r1.y+r1.h >= r2.y &&
		r1.y <= r2.y+r2.h)
}

func Circle_To_Rectangle[T Vector.Number](pos Vector.Vector2[T], r T) Rectangle[T] {
	return Rectangle[T]{
		x: pos.X - (r / 2),
		y: pos.Y - (r / 2),
		w: r * 2,
		h: r * 2,
		// Bottom_left: Vector.Vector2[T]{
		// 	X: pos.X - (r / 2),
		// 	Y: pos.Y - (r / 2),
		// },
		// Dim: r * 2,
	}
}

const QT_NODE_CAPACITY = 4
const QT_CHILDREN_LENGTH = 4

// we can make this smaller, even let the user change this to their needs
type Node_ID_Type uint16
type Points_ID_Type uint16

type Quadtree_node[T Vector.Number] struct {
	// Axis-aligned bounding box stored as a center with half-dimensions
	// to represent the boundaries of this quad tree
	Boundary Rectangle[T]

	// Points in this quad tree node (is actually their index)
	num_points uint8 // this is as small as possible
	points     [QT_NODE_CAPACITY]Points_ID_Type

	// an array of index's
	// children [QT_CHILDREN_LENGTH]Node_ID_Type

	// the index, and the next QT_CHILDREN_LENGTH belong to this node
	children_start_index Node_ID_Type
}

func new_Node[T Vector.Number](boundary Rectangle[T]) Quadtree_node[T] {
	return Quadtree_node[T]{
		Boundary: boundary,

		num_points: 0,
		points:     [QT_NODE_CAPACITY]Points_ID_Type{},

		// children: [QT_CHILDREN_LENGTH]Node_ID_Type{},
		children_start_index: 0,
	}
}

// TODO make better
type Quadtree[T Vector.Number] struct {
	// this holds an array of all the points, you supposed to just call set_up then query the range a bunch
	all_points []Vector.Vector2[T]

	// array[0] is special, its the root nodes thing
	child_array []Quadtree_node[T]
}

func New_quadtree[T Vector.Number]() Quadtree[T] {
	child_array := make([]Quadtree_node[T], 1)
	child_array[0] = Quadtree_node[T]{
		Boundary: Rectangle[T]{},
		// children: [QT_CHILDREN_LENGTH]Node_ID_Type{0},
		children_start_index: 0,
	}

	return Quadtree[T]{
		child_array: child_array,
	}
}

func (quadtree *Quadtree[T]) Setup_tree(points []Vector.Vector2[T]) int {
	// Setup the bounds
	min_x := points[0].X
	max_x := points[0].X
	min_y := points[0].Y
	max_y := points[0].Y
	for _, p := range points {
		min_x = min(min_x, p.X)
		max_x = max(max_x, p.X)
		min_y = min(min_y, p.Y)
		max_y = max(max_y, p.Y)
	}
	if max(max_x-min_x, max_y-min_y) < 1 {
		log.Fatalf("our bounds is to small for my feeble mind\n")
	}
	quadtree.child_array[0].Boundary = Make_Rectangle(
		min_x,
		min_y,
		max_x-min_x+1,
		max_y-min_y+1,
	)

	// this might be bad. meh. need to make it obvious that the quad tree doesn't own this
	quadtree.all_points = points

	// test if there is to many points
	// tests for integer overflow
	if int(Points_ID_Type(len(quadtree.all_points))) != len(quadtree.all_points) {
		log.Fatalf("To many points in array. %v != %v\n", Points_ID_Type(len(quadtree.all_points)), len(quadtree.all_points))

	}

	insert_point := func(index int) bool {

		p := quadtree.all_points[index]
		p_index := Points_ID_Type(index)

		// Start with root node
		stack := make([]Node_ID_Type, 1)
		stack[0] = 0

		for len(stack) > 0 {
			checking := stack[len(stack)-1]
			stack = stack[:len(stack)-1]

			node := &quadtree.child_array[checking]

			// Ignore objects that do not belong in this quad tree
			if !node.Boundary.containsPoint(p) {
				// return false
				continue
			}

			// If there is space in this quad tree and if doesn't have subdivisions, add the object here
			// NOTE children[0] == 0 is the root node and not allowed
			if node.num_points < QT_NODE_CAPACITY && node.children_start_index == 0 {
				node.points[node.num_points] = p_index
				node.num_points += 1
				return true
			}

			// Otherwise, subdivide and then add the point to whichever node will accept it
			if node.children_start_index == 0 {
				quadtree.subdivide(checking)
			}

			// We have to add the points/data contained in this quad array to the
			// new quads if we only want the last node to hold the data

			if node.children_start_index == 0 {
				log.Fatalf("a node cannot have child 0 at this time. node: %v\n", node)
			}

			// TODO make better
			stack = append(stack, node.children_start_index+0)
			stack = append(stack, node.children_start_index+1)
			stack = append(stack, node.children_start_index+2)
			stack = append(stack, node.children_start_index+3)
		}

		// NOTE because floats have some imprecision, sometimes this will happen. just notify the caller
		if DEBUG_INSERTION {
			fmt.Printf("UNREACHABLE: point didn't fit into any boundary. p: %v, self %v\n", p, quadtree.child_array[0].Boundary)
		}
		return false
	}

	bad_points := 0
	for i := 0; i < len(points); i++ {
		if !insert_point(i) {
			bad_points += 1
		}
	}

	return bad_points
}

func (quadtree *Quadtree[T]) subdivide(node_index Node_ID_Type) {
	node := &quadtree.child_array[node_index]

	total_nodes := len(quadtree.child_array) + 4
	if int(Node_ID_Type(total_nodes)) != total_nodes {
		log.Fatalf("opp's, the Node_ID_Type is to small to hold all the nodes. %v\n", total_nodes)
	}

	x, y, w, h := node.Boundary.Splat()

	// north -, west -, east +, south +
	nw := Make_Rectangle(x, y, w/2, h/2)
	ne := Make_Rectangle(x+w/2, y, w/2, h/2)
	sw := Make_Rectangle(x, y+h/2, w/2, h/2)
	se := Make_Rectangle(x+w/2, y+h/2, w/2, h/2)

	if QT_CHILDREN_LENGTH != 4 {
		os.Exit(4)
	}

	dirs := [QT_CHILDREN_LENGTH]Rectangle[T]{nw, ne, sw, se}

	new_nodes := [QT_CHILDREN_LENGTH]Quadtree_node[T]{}
	for i := 0; i < QT_CHILDREN_LENGTH; i++ {
		new_nodes[i] = new_Node(dirs[i])
	}

	start_index := Node_ID_Type(len(quadtree.child_array))

	quadtree.child_array = append(quadtree.child_array, new_nodes[:]...)
	// quadtree.child_array = append(quadtree.child_array, nw, ne, sw, se)

	node.children_start_index = start_index

	// for i := 0; i < QT_CHILDREN_LENGTH; i++ {
	// 	node.children[i] = start_index + Node_ID_Type(i)
	// }

	// TODO we can make this one number
	// TODO we can make this one number
	// TODO we can make this one number
	// TODO we can make this one number
	// TODO we can make this one number
	// TODO we can make this one number
	// node.children[0] = start_index + 0
	// node.children[1] = start_index + 1
	// node.children[2] = start_index + 2
	// node.children[3] = start_index + 3
}

// returns the index, of the original passed in array
func (quadtree *Quadtree[T]) QueryRange(q_range Rectangle[T]) []Points_ID_Type {
	points_in_range := make([]Points_ID_Type, 0, 64)

	// Start with root node
	stack := make([]Node_ID_Type, 1, 64)
	stack[0] = 0

	for len(stack) > 0 {
		checking := stack[len(stack)-1]
		stack = stack[:len(stack)-1]

		node := &quadtree.child_array[checking]

		if !node.Boundary.rect_rect_collision(q_range) {
			continue
		}

		for i := 0; i < int(node.num_points); i++ {
			p_index := node.points[i]
			p := quadtree.all_points[p_index]

			if q_range.containsPoint(p) {
				points_in_range = append(points_in_range, p_index)
			}
		}

		if node.children_start_index == 0 {
			continue
		}

		if node.children_start_index == 0 {
			log.Fatalf("a node cannot have child 0 at this time. node: %v\n", node)
		}

		// TODO something better
		for i := 0; i < QT_CHILDREN_LENGTH; i++ {
			stack = append(stack, node.children_start_index+Node_ID_Type(i))
		}
	}

	return points_in_range
}

func (quadtree *Quadtree[T]) Clear() {
	quadtree.child_array = quadtree.child_array[:1]

	quadtree.child_array[0].num_points = 0

	// clear children
	// quadtree.child_array[0].children = [4]Node_ID_Type{}
	quadtree.child_array[0].children_start_index = 0

	// save the memory, we don't own this memory
	// quadtree.All_points = quadtree.All_points[:0]

}

// TODO think this breaks when scale != 1
func Draw_quadtree_onto[T Vector.Number](quadtree Quadtree[T], img *Image.Image, scale T) {
	// scale = 1 / scale
	var outer_color = Image.Color{R: 255, G: 255, B: 255, A: 255}

	root_node := quadtree.child_array[0]
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
		id Node_ID_Type
		c  Image.Color
	}

	draw_cross := func(checking Node_ID_Type, c Image.Color) Image.Color {
		node := quadtree.child_array[checking]

		// TODO something cooler
		inner_color := Image.Color{
			R: c.R - 50,
			G: c.G,
			B: c.B,
			A: 255,
		}

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
	stack[0] = tuple{0, outer_color}

	for len(stack) > 0 {
		tup := stack[len(stack)-1]
		stack = stack[:len(stack)-1]

		checking := tup.id
		c := tup.c

		node := quadtree.child_array[checking]
		if node.children_start_index == 0 {
			continue
		}

		inner_color := draw_cross(checking, c)

		if node.children_start_index == 0 {
			log.Fatalf("a node cannot have child 0 at this time. node: %v\n", node)
		}

		for i := 0; i < QT_CHILDREN_LENGTH; i++ {
			stack = append(stack, tuple{id: node.children_start_index + Node_ID_Type(i), c: inner_color})
		}
	}

	// Start with root node
	// recur(0, outer_color)
}

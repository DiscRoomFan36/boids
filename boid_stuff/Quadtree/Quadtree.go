package quadtree

import (
	"fmt"
	"log"

	"boidstuff.com/Image"
	"boidstuff.com/Vector"
)

// this whole thing is pseudocode from: https://en.wikipedia.org/wiki/Quadtree

const DEBUG_INSERTION = false

// Axis-aligned bounding box with half dimension and center
type Axis_aligned_bb[T Vector.Number] struct {
	// TODO use bottom aligned box,
	Bottom_left Vector.Vector2[T]
	// dimension aka width/height
	Dim T
	// center        Vector.Vector2[T]
	// half dimension
	// halfDim T
}

func Make_aabb[T Vector.Number](x, y, dim T) Axis_aligned_bb[T] {
	return Axis_aligned_bb[T]{
		Bottom_left: Vector.Vector2[T]{X: x, Y: y},
		Dim:         dim,
	}
}

// nodes are [X, X+width), i keep flip flopping between [, ] and [, )
func (aabb *Axis_aligned_bb[T]) containsPoint(p Vector.Vector2[T]) bool {
	// return (aabb.center.X-aabb.halfDim <= p.X) && (p.X < aabb.center.X+aabb.halfDim) &&
	// 	(aabb.center.Y-aabb.halfDim <= p.Y) && (p.Y < aabb.center.Y+aabb.halfDim)

	// return (aabb.Bottom_left.X <= p.X) && (p.X <= aabb.Bottom_left.X+aabb.Dim) &&
	// 	(aabb.Bottom_left.Y <= p.Y) && (p.Y <= aabb.Bottom_left.Y+aabb.Dim)

	return (aabb.Bottom_left.X <= p.X) && (p.X < aabb.Bottom_left.X+aabb.Dim) &&
		(aabb.Bottom_left.Y <= p.Y) && (p.Y < aabb.Bottom_left.Y+aabb.Dim)
	// Vector.Abs(p.X - aabb.center.X) < aabb.halfDimension
}

// help from: https://jeffreythompson.org/collision-detection/rect-rect.php
func (this *Axis_aligned_bb[T]) intersectsAABB(other Axis_aligned_bb[T]) bool {

	r1x := this.Bottom_left.X
	r1y := this.Bottom_left.Y
	r2x := other.Bottom_left.X
	r2y := other.Bottom_left.Y

	r1w := this.Dim
	r2w := other.Dim

	return (r1x+r1w >= r2x &&
		r1x <= r2x+r2w &&
		r1y+r1w >= r2y &&
		r1y <= r2y+r2w)
}

func Circle_To_AABB[T Vector.Number](pos Vector.Vector2[T], r T) Axis_aligned_bb[T] {
	return Axis_aligned_bb[T]{
		Bottom_left: Vector.Vector2[T]{
			X: pos.X - (r / 2),
			Y: pos.Y - (r / 2),
		},
		Dim: r * 2,
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
	Boundary Axis_aligned_bb[T]

	// Points in this quad tree node (is actually their index)
	num_points uint8 // this is as small as possible
	points     [QT_NODE_CAPACITY]Points_ID_Type

	// an array of index's
	children [QT_CHILDREN_LENGTH]Node_ID_Type
}

func new_Node[T Vector.Number](boundary Axis_aligned_bb[T]) Quadtree_node[T] {
	return Quadtree_node[T]{
		Boundary: boundary,

		num_points: 0,
		points:     [QT_NODE_CAPACITY]Points_ID_Type{},

		children: [QT_CHILDREN_LENGTH]Node_ID_Type{},
	}
}

// TODO make better
type Quadtree[T Vector.Number] struct {
	// this holds an array of all the points, you supposed to just call set_up then query the range a bunch
	All_points []Vector.Vector2[T]

	// array[0] is special, its the root nodes thing
	child_array []Quadtree_node[T]
}

func New_quadtree[T Vector.Number](aabb Axis_aligned_bb[T]) Quadtree[T] {
	child_array := make([]Quadtree_node[T], 1)
	child_array[0] = Quadtree_node[T]{
		Boundary: aabb,
		children: [QT_CHILDREN_LENGTH]Node_ID_Type{0, 0, 0, 0},
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
	quadtree.child_array[0].Boundary = Make_aabb(
		min_x,
		min_y,
		max(max_x-min_x, max_y-min_y)+1,
	)

	// this might be bad.
	quadtree.All_points = points

	// test if there is to many points
	// tests for integer overflow
	if int(Points_ID_Type(len(quadtree.All_points))) != len(quadtree.All_points) {
		log.Fatalf("To many points in array. %v != %v\n", Points_ID_Type(len(quadtree.All_points)), len(quadtree.All_points))

	}

	insert_point := func(index int) bool {

		p := quadtree.All_points[index]
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
			if node.num_points < QT_NODE_CAPACITY && node.children[0] == 0 {
				node.points[node.num_points] = p_index
				node.num_points += 1
				return true
			}

			// Otherwise, subdivide and then add the point to whichever node will accept it
			if node.children[0] == 0 {
				quadtree.subdivide(checking)
			}

			// We have to add the points/data contained in this quad array to the
			// new quads if we only want the last node to hold the data
			for i := 0; i < QT_CHILDREN_LENGTH; i++ {
				if node.children[i] == 0 {
					log.Fatalf("a node cannot have child 0 at this time. node: %v\n", node)
				}

				stack = append(stack, node.children[i])
				// if recur(node.children[i]) {
				// 	return true
				// }
			}

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

	dim_half := node.Boundary.Dim / 2

	nw := new_Node(Axis_aligned_bb[T]{
		Bottom_left: node.Boundary.Bottom_left,
		Dim:         dim_half,
	})
	ne := new_Node(Axis_aligned_bb[T]{
		Bottom_left: Vector.Vector2[T]{
			X: node.Boundary.Bottom_left.X + dim_half,
			Y: node.Boundary.Bottom_left.Y,
		},
		Dim: dim_half,
	})
	sw := new_Node(Axis_aligned_bb[T]{
		Bottom_left: Vector.Vector2[T]{
			X: node.Boundary.Bottom_left.X,
			Y: node.Boundary.Bottom_left.Y + dim_half,
		},
		Dim: dim_half,
	})
	se := new_Node(Axis_aligned_bb[T]{
		Bottom_left: Vector.Vector2[T]{
			X: node.Boundary.Bottom_left.X + dim_half,
			Y: node.Boundary.Bottom_left.Y + dim_half,
		},
		Dim: dim_half,
	})

	start_index := Node_ID_Type(len(quadtree.child_array))
	quadtree.child_array = append(quadtree.child_array, nw, ne, sw, se)

	// TODO we can make this one number
	node.children[0] = start_index + 0
	node.children[1] = start_index + 1
	node.children[2] = start_index + 2
	node.children[3] = start_index + 3
}

// returns the index, of the original passed in array
func (quadtree *Quadtree[T]) QueryRange(q_range Axis_aligned_bb[T]) []Points_ID_Type {
	points_in_range := make([]Points_ID_Type, 0)

	// Start with root node
	stack := make([]Node_ID_Type, 1)
	stack[0] = 0

	for len(stack) > 0 {
		checking := stack[len(stack)-1]
		stack = stack[:len(stack)-1]

		node := &quadtree.child_array[checking]

		if !node.Boundary.intersectsAABB(q_range) {
			continue
		}

		for i := 0; i < int(node.num_points); i++ {
			p_index := node.points[i]
			p := quadtree.All_points[p_index]

			if q_range.containsPoint(p) {
				points_in_range = append(points_in_range, p_index)
			}
		}

		if node.children[0] == 0 {
			continue
		}

		for i := 0; i < QT_CHILDREN_LENGTH; i++ {
			if node.children[i] == 0 {
				log.Fatalf("a node cannot have child 0 at this time. node: %v\n", node)
			}

			stack = append(stack, node.children[i])
		}
	}

	return points_in_range
}

func (quadtree *Quadtree[T]) Clear() {
	quadtree.child_array = quadtree.child_array[:1]

	quadtree.child_array[0].num_points = 0

	// clear children
	quadtree.child_array[0].children = [4]Node_ID_Type{}

	// save the memory
	quadtree.All_points = quadtree.All_points[:0]

	// quadtree.northWest = nil
	// quadtree.northEast = nil
	// quadtree.southWest = nil
	// quadtree.southEast = nil
}

// TODO think this breaks when scale != 1
func Draw_quadtree_onto[T Vector.Number](quadtree *Quadtree[T], img *Image.Image, scale T) {
	// scale = 1 / scale
	var outer_color = Image.Color{R: 255, G: 255, B: 255, A: 255}

	root_node := quadtree.child_array[0]
	root_node_boundary := root_node.Boundary

	// these guys are messing up, fix them then onto colors
	bounding_box := [4]Vector.Vector2[T]{
		{
			X: root_node_boundary.Bottom_left.X,
			Y: root_node_boundary.Bottom_left.Y,
		},
		{
			X: root_node_boundary.Bottom_left.X + root_node_boundary.Dim,
			Y: root_node_boundary.Bottom_left.Y,
		},
		{
			X: root_node_boundary.Bottom_left.X + root_node_boundary.Dim,
			Y: root_node_boundary.Bottom_left.Y + root_node_boundary.Dim,
		},
		{
			X: root_node_boundary.Bottom_left.X,
			Y: root_node_boundary.Bottom_left.Y + root_node_boundary.Dim,
		},
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

	var recur func(Node_ID_Type, Image.Color)
	recur = func(index Node_ID_Type, c Image.Color) {
		node := &quadtree.child_array[index]
		if node.children[0] == 0 {
			return
		}

		inner_color := Image.Color{
			R: c.R - 50,
			G: c.G,
			B: c.B,
			A: 255,
		}

		// TODO clean up, add a Center function on aabb
		points := [4]Vector.Vector2[T]{
			// TOP
			Vector.Add(node.Boundary.Bottom_left, Vector.Vector2[T]{
				X: node.Boundary.Dim / 2,
				Y: 0,
			}),
			// BOTTOM
			Vector.Add(node.Boundary.Bottom_left, Vector.Vector2[T]{
				X: node.Boundary.Dim / 2,
				Y: node.Boundary.Dim,
			}),
			// LEFT
			Vector.Add(node.Boundary.Bottom_left, Vector.Vector2[T]{
				X: 0,
				Y: node.Boundary.Dim / 2,
			}),
			// RIGHT
			Vector.Add(node.Boundary.Bottom_left, Vector.Vector2[T]{
				X: node.Boundary.Dim,
				Y: node.Boundary.Dim / 2,
			}),
		}
		for i := 0; i < len(points); i++ {
			points[i].Mult(scale)
		}

		// top to bottom
		Image.Draw_Line(
			img,
			points[0],
			points[1],
			inner_color,
		)

		// left to right
		Image.Draw_Line(
			img,
			points[2],
			points[3],
			inner_color,
		)

		for i := 0; i < QT_CHILDREN_LENGTH; i++ {
			if node.children[i] == 0 {
				log.Fatalf("a node cannot have child 0 at this time. node: %v\n", node)
			}

			recur(node.children[i], inner_color)
		}
	}

	// Start with root node
	recur(0, outer_color)
}

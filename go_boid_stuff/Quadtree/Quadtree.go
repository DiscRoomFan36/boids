package quadtree

import (
	"fmt"
	"iter"
	"log"
	"os"

	"boidstuff.com/Vector"
)

// this whole thing started as pseudocode from: https://en.wikipedia.org/wiki/Quadtree
// TODO use this guys notes more: https://stackoverflow.com/questions/41946007/efficient-and-well-explained-implementation-of-a-quadtree-for-2d-collision-det
// especially the part were the node doesn't store a bounding box

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
	return (rect.x <= p.X) && (p.X < rect.x+rect.w) &&
		(rect.y <= p.Y) && (p.Y < rect.y+rect.h)
}

// help from: https://jeffreythompson.org/collision-detection/rect-rect.php
func (r1 Rectangle[T]) rect_rect_collision(r2 Rectangle[T]) bool {
	return (r1.x+r1.w >= r2.x && r1.x <= r2.x+r2.w &&
		r1.y+r1.h >= r2.y && r1.y <= r2.y+r2.h)
}

func Circle_To_Rectangle[T Vector.Number](pos Vector.Vector2[T], r T) Rectangle[T] {
	return Rectangle[T]{
		x: pos.X - (r / 2),
		y: pos.Y - (r / 2),
		w: r * 2,
		h: r * 2,
	}
}

const QT_NODE_CAPACITY = 8
const QT_CHILDREN_LENGTH = 4

// we can make this smaller, even let the user change this to their needs
type Node_ID_Type uint16
type Points_ID_Type uint16

type temporary_quadtree_node[T Vector.Number] struct {
	points [QT_NODE_CAPACITY]Points_ID_Type
}

type quadtree_node[T Vector.Number] struct {
	// Axis-aligned bounding box stored as a center with half-dimensions
	// to represent the boundaries of this quad tree
	Boundary Rectangle[T]

	// the index, and the next QT_CHILDREN_LENGTH belong to this node
	Children_start_index Node_ID_Type

	// Points in this quad tree node (is actually their index)
	num_points uint8 // this is as small as possible
	// this is an index into a secondary array of points
	points_start_index Points_ID_Type
	// points     [QT_NODE_CAPACITY]Points_ID_Type
}

func new_Node[T Vector.Number](boundary Rectangle[T]) quadtree_node[T] {
	return quadtree_node[T]{
		Boundary: boundary,

		num_points: 0,
		// points_start_index: 0, // this doesn't matter when
		// points:     [QT_NODE_CAPACITY]Points_ID_Type{},

		Children_start_index: 0,
	}
}

// TODO make better
type Quadtree[T Vector.Number] struct {
	// this holds an array of all the points, you supposed to just call set_up then query the range a bunch
	all_points []Vector.Vector2[T]

	// array[0] is special, its the root nodes thing
	Child_array []quadtree_node[T]

	secondary_points_array                []Vector.Vector2[T]
	secondary_points_original_index_array []Points_ID_Type
}

func New_quadtree[T Vector.Number]() Quadtree[T] {
	child_array := make([]quadtree_node[T], 1)
	child_array[0] = quadtree_node[T]{
		Boundary:             Rectangle[T]{},
		Children_start_index: 0,
	}

	return Quadtree[T]{
		Child_array: child_array,
	}
}

func find_bounds[T Vector.Number](points []Vector.Vector2[T]) Rectangle[T] {

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
	return Make_Rectangle(
		min_x,
		min_y,
		max_x-min_x+1,
		max_y-min_y+1,
	)
}

func (quadtree *Quadtree[T]) Setup_tree(points []Vector.Vector2[T]) int {
	// Setup the bounds
	quadtree.Child_array[0].Boundary = find_bounds(points)

	// this might be bad. meh. need to make it obvious that the quad tree doesn't own this
	quadtree.all_points = points

	temporary_nodes := make([]temporary_quadtree_node[T], 1)

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

			node := &quadtree.Child_array[checking]

			// Ignore objects that do not belong in this quad tree
			if !node.Boundary.containsPoint(p) {
				// return false
				continue
			}

			// If there is space in this quad tree and if doesn't have subdivisions, add the object here
			// NOTE children[0] == 0 is the root node and not allowed
			if node.num_points < QT_NODE_CAPACITY && node.Children_start_index == 0 {
				temporary_nodes[checking].points[node.num_points] = p_index
				// node.points[node.num_points] = p_index
				node.num_points += 1
				// continue
				return true // we inserted the point
			}

			// Otherwise, subdivide and then add the point to whichever node will accept it
			if node.Children_start_index == 0 {
				quadtree.subdivide(checking)

				// make 4 of these, to fit the new ones.
				temporary_nodes = append(temporary_nodes, temporary_quadtree_node[T]{})
				temporary_nodes = append(temporary_nodes, temporary_quadtree_node[T]{})
				temporary_nodes = append(temporary_nodes, temporary_quadtree_node[T]{})
				temporary_nodes = append(temporary_nodes, temporary_quadtree_node[T]{})
			}

			// We have to add the points/data contained in this quad array to the
			// new quads if we only want the last node to hold the data

			if node.Children_start_index == 0 {
				log.Fatalf("a node cannot have child 0 at this time. node: %v\n", node)
			}

			stack = append(stack, node.Children_start_index+0)
			stack = append(stack, node.Children_start_index+1)
			stack = append(stack, node.Children_start_index+2)
			stack = append(stack, node.Children_start_index+3)
		}

		// NOTE because floats have some imprecision, sometimes this will happen. just notify the caller
		if DEBUG_INSERTION {
			fmt.Printf("UNREACHABLE: point didn't fit into any boundary. p: %v, self %v\n", p, quadtree.Child_array[0].Boundary)
		}
		return false
	}

	bad_points := 0
	for i := 0; i < len(points); i++ {
		if !insert_point(i) {
			bad_points += 1
		}
	}

	// we need to put the points in the right place
	quadtree.secondary_points_array = make([]Vector.Vector2[T], len(points))
	quadtree.secondary_points_original_index_array = make([]Points_ID_Type, len(points))

	{
		// Start with root node
		stack := make([]Node_ID_Type, 1)
		stack[0] = 0

		secondary_points_index := 0

		// rust would have warned me about this overflowing
		for len(stack) > 0 {
			// i think a queue is better here, for a breadth first search.
			checking := stack[0]
			stack = stack[1:]

			// checking := stack[len(stack)-1]
			// stack = stack[:len(stack)-1]

			node := &quadtree.Child_array[checking]
			// we have a node, now put it into the secondary array

			// fmt.Printf("here?\n")

			t_node := temporary_nodes[checking]
			node.points_start_index = Points_ID_Type(secondary_points_index)

			for i := 0; i < int(node.num_points); i++ {
				quadtree.secondary_points_array[secondary_points_index+i] = points[t_node.points[i]]
				quadtree.secondary_points_original_index_array[secondary_points_index+i] = t_node.points[i]
			}

			secondary_points_index += int(node.num_points)

			if node.Children_start_index != 0 {
				for i := 0; i < QT_CHILDREN_LENGTH; i++ {
					stack = append(stack, node.Children_start_index+Node_ID_Type(i))
				}
			}
		}
	}

	temporary_nodes = nil

	// return false

	return bad_points
}

func (quadtree *Quadtree[T]) subdivide(node_index Node_ID_Type) {
	node := &quadtree.Child_array[node_index]

	total_nodes := len(quadtree.Child_array) + 4
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

	new_nodes := [QT_CHILDREN_LENGTH]quadtree_node[T]{}
	for i := 0; i < QT_CHILDREN_LENGTH; i++ {
		new_nodes[i] = new_Node(dirs[i])
	}

	start_index := Node_ID_Type(len(quadtree.Child_array))

	quadtree.Child_array = append(quadtree.Child_array, new_nodes[:]...)
	// quadtree.child_array = append(quadtree.child_array, nw, ne, sw, se)

	node.Children_start_index = start_index
}

// returns the index, of the original passed in array
func (quadtree Quadtree[T]) QueryRange(q_range Rectangle[T]) []Points_ID_Type {
	points_in_range := make([]Points_ID_Type, 0, 64)

	// check if the range is within the tree
	root_node := quadtree.Child_array[0]
	if !root_node.Boundary.rect_rect_collision(q_range) {
		return points_in_range
	}

	// Start with root node's children
	stack := make([]Node_ID_Type, 1, 64)
	stack[0] = root_node.Children_start_index // this should always be 1

	// i might not be able to make this function any faster. oh how i would love to do some multithreading here, but WASM is a bitch.
	for len(stack) > 0 {
		checking := stack[len(stack)-1]
		stack = stack[:len(stack)-1]

		// check multiple nodes per stack thing
		for i := 0; i < QT_CHILDREN_LENGTH; i++ {
			node := quadtree.Child_array[checking+Node_ID_Type(i)]

			if !q_range.rect_rect_collision(node.Boundary) {
				continue
			}

			check_points := func() {

				// hmmm is this as good as this loop gets?
				start := int(node.Children_start_index)
				for i := 0; i < int(node.num_points); i++ {
					point := quadtree.secondary_points_array[start+i]
					// p_index := node.points[i]

					// if q_range.containsPoint(quadtree.all_points[p_index]) {
					if q_range.containsPoint(point) {
						// points_in_range = append(points_in_range, p_index)
						points_in_range = append(points_in_range, quadtree.secondary_points_original_index_array[start+i])
					}
				}

				// for i, p_index := range node.points {
				// 	p := quadtree.all_points[p_index]
				// 	if q_range.containsPoint(p) {
				// 		if int(node.num_points) < i {
				// 			break
				// 		}
				// 		points_in_range = append(points_in_range, p_index)
				// 	}
				// }
			}

			// compiler you better not use a closure here
			check_points()

			if node.Children_start_index != 0 {
				stack = append(stack, node.Children_start_index)
			}
		}
	}

	return points_in_range
}

// an iterator that traverse the tree in such a way, as to get some better cache locality
// returns the point index
func (quadtree *Quadtree[T]) Traverse() iter.Seq[Points_ID_Type] {
	return func(yield func(Points_ID_Type) bool) {
		var recur func(Node_ID_Type) bool
		recur = func(checking Node_ID_Type) bool {
			node := quadtree.Child_array[checking]

			if node.Children_start_index != 0 {
				// leaf node
				for i := 0; i < QT_CHILDREN_LENGTH; i++ {
					should_continue := recur(node.Children_start_index + Node_ID_Type(i))
					if !should_continue {
						// end the whole thing
						return false
					}
				}
			}

			start := node.points_start_index
			for i := 0; i < int(node.num_points); i++ {
				// should_continue := yield(node.points[i])
				should_continue := yield(quadtree.secondary_points_original_index_array[start+Points_ID_Type(i)])
				if !should_continue {
					// end the whole thing
					return false
				}
			}

			return true
		}

		recur(0)
	}
}

func (quadtree *Quadtree[T]) Clear() {
	quadtree.Child_array = quadtree.Child_array[:1]

	quadtree.Child_array[0].num_points = 0

	// clear children
	// quadtree.child_array[0].children = [4]Node_ID_Type{}
	quadtree.Child_array[0].Children_start_index = 0

	// save the memory, we don't own this memory
	// quadtree.All_points = quadtree.All_points[:0]

}

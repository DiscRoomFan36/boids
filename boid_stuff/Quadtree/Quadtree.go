package quadtree

import (
	"fmt"
	"os"

	"boidstuff.com/Vector"
)

// this whole thing is pseudocode from: https://en.wikipedia.org/wiki/Quadtree

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

// nodes are [X, X+width)
func (aabb *Axis_aligned_bb[T]) containsPoint(p Vector.Vector2[T]) bool {
	// return (aabb.center.X-aabb.halfDim <= p.X) && (p.X < aabb.center.X+aabb.halfDim) &&
	// 	(aabb.center.Y-aabb.halfDim <= p.Y) && (p.Y < aabb.center.Y+aabb.halfDim)
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

// TODO make better
type Quadtree[T Vector.Number] struct {
	// only the top level has this
	all_points []Vector.Vector2[T]

	// Axis-aligned bounding box stored as a center with half-dimensions
	// to represent the boundaries of this quad tree
	boundary Axis_aligned_bb[T]

	// Points in this quad tree node (is actually their index)
	num_points int
	points     [QT_NODE_CAPACITY]int
	// points     [QT_NODE_CAPACITY]Vector.Vector2[T]

	// Children
	northWest *Quadtree[T]
	northEast *Quadtree[T]
	southWest *Quadtree[T]
	southEast *Quadtree[T]
}

func New_quadtree[T Vector.Number](aabb Axis_aligned_bb[T]) Quadtree[T] {
	return Quadtree[T]{
		boundary: aabb,

		num_points: 0,

		northWest: nil,
		northEast: nil,
		southWest: nil,
		southEast: nil,
	}
}

// TODO this is bad
func (quadtree *Quadtree[T]) subdivide() {
	dim_half := quadtree.boundary.Dim / 2
	nw := New_quadtree(Axis_aligned_bb[T]{
		Bottom_left: quadtree.boundary.Bottom_left,
		Dim:         dim_half,
	})
	ne := New_quadtree(Axis_aligned_bb[T]{
		Bottom_left: Vector.Vector2[T]{
			X: quadtree.boundary.Bottom_left.X + dim_half,
			Y: quadtree.boundary.Bottom_left.Y,
		},
		Dim: dim_half,
	})
	sw := New_quadtree(Axis_aligned_bb[T]{
		Bottom_left: Vector.Vector2[T]{
			X: quadtree.boundary.Bottom_left.X,
			Y: quadtree.boundary.Bottom_left.Y + dim_half,
		},
		Dim: dim_half,
	})
	se := New_quadtree(Axis_aligned_bb[T]{
		Bottom_left: Vector.Vector2[T]{
			X: quadtree.boundary.Bottom_left.X + dim_half,
			Y: quadtree.boundary.Bottom_left.Y + dim_half,
		},
		Dim: dim_half,
	})

	quadtree.northWest = &nw
	quadtree.northEast = &ne
	quadtree.southWest = &sw
	quadtree.southEast = &se
}

func (quadtree *Quadtree[T]) Insert(p Vector.Vector2[T]) bool {
	p_index := len(quadtree.all_points)
	quadtree.all_points = append(quadtree.all_points, p)

	var recur func(*Quadtree[T]) bool
	recur = func(q_tree *Quadtree[T]) bool {
		// Ignore objects that do not belong in this quad tree
		if !q_tree.boundary.containsPoint(p) {
			return false
		}
		// If there is space in this quad tree and if doesn't have subdivisions, add the object here
		if q_tree.num_points < QT_NODE_CAPACITY && q_tree.northWest == nil {
			q_tree.points[q_tree.num_points] = p_index
			q_tree.num_points += 1
			return true
		}

		// Otherwise, subdivide and then add the point to whichever node will accept it
		if q_tree.northWest == nil {
			q_tree.subdivide()
		}

		if q_tree.northWest == nil {
		}

		// We have to add the points/data contained in this quad array to the
		// new quads if we only want the last node to hold the data

		// if q_tree.northWest.Insert(p) {
		if recur(q_tree.northWest) {
			return true
		}
		if recur(q_tree.northEast) {
			return true
		}
		if recur(q_tree.southWest) {
			return true
		}
		if recur(q_tree.southEast) {
			return true
		}

		// Otherwise, the point cannot be inserted for some unknown reason (this should never happen)
		fmt.Printf("UNREACHABLE p: %v", p)
		os.Exit(1)
		return false
	}

	return recur(quadtree)
}

// returns the index, of the original passed in array
func (quadtree *Quadtree[T]) QueryRange(q_range Axis_aligned_bb[T]) []int {
	points_in_range := make([]int, 0)

	var recur func(*Quadtree[T])
	recur = func(q_tree *Quadtree[T]) {

		if !q_tree.boundary.intersectsAABB(q_range) {
			return
		}

		for i := 0; i < q_tree.num_points; i++ {
			p_index := q_tree.points[i]
			p := quadtree.all_points[p_index]
			if q_range.containsPoint(p) {
				points_in_range = append(points_in_range, p_index)
			}
		}

		if q_tree.northWest == nil {
			return
		}

		recur(q_tree.northWest)
		recur(q_tree.northEast)
		recur(q_tree.southWest)
		recur(q_tree.southEast)
	}

	recur(quadtree)

	return points_in_range
}

func (quadtree *Quadtree[T]) Clear() {
	quadtree.num_points = 0

	// save the memory
	quadtree.all_points = quadtree.all_points[:0]

	quadtree.northWest = nil
	quadtree.northEast = nil
	quadtree.southWest = nil
	quadtree.southEast = nil
}

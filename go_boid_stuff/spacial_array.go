package main

import (
	"iter"
	"log"
)


const BOX_SIZE = 32

// there must be less than 'maximum(BOX_ID_TYPE)'
// points in the spacial array
type BOX_ID_TYPE uint32

type box[T Number] struct {
	// how many slots are filled.
	Count uint

	// The next box in the linked list
	Next *box[T]

	Points [BOX_SIZE]Vec2[T]
	// TODO put these somewhere else?
	// Indexes of the point that gave the corresponding point.
	Indexes [BOX_SIZE]BOX_ID_TYPE
}

type Spacial_Array[T Number] struct {
	// this is weather or not we have been given points
	inited bool

	Boxes_wide int
	Boxes_high int

	Min_x T
	Min_y T
	Max_x T
	Max_y T

	Boxes []box[T]

	// where the extra boxes are stored if there are to many to fit into one box.
	//
	// TODO just have an offset into the boxes array... to put them in the same place in memory
	backup_boxes []box[T]
	backup_boxes_in_use int
}

func New_Spacial_Array[T Number]() Spacial_Array[T] {
	result := Spacial_Array[T]{
		inited: false,

		Boxes_wide: 32,
		Boxes_high: 32,

		// these will be set when you give this thing points
		Min_x: 0,
		Min_y: 0,
		Max_x: 0,
		Max_y: 0,

		// maybe give this thing some initial space?
		backup_boxes: make([]box[T], 0),
		backup_boxes_in_use: 0,
	}
	result.Boxes = make([]box[T], result.Boxes_wide*result.Boxes_high)

	return result
}

// you can also pass in defaults, sets a min size.
func (array *Spacial_Array[T]) Append_points(points []Vec2[T], x_min_def, y_min_def, x_max_def, y_max_def T) {
	if array.inited { panic("cannot append 2 sets of points, sorry") }
	array.inited = true

	{ // set the bounds of the array
		min_x, min_y, max_x, max_y := find_mins_and_maxs(points)
		array.Min_x = min(min_x, x_min_def)
		array.Min_y = min(min_y, y_min_def)
		array.Max_x = max(max_x, x_max_def)
		array.Max_y = max(max_y, y_max_def)
	}

	const MAX_ID = ^BOX_ID_TYPE(0)
	if int64(len(points)) > int64(MAX_ID) {
		log.Fatalf("To many points to fit into BOX_ID_TYPE\n")
	}

	for index, point := range points {
		box_x, box_y := array.point_to_box_loc(point)
		the_box := &array.Boxes[box_y*array.Boxes_wide+box_x]

		for the_box.Count == BOX_SIZE {
			// get a new box into the linked list if next is nil.
			if the_box.Next == nil {

				// make a new box if there are no spares.
				if array.backup_boxes_in_use == len(array.backup_boxes) {
					Append(&array.backup_boxes, box[T]{})
				}

				// get the next box
				the_box.Next = &array.backup_boxes[array.backup_boxes_in_use]
				array.backup_boxes_in_use += 1

				// reset the important fields.
				the_box.Next.Count = 0
				the_box.Next.Next = nil
			}
			the_box = the_box.Next
		}

		the_box.Points[the_box.Count] = point
		the_box.Indexes[the_box.Count] = BOX_ID_TYPE(index)
		the_box.Count += 1
	}
}

func (array Spacial_Array[T]) Iter_Over_Near(point Vec2[T], radius T) iter.Seq2[BOX_ID_TYPE, Vec2[T]] {
	return func(yield func(BOX_ID_TYPE, Vec2[T]) bool) {

		min_x, min_y := array.point_to_box_loc(Sub(point, Make_Vec2(radius, radius)))
		max_x, max_y := array.point_to_box_loc(Add(point, Make_Vec2(radius, radius)))

		for j := min_y; j <= max_y; j++ {
			for i := min_x; i <= max_x; i++ {

				box := &array.Boxes[j*array.Boxes_wide+i]

				// is this loop kinda ass? only needs to be real when box.count == BOX_SIZE
				for box != nil {

					for k := range box.Count {
						checking_point := box.Points[k]
						if DistSqr(point, checking_point) < radius*radius {
							point_index := box.Indexes[k]
							if !yield(point_index, checking_point) { return }
						}
					}

					box = box.Next
				}

			}
		}
	}
}

func (array *Spacial_Array[T]) Clear() {
	array.inited = false

	for i := range array.Boxes_wide*array.Boxes_high {
		array.Boxes[i].Count = 0
		array.Boxes[i].Next = nil
	}

	array.backup_boxes_in_use = 0
}

func (array Spacial_Array[T]) point_to_box_loc(point Vec2[T]) (int, int) {
	x := map_and_clamp_range(point.x, array.Min_x, array.Max_x)
	y := map_and_clamp_range(point.y, array.Min_y, array.Max_y)

	i_x := min(int(x*T(array.Boxes_wide)), array.Boxes_wide-1)
	i_y := min(int(y*T(array.Boxes_high)), array.Boxes_high-1)

	return i_x, i_y
}

// returns min_x, min_y, max_x, max_y
func find_mins_and_maxs[T Number](points []Vec2[T]) (T, T, T, T) {
	if len(points) == 0 { return 0, 0, 0, 0 }

	min_x := points[0].x
	max_x := points[0].x
	min_y := points[0].y
	max_y := points[0].y
	for _, p := range points[1:] {
		min_x = min(min_x, p.x)
		max_x = max(max_x, p.x)
		min_y = min(min_y, p.y)
		max_y = max(max_y, p.y)
	}
	return min_x, min_y, max_x, max_y
}

// returns a number from 0..1 inclusive
// TODO can this be done better with ints? mult and div?
func map_and_clamp_range[T Number](x, mini, maxi T) T {
	diff := maxi - mini
	if diff == 0 { return 0 }
	y := (x - mini) / diff
	return Clamp(y, 0, 1)
}


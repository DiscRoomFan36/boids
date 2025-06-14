package spacialarray

// TODO grid spacial array
import (
	"iter"
	"log"
	"math"

	"boidstuff.com/Vector"
)

const BOX_SIZE = 64

type BOX_ID_TYPE uint32

type box[T Vector.Number] struct {
	// how many slots are filled.
	Count int

	Points [BOX_SIZE]Vector.Vector2[T]
	// TODO put these somewhere else?
	// Indexes of the point that gave the corresponding point.
	Indexes [BOX_SIZE]BOX_ID_TYPE
}

type Spacial_Array[T Vector.Number] struct {
	// this is weather or not we have been given points
	inited bool

	Boxes_wide int
	Boxes_high int

	Min_x T
	Min_y T
	Max_x T
	Max_y T

	Boxes []box[T]
}

func New_Spacial_Array[T Vector.Number]() Spacial_Array[T] {
	result := Spacial_Array[T]{
		inited: false,

		Boxes_wide: 32,
		Boxes_high: 32,

		// these will be set when you give this thing points
		Min_x: 0,
		Min_y: 0,
		Max_x: 0,
		Max_y: 0,
	}
	result.Boxes = make([]box[T], result.Boxes_wide*result.Boxes_high)

	return result
}

func (array *Spacial_Array[T]) Append_points(points []Vector.Vector2[T]) {
	if array.inited {
		panic("cannot append 2 sets of points, sorry")
	}
	array.inited = true

	{ // set the bounds of the array
		min_x, min_y, max_x, max_y := find_mins_and_maxs(points)
		array.Min_x = min_x
		array.Min_y = min_y
		array.Max_x = max_x
		array.Max_y = max_y
	}

	if len(points) > int(^BOX_ID_TYPE(0)) {
		log.Fatalf("To many points to fit into BOX_ID_TYPE\n")
	}

	for index, point := range points {
		box_x, box_y := array.point_to_box_loc(point)
		the_box := &array.Boxes[box_y*array.Boxes_wide+box_x]

		if the_box.Count == BOX_SIZE {
			panic("To many points in a box!!!, fix this if this ever occurs")
		}

		the_box.Points[the_box.Count] = point
		the_box.Indexes[the_box.Count] = BOX_ID_TYPE(index)
		the_box.Count += 1
	}
}

func (array Spacial_Array[T]) Iter_Over_Near(point Vector.Vector2[T], radius T) iter.Seq2[BOX_ID_TYPE, Vector.Vector2[T]] {
	return func(yield func(BOX_ID_TYPE, Vector.Vector2[T]) bool) {
		// get all near points...
		box_x, box_y := array.point_to_box_loc(point)

		box_step_x := array.Max_x - array.Min_x
		box_step_y := array.Max_y - array.Min_y

		// protect against 0's
		if box_step_x == 0 { box_step_x = 1; }
		if box_step_y == 0 { box_step_y = 1; }

		// get the coverage range.
		// TODO is this right? or is it over correcting?
		rad_over_step_x := int(math.Ceil(float64(radius / box_step_x)))
		rad_over_step_y := int(math.Ceil(float64(radius / box_step_y)))
		min_x := max(box_x-rad_over_step_x, 0)
		max_x := min(box_x+rad_over_step_x, array.Boxes_wide)
		min_y := max(box_y-rad_over_step_y, 0)
		max_y := min(box_y+rad_over_step_y, array.Boxes_high)

		for j := min_y; j < max_y; j++ {
			for i := min_x; i < max_x; i++ {

				box := array.Boxes[j*array.Boxes_wide+i]
				for k := 0; k < box.Count; k++ {
					checking_point := box.Points[k]
					if Vector.DistSqr(point, checking_point) < radius*radius {
						point_index := box.Indexes[k]
						if !yield(point_index, checking_point) {
							return
						}
					}
				}

			}
		}
	}
}

func (array *Spacial_Array[T]) Clear() {
	array.inited = false

	for i := 0; i < array.Boxes_wide*array.Boxes_high; i++ {
		array.Boxes[i].Count = 0
	}
}

func (array Spacial_Array[T]) point_to_box_loc(point Vector.Vector2[T]) (int, int) {
	x := map_and_clamp_range(point.X, array.Min_x, array.Max_x)
	y := map_and_clamp_range(point.Y, array.Min_y, array.Max_y)

	i_x := min(int(x*T(array.Boxes_wide)), array.Boxes_wide-1)
	i_y := min(int(y*T(array.Boxes_high)), array.Boxes_high-1)

	return i_x, i_y
}

// returns min_x, min_y, max_x, max_y
func find_mins_and_maxs[T Vector.Number](points []Vector.Vector2[T]) (T, T, T, T) {
	if len(points) == 0 { return 0, 0, 0, 0 }

	min_x := points[0].X
	max_x := points[0].X
	min_y := points[0].Y
	max_y := points[0].Y
	for _, p := range points[1:] {
		min_x = min(min_x, p.X)
		max_x = max(max_x, p.X)
		min_y = min(min_y, p.Y)
		max_y = max(max_y, p.Y)
	}
	return min_x, min_y, max_x, max_y
}

// returns a number from 0..1 inclusive
// TODO can this be done better with ints? mult and div?
func map_and_clamp_range[T Vector.Number](x, mini, maxi T) T {
	diff := maxi - mini
	if diff == 0 { return 0 }
	y := (x - mini) / diff
	return min(max(y, 0), 1)
}

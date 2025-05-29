package spacialarray

// TODO grid spacial array
import (
	"iter"
	"math"

	"boidstuff.com/Vector"
)

const BOX_SIZE = 64

type box[T Vector.Number] struct {
	count  int
	points [BOX_SIZE]Vector.Vector2[T]
}

type Spacial_Array[T Vector.Number] struct {
	// this is weather or not we have been given points
	inited bool

	boxes_wide int
	boxes_high int

	min_x T
	min_y T
	max_x T
	max_y T

	boxes []box[T]
}

func New_Spacial_Array[T Vector.Number]() Spacial_Array[T] {
	result := Spacial_Array[T]{
		inited: false,

		boxes_wide: 32,
		boxes_high: 32,

		// these will be set when you give this thing points
		min_x: 0,
		min_y: 0,
		max_x: 0,
		max_y: 0,
	}
	result.boxes = make([]box[T], result.boxes_wide*result.boxes_high)

	return result
}

func (array *Spacial_Array[T]) append_points(points []Vector.Vector2[T]) {
	if array.inited {
		panic("cannot append 2 sets of points, sorry")
	}
	array.inited = true

	{ // set the bounds of the array
		min_x, min_y, max_x, max_y := find_mins_and_maxs(points)
		array.min_x = min_x
		array.min_y = min_y
		array.max_x = max_x
		array.max_y = max_y
	}

	for _, point := range points {
		box_x, box_y := array.point_to_box_loc(point)
		the_box := &array.boxes[box_y*array.boxes_wide+box_x]

		if the_box.count == BOX_SIZE {
			panic("To many points in a box!!!, fix this if this ever occurs")
		}

		the_box.points[the_box.count] = point
		the_box.count += 1
	}
}

func (array Spacial_Array[T]) point_to_box_loc(point Vector.Vector2[T]) (int, int) {
	x := map_and_clamp_range(point.X, array.min_x, array.max_x)
	y := map_and_clamp_range(point.Y, array.min_y, array.max_y)

	i_x := min(int(x*T(array.boxes_wide)), array.boxes_wide-1)
	i_y := min(int(y*T(array.boxes_high)), array.boxes_high-1)

	return i_x, i_y
}

func (array Spacial_Array[T]) Get_Near(point Vector.Vector2[T], radius T) iter.Seq[Vector.Vector2[T]] {
	return func(yield func(Vector.Vector2[T]) bool) {
		// get all near points...
		box_x, box_y := array.point_to_box_loc(point)

		box_step_x := array.max_x - array.min_x
		box_step_y := array.max_y - array.min_y

		// get the coverage range.
		// TODO is this right? or is it over correcting?
		rad_over_step_x := int(math.Ceil(float64(radius / box_step_x)))
		rad_over_step_y := int(math.Ceil(float64(radius / box_step_y)))
		min_x := max(box_x-rad_over_step_x, 0)
		max_x := min(box_x+rad_over_step_x, array.boxes_wide)
		min_y := max(box_y-rad_over_step_y, 0)
		max_y := min(box_y+rad_over_step_y, array.boxes_high)

		for j := min_y; j < max_y; j++ {
			for i := min_x; i < max_x; i++ {

				box := array.boxes[j*array.boxes_wide+i]
				for k := 0; k < box.count; k++ {
					checking_point := box.points[k]
					if Vector.DistSqr(point, checking_point) < radius*radius {
						if !yield(checking_point) {
							return
						}
					}
				}

			}
		}
	}
}

func (array *Spacial_Array[T]) Clear() {
	for i := 0; i < array.boxes_wide*array.boxes_high; i++ {
		array.boxes[i].count = 0
	}
}

// returns min_x, min_y, max_x, max_y
func find_mins_and_maxs[T Vector.Number](points []Vector.Vector2[T]) (T, T, T, T) {

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
	y := (x - mini) / (maxi - mini)
	return min(max(y, 0), 1)
}

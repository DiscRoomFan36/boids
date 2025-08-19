package boid

import "math"

// good old swap and remove
func Remove_Unordered[T any](s *[]T, index int) {
	if index != len(*s)-1 {
		(*s)[index] = (*s)[len(*s)-1]
	}
	*s = (*s)[:len(*s)-1]
}

func Remove_Ordered[T any](s *[]T, index int) {
	*s = append((*s)[:index], (*s)[index+1:]...)
}

// why would i even want to use append?
func Append[T any](s *[]T, elems ...T) {
	*s = append(*s, elems...)
}


// this function (and Ceil) also accepts int's, witch is dumb, but makes it a better api to call.
func Floor[T Number](x T) int { return int(math.Floor(float64(x))) }
func Ceil[ T Number](x T) int { return int(math.Ceil( float64(x))) }


func Clamp[T Number](x, mini, maxi T) T {
	if mini > maxi { panic("mini was bigger than maxi") }

	if x < mini { return mini }
	if x > maxi { return maxi }
	return x
}

func Lerp[T Float](a, b, t T) T {
	return (1-t)*a + t*b
}

package main

import (
	"math"
)

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


// TODO this math stuff is dumb, "Don't needlessly abstract." - Some Smart Guy

type Int    interface { ~int | ~uint | ~int8 | ~uint8 | ~int16 | ~uint16 | ~int32 | ~uint32 | ~int64 | ~uint64 }
type Float  interface { ~float32 | ~float64 }
type Number interface { Int | Float }


// this function (and Ceil) also accepts int's, witch is dumb, but makes it a better api to call.
func Floor[T Number](x T) int { return int(math.Floor(float64(x))) }
func Ceil[ T Number](x T) int { return int(math.Ceil( float64(x))) }


func Clamp[T Number](x, mini, maxi T) T {
	if mini > maxi { panic("mini was bigger than maxi") }

	if x < mini { return mini }
	if x > maxi { return maxi }
	return x
}

func Lerp[T Float](a, b, t T) T { return (1-t)*a + t*b }


func Abs[T Number](x T) T {
	// this would be faster if the type was known but w/e
	if x < 0 { x = -x }
	return x
}

// To Nearest Whole number
func Round[T Number](x T) int {
	// Adds 0.5, works for ints and floats, look out for overflow
	var rounded int
	if x > 0 { rounded = int((x*2 + 1) / 2)
	} else {   rounded = int((x*2 - 1) / 2) }

	// // NOTE Speed up if we need it
	// if Abs(T(rounded)-x) >= 1 {
	// 	// Overflow!!!
	// 	log.Fatalf("oh no, the rounding did not work!! orig: %v got: %v\n", x, rounded)
	// }

	return rounded
}


func Sloppy_Equal[T Float](a, b T) bool {
	// some small number
	const EPSILON = 0.000000001
	return Abs(a - b) < EPSILON
}

// outputs a number from [0, b). ignore the float64. go math module is dumb.
func Proper_Mod[T Float](a, b T) T {
	return T(math.Mod(math.Mod(float64(a), float64(b))+float64(b), float64(b)))
}

func Square[T Number](x T) T {
	return x * x
}

func Sqrt[T Float](x T) T {
	return T(math.Sqrt(float64(x)))
}

package boid

import (
	"log"
	"math"
	"math/rand"
)

// TODO this math stuff is dumb, "Don't needlessly abstract." - Some Smart Guy

type Int interface {
	~int | ~uint | ~int8 | ~uint8 | ~int16 | ~uint16 | ~int32 | ~uint32 | ~int64 | ~uint64
}
type Float interface {
	~float32 | ~float64
}
type Number interface {
	Int | Float
}

func Abs[T Number](x T) T {
	// this would be faster if the type was known but w/e
	if x < 0 {
		x = -x
	}
	return x
}

// To Nearest Whole number
func Round[T Number](x T) int {
	// Adds 0.5, works for ints and floats, look out for overflow
	var rounded int
	if x > 0 {
		rounded = int((x*2 + 1) / 2)
	} else {
		rounded = int((x*2 - 1) / 2)
	}

	// NOTE Speed up if we need it
	if Abs(T(rounded)-x) >= 1 {
		// Overflow!!!
		log.Fatalf("oh no, the rounding did not work!! orig: %v got: %v\n", x, rounded)
	}

	return rounded
}

// TODO do some cool reflect stuff. (might mess up a lot of optimizations but it could be cool)

// The Classic Vector, i wouldn't do all this [T Number] stuff if go has a better math library... well... maybe i would
type Vec2[T Number] struct {
	X, Y T
}

func Make_Vec2[T Number](x, y T) Vec2[T] {
	return Vec2[T]{x, y}
}

func (a Vec2[Number]) Splat() (Number, Number) {
	return a.X, a.Y
}

// These math operators a dumb actually.

func (a *Vec2[Number]) Add(vs ...Vec2[Number]) {
	for _, b := range vs {
		a.X += b.X
		a.Y += b.Y
	}
}
func Add[T Number](a Vec2[T], vs ...Vec2[T]) Vec2[T] {
	// I hope the compiler knows what its doing
	a.Add(vs...)
	return a
}

func (a *Vec2[Number]) Sub(vs ...Vec2[Number]) {
	for _, b := range vs {
		a.X -= b.X
		a.Y -= b.Y
	}
}
func Sub[T Number](a Vec2[T], vs ...Vec2[T]) Vec2[T] {
	a.Sub(vs...)
	return a
}

func (a *Vec2[Number]) Mult(s Number) {
	a.X *= s
	a.Y *= s
}
func Mult[T Number](a Vec2[T], s T) Vec2[T] {
	a.Mult(s)
	return a
}

func (a Vec2[Number]) Dot() Number {
	return a.X*a.X + a.Y*a.Y
}

func (a Vec2[Number]) Mag() Number {
	return Number(math.Sqrt(float64(a.Dot())))
}

func (a *Vec2[Number]) SetMag(new_mag Number) {
	mag := a.Mag()
	if mag == 0 {
		mag = 1
	}
	a.Mult(new_mag / mag)
}

func (a *Vec2[Number]) ClampMag(mini, maxi Number) {
	mag := a.Mag()
	if mag == 0 {
		// if the vector is zero, just set x to something. maybe a random vector?
		a.X = mini
		return
	}

	if mag < mini {
		a.Mult(mini / mag)
	} else if mag > maxi {
		a.Mult(maxi / mag)
	}
}

func (a *Vec2[Float]) Normalize() {
	a.Mult(1 / a.Mag())
}
func Normalized[T Float](a Vec2[T]) Vec2[T] {
	a.Normalize()
	return a
}

func Dist[T Number](a, b Vec2[T]) T {
	return Sub(a, b).Mag()
}
func DistSqr[T Number](a, b Vec2[T]) T {
	return Sub(a, b).Dot()
}

func Random_unit_vector[T Float]() Vec2[T] {
	theta := rand.Float64() * 2 * math.Pi
	sin, cos := math.Sincos(theta)
	return Make_Vec2(T(cos), T(sin))
}

// Really useful helper, would recommend
func Transform[T Number, U Number](v Vec2[T]) Vec2[U] {
	return Vec2[U]{
		X: U(v.X),
		Y: U(v.Y),
	}
}

func GetTheta[T Float](a Vec2[T]) T {
	return T(math.Atan2(float64(a.Y), float64(a.X)))
}

// https://math.stackexchange.com/questions/2506306/rotation-of-a-vector-around-origin
//
// Note. this rotate function is correct. however, the image at the end is flipped. cool cool cool.
func Rotate[T Float](a Vec2[T], theta T) Vec2[T] {
	sin, cos := math.Sincos(float64(theta))

	x := float64(a.X)*cos - float64(a.Y)*sin
	y := float64(a.X)*sin + float64(a.Y)*cos

	return Vec2[T]{T(x), T(y)}
}

func Unit_Vector_With_Rotation[T Float](theta T) Vec2[T] {
	sin, cos := math.Sincos(float64(theta))
	return Make_Vec2(T(cos), T(sin))
}

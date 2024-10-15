package Vector

import (
	"log"
	"math"
	"math/rand"
)

type Int interface {
	int | uint | int8 | uint8 | int16 | uint16 | int32 | uint32 | int64 | uint64
}
type Float interface {
	float32 | float64
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
type Vector2[T Number] struct {
	X, Y T
}

func Make_Vector2[T Number](x, y T) Vector2[T] {
	return Vector2[T]{x, y}
}

func (a Vector2[Number]) Splat() (Number, Number) {
	return a.X, a.Y
}

func (a *Vector2[Number]) Add(vs ...Vector2[Number]) {
	for _, b := range vs {
		a.X += b.X
		a.Y += b.Y
	}
}
func Add[T Number](a Vector2[T], vs ...Vector2[T]) Vector2[T] {
	// I hope the compiler knows what its doing
	a.Add(vs...)
	return a
}

func (a *Vector2[Number]) Sub(vs ...Vector2[Number]) {
	for _, b := range vs {
		a.X -= b.X
		a.Y -= b.Y
	}
}
func Sub[T Number](a Vector2[T], vs ...Vector2[T]) Vector2[T] {
	a.Sub(vs...)
	return a
}

func (a *Vector2[Number]) Mult(s Number) {
	a.X *= s
	a.Y *= s
}
func Mult[T Number](a Vector2[T], s T) Vector2[T] {
	a.Mult(s)
	return a
}

func (a Vector2[Number]) Dot() Number {
	return a.X*a.X + a.Y*a.Y
}

func (a Vector2[Number]) Mag() Number {
	return Number(math.Sqrt(float64(a.Dot())))
}

func (a *Vector2[Float]) Normalize() {
	a.Mult(1 / a.Mag())
}
func Normalized[T Float](a Vector2[T]) Vector2[T] {
	a.Normalize()
	return a
}

func Dist[T Number](a, b Vector2[T]) T {
	return Sub(a, b).Mag()
}
func DistSqr[T Number](a, b Vector2[T]) T {
	return Sub(a, b).Dot()
}

func Random_unit_vector[T Float]() Vector2[T] {
	theta := rand.Float64() * 2 * math.Pi
	sin, cos := math.Sincos(theta)
	return Vector2[T]{T(sin), T(cos)}
}

// Really useful helper, would recommend
func Transform[T Number, U Number](v Vector2[T]) Vector2[U] {
	return Vector2[U]{
		X: U(v.X),
		Y: U(v.Y),
	}
}

// NOTE math.Asin might be wrong here, can work around with + Pi/2
func GetTheta[T Float](a Vector2[T]) T {
	return T(math.Asin(float64(Normalized(a).X)))
}

// https://math.stackexchange.com/questions/2506306/rotation-of-a-vector-around-origin
func (a *Vector2[Float]) Rotate(theta Float) {
	sin, cos := math.Sincos(float64(theta))

	x := a.X*Float(cos) - a.Y*Float(sin)
	y := a.X*Float(sin) + a.Y*Float(cos)

	a.X = x
	a.Y = y
}
func Rotate[T Float](a Vector2[T], theta T) Vector2[T] {
	a.Rotate(theta)
	return a
}

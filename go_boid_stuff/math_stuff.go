package main

import (
	"math"
	"math/rand"
)

// TODO just make it float32? i like the generics, but it might be a bit much.

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

func Dot[T Number](a, b Vec2[T]) T { return a.X*b.X + a.Y*b.Y }
func (a Vec2[Number]) Dot() Number { return Dot(a, a) }

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

func (a *Vec2[Float]) Normalize() { a.Mult(1 / a.Mag()) }

func Normalized[T Float](a Vec2[T]) Vec2[T] {
	a.Normalize()
	return a
}

func Dist   [T Number](a, b Vec2[T]) T { return Sub(a, b).Mag() }
func DistSqr[T Number](a, b Vec2[T]) T { return Sub(a, b).Dot() }

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


// kinda annoying that I have Boid_Float here, but I really only need these with the floats.

type Rectangle struct {
	x, y, w, h Boid_Float
}

func make_rectangle(x, y, w, h Boid_Float) Rectangle {
	return Rectangle{x: x, y: y, w: w, h: h}
}

func (rect Rectangle) Splat() (Boid_Float, Boid_Float, Boid_Float, Boid_Float) {
	return rect.x, rect.y, rect.w, rect.h
}



type Line struct {
	x1, y1, x2, y2 Boid_Float
}

func (line Line) to_vec() (Vec2[Boid_Float], Vec2[Boid_Float]) {
	return Vec2[Boid_Float]{line.x1, line.y1}, Vec2[Boid_Float]{line.x2, line.y2}
}

// func rectangle_to_lines(x, y, w, h Boid_Float) []Line {
// 	lines := make([]Line, 4)
// 	lines[0] = Line{x,     y,     x + w, y    }
// 	lines[1] = Line{x + w, y,     x + w, y + h}
// 	lines[2] = Line{x + w, y + h, x,     y + h}
// 	lines[3] = Line{x,     y + h, x,     y}
// 	return lines
// }

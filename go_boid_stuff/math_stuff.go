package main

import (
	"math"
)

// TODO just make it float32? i like the generics, but it might be a bit much.

// The Classic Vector, i wouldn't do all this [T Number] stuff if go has a better math library... well... maybe i would
type Vec2[T Number] struct {
	x, y T
}

func Make_Vec2[T Number](x, y T) Vec2[T] {
	return Vec2[T]{x, y}
}

func (a Vec2[Number]) Splat() (Number, Number) {
	return a.x, a.y
}

// Really useful helper, would recommend
func Transform[T Number, U Number](v Vec2[T]) Vec2[U] {
	return Vec2[U]{
		x: U(v.x),
		y: U(v.y),
	}
}


// These math operators a dumb actually.

func (a *Vec2[Number]) Add(vs ...Vec2[Number]) {
	for _, b := range vs {
		a.x += b.x
		a.y += b.y
	}
}
func Add[T Number](a Vec2[T], vs ...Vec2[T]) Vec2[T] {
	// I hope the compiler knows what its doing
	a.Add(vs...)
	return a
}

func (a *Vec2[Number]) Sub(vs ...Vec2[Number]) {
	for _, b := range vs {
		a.x -= b.x
		a.y -= b.y
	}
}
func Sub[T Number](a Vec2[T], vs ...Vec2[T]) Vec2[T] {
	a.Sub(vs...)
	return a
}

func (a *Vec2[Number]) Mult(s Number) {
	a.x *= s
	a.y *= s
}
func Mult[T Number](a Vec2[T], s T) Vec2[T] {
	a.Mult(s)
	return a
}

func Dot[T Number](a, b Vec2[T]) T { return a.x*b.x + a.y*b.y }
func (a Vec2[Number]) Dot() Number { return Dot(a, a) }

func (a Vec2[Number]) Mag() Number { return Number(math.Sqrt(float64(Dot(a, a)))) }

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
		a.x = mini
		return
	}

	if mag < mini        { a.Mult(mini / mag)
	} else if mag > maxi { a.Mult(maxi / mag) }
}

func (a *Vec2[Float]) Normalize() { a.Mult(1 / a.Mag()) }

func Normalized[T Float](a Vec2[T]) Vec2[T] {
	a.Normalize()
	return a
}

func Dist   [T Number](a, b Vec2[T]) T { return Sub(a, b).Mag() }
func DistSqr[T Number](a, b Vec2[T]) T { return Sub(a, b).Dot() }



const DEG_TO_RAD = math.Pi / 180
const RAD_TO_DEG = 180 / math.Pi

// in radians
func Random_unit_vector[T Float]() Vec2[T] {
	theta := rand_f64() * 2 * math.Pi
	sin, cos := math.Sincos(theta)
	return Make_Vec2(T(cos), T(sin))
}

// in radians
func GetTheta[T Float](a Vec2[T]) T {
	return T(math.Atan2(float64(a.y), float64(a.x)))
}

// https://math.stackexchange.com/questions/2506306/rotation-of-a-vector-around-origin
//
// in radians
func Rotate[T Float](a Vec2[T], theta T) Vec2[T] {
	sin, cos := math.Sincos(float64(theta))

	x := float64(a.x)*cos - float64(a.y)*sin
	y := float64(a.x)*sin + float64(a.y)*cos

	return Vec2[T]{T(x), T(y)}
}

// in radians
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

// returns x, y, w, h
func (rect Rectangle) Splat() (Boid_Float, Boid_Float, Boid_Float, Boid_Float) {
	return rect.x, rect.y, rect.w, rect.h
}

// returns x1, y1, x2, y2
func (rect Rectangle) Splat_Vec() (Boid_Float, Boid_Float, Boid_Float, Boid_Float) {
	return rect.x, rect.y, rect.x + rect.w, rect.x + rect.h
}



type Line struct {
	x1, y1, x2, y2 Boid_Float
}

func (line Line) to_vec() (Vec2[Boid_Float], Vec2[Boid_Float]) {
	return Vec2[Boid_Float]{line.x1, line.y1}, Vec2[Boid_Float]{line.x2, line.y2}
}

func Scale(line Line, s Boid_Float) Line {
	line.x1 *= s
	line.y1 *= s
	line.x2 *= s
	line.y2 *= s
	return line
}

func rectangle_to_lines(x, y, w, h Boid_Float) [4]Line {
	lines := [4]Line{}
	lines[0] = Line{x,     y,     x + w, y    }
	lines[1] = Line{x + w, y,     x + w, y + h}
	lines[2] = Line{x + w, y + h, x,     y + h}
	lines[3] = Line{x,     y + h, x,     y}
	return lines
}
func rectangle_to_lines_r(r Rectangle) [4]Line { return rectangle_to_lines(r.x, r.y, r.w, r.h) }



///////////////////////////////////////////////////////
//              Collision Functions
///////////////////////////////////////////////////////


// point in rect
func point_rect_collision(x, y, rx, ry, rw, rh Boid_Float) bool {
	return (rx <= x && x <= rx + rw) && (ry <= y && y <= ry + rh)
}
func point_rect_collision_vr(p Vec2[Boid_Float], r Rectangle) bool { return point_rect_collision(p.x, p.y, r.x, r.y, r.w, r.h) }


// these might be good for AABB's

// func fix_rectangle(rect Rectangle) Rectangle {
// 	// fix the rectangle, no negative widths/hights
// 	if rect.w < 0 { rect.x, rect.w = rect.x + rect.w, -rect.w }
// 	if rect.h < 0 { rect.y, rect.h = rect.y + rect.h, -rect.h }
// 	return rect
// }

// func rect_rect_intersection(x1, y1, w1, h1, x2, y2, w2, h2 Boid_Float) bool {
// 	return (x1 + w1 >= x2) && (x1 <= x2 + w2) && (y1 + h1 >= y2) && (y1 <= y2 + h2)
// }
// func rect_rect_intersection_r(r1, r2 Rectangle) bool { return rect_rect_intersection(r1.x, r1.y, r1.w, r1.h, r2.x, r2.y, r2.w, r2.h) }


// returns weather it hit, and the location of the hit.
func line_line_intersection(x1, y1, x2, y2, x3, y3, x4, y4 Boid_Float) (bool, Vec2[Boid_Float]) {
	// calculate the distance to intersection point
	uA := ((x4-x3)*(y1-y3) - (y4-y3)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1))
	uB := ((x2-x1)*(y1-y3) - (y2-y1)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1))

	// TODO faster to always calc the loc?
	if (0 <= uA && uA <= 1) && (0 <= uB && uB <= 1) {
		loc := Vec2[Boid_Float]{
			x1 + (uA * (x2-x1)),
			y1 + (uA * (y2-y1)),
		}
		return true, loc
	}
	return false, Vec2[Boid_Float]{}
}
func line_line_intersection_l(l1, l2 Line) (bool, Vec2[Boid_Float]) { return line_line_intersection(l1.x1, l1.y1, l1.x2, l1.y2, l2.x1, l2.y1, l2.x2, l2.y2) }


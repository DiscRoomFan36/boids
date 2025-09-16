package main

// bigger number is smaller boid
const BOID_SCALE = 0.75


func World_to_boid[T Float](x T) T {
	return x * BOID_SCALE
}

// func boid_to_world[T Float](x T) T {
// 	return x / BOID_SCALE
// }


func World_to_boid_vec[T Float](x Vec2[T]) Vec2[T] {
	return Mult(x, BOID_SCALE)
}
func World_to_boid_rect(r Rectangle) Rectangle {
	r.x *= BOID_SCALE
	r.y *= BOID_SCALE
	r.w *= BOID_SCALE
	r.h *= BOID_SCALE
	return r
}

// func boid_to_world_vec[T Float](x Vec2[T]) Vec2[T] {
// 	return Mult(x, 1/BOID_SCALE)
// }
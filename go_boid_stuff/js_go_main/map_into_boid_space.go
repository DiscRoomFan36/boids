package main

import "boidstuff.com/boid"


const BOID_SCALE = 0.5


func World_to_boid[T boid.Float](x T) T {
	return x * BOID_SCALE
}

// func boid_to_world[T boid.Float](x T) T {
// 	return x / BOID_SCALE
// }


func World_to_boid_vec[T boid.Float](x boid.Vec2[T]) boid.Vec2[T] {
	return boid.Mult(x, BOID_SCALE)
}

// func boid_to_world_vec[T boid.Float](x boid.Vec2[T]) boid.Vec2[T] {
// 	return boid.Mult(x, 1/BOID_SCALE)
// }
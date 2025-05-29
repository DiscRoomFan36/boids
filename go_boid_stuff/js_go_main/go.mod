module boidstuff.com/js_go_main

go 1.23.0

replace boidstuff.com/boid => ../boid

replace boidstuff.com/Vector => ../Vector

replace boidstuff.com/Image => ../Image

replace boidstuff.com/Quadtree => ../Quadtree

replace boidstuff.com/Spacial_Array => ../Spacial_Array

require (
	boidstuff.com/Image v0.0.0-00010101000000-000000000000
	boidstuff.com/Quadtree v0.0.0-00010101000000-000000000000
	boidstuff.com/Spacial_Array v0.0.0-00010101000000-000000000000
	boidstuff.com/Vector v0.0.0-00010101000000-000000000000
	boidstuff.com/boid v0.0.0-00010101000000-000000000000
)

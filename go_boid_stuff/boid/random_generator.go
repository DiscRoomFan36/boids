package boid

import (
	"math"
	"math/rand"
)

// generates a smoothened random noise,
// sometimes wraps around 0 and 1, but it should do that smoothly,
type Random_Generator struct {
	// random numbers from 0 to 1?
	curr, next float32

	// how far you are to next
	t float32

	// a toggle if you want wrapping behavior
	wrapping bool
	// Which direction the number turns, is random.
	// True means increasing.
	//
	// only relevant when wrapping is true.
	turning_direction bool
}

// ---------------------------
//    User level functions
// ---------------------------

func New_Random_Generator(wrapping bool) Random_Generator {
	gen := Random_Generator{
		curr:     random_32(),
		next:     random_32(),
		t:        0,
		wrapping: wrapping,
		// only relevant when wrapping is true.
		turning_direction: wrapping && (random_32() < 0.5),
	}

	return gen
}

// dt is how much you advance the generator,
// every 1 total dt, the generator picks a new one.
//
// dt must be > 0, the generator dose not check this. would assert if could.
func (gen *Random_Generator) Next(dt float32) float32 {
	gen.t += dt

	// need to advance the generator if '1 time' has passed
	if gen.t >= 1 {
		// if its just past the boundary, advance by one,
		if gen.t < 2 {
			gen.t -= 1
			gen.curr = gen.next
		} else {
			// else just get a brand new set.
			gen.t = mod1(gen.t)
			gen.curr = random_32()
		}

		gen.next = random_32()

		if gen.wrapping {
			// only relevant when wrapping is true.
			gen.turning_direction = random_32() < 0.5
		}
	}

	// smoothly go between the 2 values.
	step := smoothstep(gen.t)

	// skip the rest if not wrapping
	if !gen.wrapping {
		return Lerp(gen.curr, gen.next, step)
	}

	if gen.turning_direction {
		// t++, result++

		if gen.curr <= gen.next {
			// the normal case.
			return Lerp(gen.curr, gen.next, step)
		} else {
			// wrap around.
			next := gen.next + 1
			ler := Lerp(gen.curr, next, step)
			return mod1(ler)
		}

	} else {
		// t++, result--

		if gen.next <= gen.curr {
			// the normal case.
			return Lerp(gen.curr, gen.next, step)
		} else {
			// wrap around.
			next := gen.next - 1
			ler := Lerp(gen.curr, next, step)
			return mod1(ler)
		}
	}
}

// ---------------------------
//      Helper Functions
// ---------------------------

// https://en.wikipedia.org/wiki/Smoothstep
//
// smoothly transitions from 0 to 1, given x
func smoothstep(x float32) float32 {
	x = Clamp(x, 0, 1)
	return x * x * (3.0 - 2.0*x)
}

// ---------------------------
//    Math library wrappers
// ---------------------------

// The random number generator function. [0, 1)
func random_32() float32 {
	return rand.Float32()
}

// floating point mod, always returns a number [0, 1)
// Modf but better.
func mod1[T Float](x T) T {
	_, a_64 := math.Modf(float64(x))

	// assert(abs(a) < 1)
	a := T(a_64)
	// if the sign was negative, make it positive,
	if a < 0 {
		return 1 + a
	} else {
		return a
	}
}

package main

import "time"

// how long until something is considered 'held', in seconds.
const HELD_TIME = 0.15

type Input_Status struct {
	Left_Down           bool
	Middle_Down         bool
	Right_Down          bool

	Left_Clicked        bool
	Middle_Clicked      bool
	Right_Clicked       bool

	Left_Released       bool
	Middle_Released     bool
	Right_Released      bool

	// if the mouse was held down for more than HELD_TIME
	Left_Held           bool
	Middle_Held         bool
	Right_Held          bool

	// useful if you wanna do something on release, but not after being held.
	Left_Held_Prev      bool
	Middle_Held_Prev    bool
	Right_Held_Prev     bool

	Mouse_Pos Vec2[Boid_Float]
	Mouse_Pos_Prev Vec2[Boid_Float]

	// TODO middle mouse scroll
	// TODO keyboard inputs?

	// private stuff for calculations

	// probably could compress a lot of this code...
	left_down_since     time.Time
	middle_down_since   time.Time
	right_down_since    time.Time
}


func HasFlag[T ~int](x, flag T) bool { return x & flag != 0 }

func Update_Input(prev Input_Status, is_left_down, is_middle_down, is_right_down bool, mouse_pos Vec2[Boid_Float]) Input_Status {
	new := Input_Status{
		Left_Down  :        is_left_down,
		Middle_Down:        is_middle_down,
		Right_Down :        is_right_down,

		// Left_Clicked  :     ,
		// Middle_Clicked:     ,
		// Right_Clicked :     ,

		Left_Released  :    prev.Left_Down   && !is_left_down,
		Middle_Released:    prev.Middle_Down && !is_middle_down,
		Right_Released :    prev.Right_Down  && !is_right_down,

		// Left_Held  :        ,
		// Middle_Held:        ,
		// Right_Held :        ,

		Left_Held_Prev  :   prev.Left_Held,
		Middle_Held_Prev:   prev.Middle_Held,
		Right_Held_Prev :   prev.Right_Held,


		Mouse_Pos     : mouse_pos,
		Mouse_Pos_Prev: prev.Mouse_Pos,


		left_down_since  :  prev.left_down_since,
		middle_down_since:  prev.middle_down_since,
		right_down_since :  prev.right_down_since,
	}

	now := time.Now()

	{ // check if the previous frame did not have them down.
		if new.Left_Down   && !prev.Left_Down   {
			new.Left_Clicked      = true
			new.left_down_since   = now
		}
		if new.Middle_Down && !prev.Middle_Down {
			new.Middle_Clicked    = true
			new.middle_down_since = now
		}
		if new.Right_Down  && !prev.Right_Down  {
			new.Right_Clicked     = true
			new.right_down_since  = now
		}
	}

	{ // check for held.
		if new.Left_Down   && now.Sub(new.left_down_since  ).Seconds() > HELD_TIME {
			new.Left_Held   = true
		}
		if new.Middle_Down && now.Sub(new.middle_down_since).Seconds() > HELD_TIME {
			new.Middle_Held = true
		}
		if new.Right_Down  && now.Sub(new.right_down_since ).Seconds() > HELD_TIME {
			new.Right_Held  = true
		}
	}

	return new
}

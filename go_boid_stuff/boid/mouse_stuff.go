package boid

import "time"


type Mouse_Flag int

// flags describing the mouse state.
const (
	Left_down           Mouse_Flag = 1 << 0
	Middle_down         Mouse_Flag = 1 << 1
	Right_down          Mouse_Flag = 1 << 2

	// get the diff between two frames to acquire.
	Left_clicked        Mouse_Flag = 1 << 3
	Middle_clicked      Mouse_Flag = 1 << 4
	Right_clicked       Mouse_Flag = 1 << 5

	Left_released       Mouse_Flag = 1 << 6
	Middle_released     Mouse_Flag = 1 << 7
	Right_released      Mouse_Flag = 1 << 8

	// how long until something is considered 'held', in seconds.
	HELD_TIME = 0.25

	// if the mouse was held down for more than HELD_TIME
	Left_held           Mouse_Flag = 1 << 9
	// Middle_held         Mouse_Flag = 1 << 10
	// Right_held          Mouse_Flag = 1 << 11

	// useful if you wanna do something on release, but not after being held.
	Left_held_prev      Mouse_Flag = 1 << 12
	// Middle_held_prev    Mouse_Flag = 1 << 13
	// Right_held_prev     Mouse_Flag = 1 << 14
)

type Mouse_Status struct {
	state Mouse_Flag

	// TODO middle mouse scroll
	// TODO have the mouse pos in here?

	left_down_since     time.Time
	// middle_down_since   time.Time
	// right_down_since    time.Time
}


func HasFlag[T ~int](x, flag T) bool { return x & flag != 0 }

func Get_New_State(prev Mouse_Status, new Mouse_Flag) Mouse_Status {
	result := Mouse_Status{
		state: new,

		left_down_since: prev.left_down_since,
	}

	now := time.Now()

	{ // check if the previous frame did not have them down.
		if  HasFlag(new, Left_down  ) && !HasFlag(prev.state, Left_down  ) {
			result.state |= Left_clicked
			result.left_down_since = now
		}
		if  HasFlag(new, Middle_down) && !HasFlag(prev.state, Middle_down) { result.state |= Middle_clicked  }
		if  HasFlag(new, Right_down ) && !HasFlag(prev.state, Right_down ) { result.state |= Right_clicked   }
	}

	{ // check if the previous frame did have them down.
		if !HasFlag(new, Left_down  ) &&  HasFlag(prev.state, Left_down  ) { result.state |= Left_released   }
		if !HasFlag(new, Middle_down) &&  HasFlag(prev.state, Middle_down) { result.state |= Middle_released }
		if !HasFlag(new, Right_down ) &&  HasFlag(prev.state, Right_down ) { result.state |= Right_released  }
	}

	// for the prev's
	if HasFlag(prev.state, Left_held) { result.state |= Left_held_prev }

	// check for held.
	if HasFlag(result.state, Left_down) && now.Sub(result.left_down_since).Seconds() > HELD_TIME {
		result.state |= Left_held
	}

	return result
}

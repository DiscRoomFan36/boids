package boid

// good old swap and remove
func Remove_Unordered[T any](s *[]T, index int) {
	if index != len(*s)-1 {
		(*s)[index] = (*s)[len(*s)-1]
	}
	*s = (*s)[:len(*s)-1]
}

func Remove_Ordered[T any](s *[]T, index int) {
	*s = append((*s)[:index], (*s)[index+1:]...)
}

// why would i even want to use append?
func Append[T any](s *[]T, elems ...T) {
	*s = append(*s, elems...)
}


package main

import (
	"math"
)

// DO NOT CHANGE UNLESS YOU WANNA DO A MASSIVE REFACTOR (AGAIN)
// const NUM_COLOR_COMPONENTS = 4

type Color_uint uint32

func (c Color_uint) to_rgba() (uint8, uint8, uint8, uint8) {
	r := uint8((c >> (8*0)) & 0xFF)
	g := uint8((c >> (8*1)) & 0xFF)
	b := uint8((c >> (8*2)) & 0xFF)
	a := uint8((c >> (8*3)) & 0xFF)
	return r, g, b, a
}

func rgba_to_color_uint(r, g, b, a uint8) Color_uint {
	result := (uint32(r) << (8*0)) |
			  (uint32(g) << (8*1)) |
			  (uint32(b) << (8*2)) |
			  (uint32(a) << (8*3))

	return Color_uint(result)
}

func (c *Color_uint) Set_Alpha(a float32) {
	// this could be slightly faster...
	// just skip the destructuring.
	r, g, b, _ := c.to_rgba()
	*c = rgba_to_color_uint(r, g, b, uint8(Round(a * 255)))
}

// my editor has a feature where if you put rgb(28, 110, 192),
// it makes a color picker. this was probably intended for HTML/CSS,
// but it works anywhere. Sick Hack.
func rgb(r, g, b uint8) Color_uint {
	return rgba_to_color_uint(r, g, b, 255)
}
func rgba(r, g, b uint8, a float32) Color_uint {
	return rgba_to_color_uint(r, g, b, uint8(Round(a * 255)))
}


// https://en.wikipedia.org/wiki/HSL_and_HSV#HSL_to_RGB_alternative
func HSL_to_RGB[T Float](H, S, L T) Color_uint {
	H = Clamp(H, 0, 360)
	S = Clamp(S, 0, 1)
	L = Clamp(L, 0, 1)

	a := S * min(L, 1-L)
	f := func(n T) T {
		k := T(math.Mod(float64(n+H/30), 12))
		return L - a*max(-1, min(k-3, 9-k, 1))
	}

	r := uint(f(0) * 255); r = min(r, 255)
	g := uint(f(8) * 255); g = min(g, 255)
	b := uint(f(4) * 255); b = min(b, 255)
	return rgba_to_color_uint(uint8(r), uint8(g), uint8(b), 255)
}

type Image struct {
	Buffer2 []uint32 // [RGBA][RGBA][RGBA]...
	Width  int
	Height int
}

func New_image(width int, height int) Image {
	return Image{
		Buffer2: make([]uint32, width*height),
		Width:  width,
		Height: height,
	}
}

func (img *Image) Resize_Image(new_width, new_height int) {
	if img.Width == new_width && img.Height == new_height { return }

	// saves space by reusing memory
	new_size := new_width*new_height
	if len(img.Buffer2) < new_size {
		img.Buffer2 = make([]uint32, new_size)
	}
	img.Width, img.Height = new_width, new_height
}

func (img *Image) To_RGBA_byte_array() []byte {
	return Unsafe_Slice_Transmute[uint32, byte](img.Buffer2[:img.Width*img.Height])
	// return img.Buffer[:img.Width*img.Height*NUM_COLOR_COMPONENTS]
}

/*
func (img *Image) To_RGB_byte_array() []byte {
	// this is RGB not RGBA
	RGB_array := make([]byte, img.Width*img.Height*3)
	for i := 0; i < img.Width*img.Height; i++ {
		RGB_array[i*3+0] = img.Buffer[i*NUM_COLOR_COMPONENTS+0]
		RGB_array[i*3+1] = img.Buffer[i*NUM_COLOR_COMPONENTS+1]
		RGB_array[i*3+2] = img.Buffer[i*NUM_COLOR_COMPONENTS+2]
	}
	return RGB_array
}

func (img *Image) To_ppm(filename string) {
	header := fmt.Sprintf("P6 %d %d 255\n", img.Width, img.Height)
	body := img.To_RGB_byte_array()

	f, err := os.Create(filename)
	if err != nil {
		log.Fatal(err)
	}
	defer f.Close()

	f.Write([]byte(header))
	f.Write(body)
}
*/

func (img *Image) point_within_bounds(x, y int) bool {
	return x >= 0 && x < img.Width && y >= 0 && y < img.Height
}

/*
func (img *Image) color_at(x, y int) Color {
	return Color{
		r: img.Buffer[(y*img.Width+x)*NUM_COLOR_COMPONENTS+0],
		g: img.Buffer[(y*img.Width+x)*NUM_COLOR_COMPONENTS+1],
		b: img.Buffer[(y*img.Width+x)*NUM_COLOR_COMPONENTS+2],
		a: img.Buffer[(y*img.Width+x)*NUM_COLOR_COMPONENTS+3],
	}
}
*/

// returned alpha is c1.a
func blend_color(c1, c2 Color_uint) Color_uint {

	r1, g1, b1, a1 := c1.to_rgba()
	r2, g2, b2, a2 := c2.to_rgba()

	r3 := (r1*(255 - a2) + r2*a2)/255; r3 = min(r3, 255)
	g3 := (g1*(255 - a2) + g2*a2)/255; g3 = min(g3, 255)
	b3 := (b1*(255 - a2) + b2*a2)/255; b3 = min(b3, 255)

	return rgba_to_color_uint(uint8(r3), uint8(g3), uint8(b3), uint8(a1))
}

func (img *Image) put_color_no_blend(x, y int, c Color_uint) {
	img.Buffer2[y*img.Width + x] = uint32(c) // c.to_uint32()

	// img.Buffer[(y*img.Width+x)*NUM_COLOR_COMPONENTS+0] = c.r
	// img.Buffer[(y*img.Width+x)*NUM_COLOR_COMPONENTS+1] = c.g
	// img.Buffer[(y*img.Width+x)*NUM_COLOR_COMPONENTS+2] = c.b
	// img.Buffer[(y*img.Width+x)*NUM_COLOR_COMPONENTS+3] = c.a
}

func (img *Image) put_color(x, y int, c Color_uint) {
	_, _, _, a := c.to_rgba()
	if (a == 255) {
		img.put_color_no_blend(x, y, c)
	} else {

		// color := Color{
		// 	img.Buffer[(y*img.Width+x)*NUM_COLOR_COMPONENTS+0],
		// 	img.Buffer[(y*img.Width+x)*NUM_COLOR_COMPONENTS+1],
		// 	img.Buffer[(y*img.Width+x)*NUM_COLOR_COMPONENTS+2],
		// 	img.Buffer[(y*img.Width+x)*NUM_COLOR_COMPONENTS+3],
		// }

		color := Color_uint(img.Buffer2[y*img.Width + x])
		// color := uint32_to_color(color_uint)

		blended := blend_color(color, c)

		img.Buffer2[y*img.Width + x] = uint32(blended) // blended.to_uint32()

		// img.Buffer[(y*img.Width+x)*NUM_COLOR_COMPONENTS+0] = blended.r
		// img.Buffer[(y*img.Width+x)*NUM_COLOR_COMPONENTS+1] = blended.g
		// img.Buffer[(y*img.Width+x)*NUM_COLOR_COMPONENTS+2] = blended.b
		// img.Buffer[(y*img.Width+x)*NUM_COLOR_COMPONENTS+3] = blended.a
	}
}


// i wish go had macros or something so i didn't have to make this function twice.
func Draw_Rect_int(img *Image, x, y, w, h int, c Color_uint) {
	for j := max(y, 0); j < min(y+h, img.Height); j++ {
		for i := max(x, 0); i < min(x+w, img.Width); i++ {
			img.put_color(i, j, c)
		}
	}
}
func Draw_Rect_int_no_blend(img *Image, x, y, w, h int, c Color_uint) {
	min_i, max_i := max(x, 0), min(x+w, img.Width)
	min_j, max_j := max(y, 0), min(y+h, img.Height)
	for j := min_j; j < max_j; j++ {
		for i := min_i; i < max_i; i++ {
			// img.Buffer[(j*img.Width+i)*NUM_COLOR_COMPONENTS+0] = c.r
			// img.Buffer[(j*img.Width+i)*NUM_COLOR_COMPONENTS+1] = c.g
			// img.Buffer[(j*img.Width+i)*NUM_COLOR_COMPONENTS+2] = c.b
			// img.Buffer[(j*img.Width+i)*NUM_COLOR_COMPONENTS+3] = c.a
			img.put_color_no_blend(i, j, c)
		}
	}
	
	// for j := max(y, 0); j < min(y+h, img.Height); j++ {
	// 	for i := max(x, 0); i < min(x+w, img.Width); i++ {
	// 		img.put_color_no_blend(i, j, c)
	// 	}
	// }
	
}

func Draw_Rect[T Number](img *Image, x, y, w, h T, c Color_uint) {
	_x := Round(x)
	_y := Round(y)
	_w := Round(w)
	_h := Round(h)

	Draw_Rect_int(img, _x, _y, _w, _h, c)
}

// TODO this function is slow... how do we speed it up?
func Draw_Rect_Outline[T Number](img *Image, _x, _y, _w, _h T, _inner_padding T, outer_color Color_uint) {
	x := Round(_x)
	y := Round(_y)
	w := Round(_w)
	h := Round(_h)
	inner_padding := Round(_inner_padding)

	// do bounds out here for speed.
	if (x + w <= 0) || (y + h <= 0) || (x >= img.Width) || (y >= img.Height) { return }

	// todo round these numbers up front?
	Draw_Rect_int_no_blend(img, x,                 y,                 w,             inner_padding,     outer_color) // top edge
	Draw_Rect_int_no_blend(img, x,                 y+h-inner_padding, w,             inner_padding,     outer_color) // bottom edge
	Draw_Rect_int_no_blend(img, x,                 y+inner_padding,   inner_padding, h-inner_padding*2, outer_color) // left edge
	Draw_Rect_int_no_blend(img, x+w-inner_padding, y+inner_padding,   inner_padding, h-inner_padding*2, outer_color) // right edge
}

/*
func (img *Image) Clear_background(c Color) {
	// i hope this gets optimized into a memcpy or something...
	for i := range img.Width*img.Height {
		img.Buffer[i * NUM_COLOR_COMPONENTS + 0] = c.r
		img.Buffer[i * NUM_COLOR_COMPONENTS + 1] = c.g
		img.Buffer[i * NUM_COLOR_COMPONENTS + 2] = c.b
		img.Buffer[i * NUM_COLOR_COMPONENTS + 3] = c.a
	}
}
*/


//go:noinline
func (img *Image) Clear_background_2(c Color_uint) {
	// color_as_int := c.to_uint32()

	for i := range img.Width*img.Height {
		img.Buffer2[i] = uint32(c) // color_as_int
	}

	// // cool reinterpret to uint32,
	// // much faster than anything go can do on its own.
	// buf_data := unsafe.Pointer(unsafe.SliceData(img.Buffer))
	// // the underlying slice probably has more space,
	// // but we only need the stuff thats going to be
	// // sent to the typescript
	// slice := unsafe.Slice((*uint32)(buf_data), img.Width*img.Height)

	// for i := range slice { slice[i] = color_as_int }

	// Yes, this is slower.
	// slice := unsafe.Slice((*Color)(buf_data), img.Width*img.Height)
	// for i := range slice { slice[i] = c }
}

func Draw_Circle[T Number](img *Image, x, y, r T, c Color_uint) {
	var min_x int = max(Floor(x-r-1), 0)
	var max_x int = min(Ceil( x+r+1), img.Width)
	var min_y int = max(Floor(y-r-1), 0)
	var max_y int = min(Ceil( y+r+1), img.Height)

	for j := min_y; j < max_y; j++ {
		for i := min_x; i < max_x; i++ {
			a := T(i) - x
			b := T(j) - y
			if a*a+b*b < r*r {
				img.put_color(i, j, c)
			}
		}
	}
}
func Draw_Circle_v[T Number](img *Image, p Vec2[T], r T, c Color_uint) { Draw_Circle(img, p.x, p.y, r, c) }



func Draw_Ring[T Number](img *Image, x, y, r1, r2 T, c Color_uint) {
	if !(r1 <= r2) { panic("r1 is less than r2") }

	var min_x int = max(Floor(x-r2-1), 0)
	var max_x int = min(Ceil( x+r2+1), img.Width)
	var min_y int = max(Floor(y-r2-1), 0)
	var max_y int = min(Ceil( y+r2+1), img.Height)

	for j := min_y; j < max_y; j++ {
		for i := min_x; i < max_x; i++ {
			a := T(i) - x
			b := T(j) - y
			d := a*a + b*b

			// i feel as though there might be a better way to do this.
			if (r1*r1 < d) && (d < r2*r2) {
				img.put_color(i, j, c)
			}
		}
	}
}


// DDA line generation algorithm
func Draw_Line[T Number](img *Image, _p1, _p2 Vec2[T], c Color_uint) {
	// convert to int. image library should be friendly
	p1 := Transform[T, int](_p1)
	p2 := Transform[T, int](_p2)

	if p1.x > p2.x {
		tmp := p1
		p1 = p2
		p2 = tmp
	}

	dx := p2.x - p1.x
	dy := p2.y - p1.y

	if dx == 0 {
		if !(0 <= p1.x && p1.x < img.Width) { return }
		// draw up down line
		y1 := min(p1.y, p2.y)
		y2 := max(p1.y, p2.y)
		for y := max(y1, 0); y < min(y2, img.Height); y++ {
			img.put_color(Round(p1.x), y, c)
		}
		return
	}

	steps := max(Abs(dx), Abs(dy))

	X_inc := float32(dx) / float32(steps)
	Y_inc := float32(dy) / float32(steps)

	X := float32(p1.x)
	Y := float32(p1.y)
	for range steps {
		X_r := Round(X)
		Y_r := Round(Y)

		if img.point_within_bounds(X_r, Y_r) { img.put_color(X_r, Y_r, c) }

		X += X_inc
		Y += Y_inc
	}
}
func Draw_Line_l(img *Image, line Line, color Color_uint) {
	p1, p2 := line.to_vec()
	Draw_Line(img, p1, p2, color)
}

// https://www.sunshine2k.de/coding/java/TriangleRasterization/TriangleRasterization.html
func Draw_Triangle[T Number](img *Image, p1, p2, p3 Vec2[T], color Color_uint) {
	v1 := Transform[T, int](p1)
	v2 := Transform[T, int](p2)
	v3 := Transform[T, int](p3)

	// bubble sort, i wish go had a better way to do this, like passing a function into the sort interface, (v1, v2, v3 used to be an array)
	if v1.y > v2.y { v1, v2 = v2, v1 }
	if v2.y > v3.y { v2, v3 = v3, v2 }
	if v1.y > v2.y { v1, v2 = v2, v1 }

	draw_line := func(x0, x1, y int) {
		if !(0 <= y && y < img.Height) { return }
		for x := max(min(x0, x1), 0); x < min(max(x0, x1), img.Width); x++ {
			img.put_color(x, y, color)
		}
	}
	fillBottomFlatTriangle := func(v1, v2, v3 Vec2[int]) {
		inv_slope_1 := float32(v2.x-v1.x) / float32(v2.y-v1.y)
		inv_slope_2 := float32(v3.x-v1.x) / float32(v3.y-v1.y)

		cur_x_1 := float32(v1.x)
		cur_x_2 := float32(v1.x)

		for scan_line_Y := v1.y; scan_line_Y <= v2.y; scan_line_Y++ {
			draw_line(int(cur_x_1), int(cur_x_2), scan_line_Y)
			cur_x_1 += inv_slope_1
			cur_x_2 += inv_slope_2
		}
	}
	fillTopFlatTriangle := func(v1, v2, v3 Vec2[int]) {
		inv_slope_1 := float32(v3.x-v1.x) / float32(v3.y-v1.y)
		inv_slope_2 := float32(v3.x-v2.x) / float32(v3.y-v2.y)

		cur_x_1 := float32(v3.x)
		cur_x_2 := float32(v3.x)

		for scan_line_Y := v3.y; scan_line_Y > v1.y; scan_line_Y-- {
			draw_line(int(cur_x_1), int(cur_x_2), scan_line_Y)
			cur_x_1 -= inv_slope_1
			cur_x_2 -= inv_slope_2
		}
	}

	if v2.y == v3.y {
		fillBottomFlatTriangle(v1, v2, v3)
	} else if v1.y == v2.y {
		fillTopFlatTriangle(v1, v2, v3)
	} else {

		// I did some rearranging here
		v4 := Vec2[int]{
			// x: int(float32(v1.X) + float32(v2.Y-v1.Y)/float32(v3.Y-v1.Y)*float32(v3.X-v1.X)),
			x: (((v2.y - v1.y) * (v3.x - v1.x)) + (v1.x * (v3.y - v1.y))) / (v3.y - v1.y),
			y: v2.y,
		}

		fillBottomFlatTriangle(v1, v2, v4)
		fillTopFlatTriangle(v2, v4, v3)
	}
}

func Draw_Triangles_Circling[T Number](img *Image, pos Vec2[T], num_segments int, size, added_rotation T, color Color_uint) {
	num_points_around_the_circle := num_segments * 2
	for i := range num_segments {
		around_1 := 2 * math.Pi / float64(num_points_around_the_circle) * (float64(i) * 2)
		around_2 := 2 * math.Pi / float64(num_points_around_the_circle) * (float64(i) * 2 + 1)

		_p1 := Unit_Vector_With_Rotation(around_1 + float64(added_rotation))
		_p2 := Unit_Vector_With_Rotation(around_2 + float64(added_rotation))

		p1 := Transform[float64, T](_p1)
		p2 := Transform[float64, T](_p2)

		p1 = Add(pos, Mult(p1, size))
		p2 = Add(pos, Mult(p2, size))
		// the middle of all the points.
		p3 := Add(pos, p1, p2)
		p3.x /= 3; p3.y /= 3

		Draw_Triangle(img, p1, p2, p3, color)
	}
}

package Image

import (
	"fmt"
	"log"
	"math"
	"os"

	"boidstuff.com/Vector"
)

// DO NOT CHANGE UNLESS YOU WANNA DO A MASSIVE REFACTOR (AGAIN)
const NUM_COLOR_COMPONENTS = 4

type Color struct {
	R uint8
	G uint8
	B uint8
	A uint8
}

func (c Color) Splat() (uint8, uint8, uint8, uint8) {
	return c.R, c.G, c.B, c.A
}

// https://en.wikipedia.org/wiki/HSL_and_HSV#HSL_to_RGB_alternative
func HSL_to_RGB[T Vector.Float](H, S, L T) Color {
	if !(0 <= H && H <= 360) ||
		!(0 <= S && S <= 1) ||
		!(0 <= L && L <= 1) {
		log.Fatalf("HSL got input out of range H: %v S: %v L: %v\n", H, S, L)
	}

	a := S * min(L, 1-L)
	f := func(n T) T {
		k := T(math.Mod(float64(n+H/30), 12))
		return L - a*max(-1, min(k-3, 9-k, 1))
	}

	return Color{
		R: uint8(Vector.Round(f(0) * 255)),
		G: uint8(Vector.Round(f(8) * 255)),
		B: uint8(Vector.Round(f(4) * 255)),
		A: 255,
	}
}

type Image struct {
	Buffer []byte // [RGBA][RGBA][RGBA]...
	Width  int
	Height int
}

func New_image(width int, height int) Image {
	return Image{
		Buffer: make([]byte, width*height*NUM_COLOR_COMPONENTS),
		Width:  width,
		Height: height,
	}
}

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

func (img *Image) point_within_bounds(x, y int) bool {
	return x >= 0 && x < img.Width && y >= 0 && y < img.Height
}

func (img *Image) put_pixel(x, y int, c Color) {
	// TODO care more about Alpha
	img.Buffer[(y*img.Width+x)*NUM_COLOR_COMPONENTS+0] = c.R
	img.Buffer[(y*img.Width+x)*NUM_COLOR_COMPONENTS+1] = c.G
	img.Buffer[(y*img.Width+x)*NUM_COLOR_COMPONENTS+2] = c.B
	img.Buffer[(y*img.Width+x)*NUM_COLOR_COMPONENTS+3] = c.A
}

type f32 float32

func (img *Image) put_pixel_with_alpha(x, y int, c Color) {
	// don't pass a fully transparent color in here!
	if c.A == 0 {
		return
	}

	// get our components.
	r0i := img.Buffer[(y*img.Width+x)*NUM_COLOR_COMPONENTS+0]
	g0i := img.Buffer[(y*img.Width+x)*NUM_COLOR_COMPONENTS+1]
	b0i := img.Buffer[(y*img.Width+x)*NUM_COLOR_COMPONENTS+2]
	a0i := img.Buffer[(y*img.Width+x)*NUM_COLOR_COMPONENTS+3]

	r1i, g1i, b1i, a1i := c.Splat()

	// cast them all to floats.
	r0, g0, b0, a0 := f32(r0i), f32(g0i), f32(b0i), f32(a0i)
	r1, g1, b1, a1 := f32(r1i), f32(g1i), f32(b1i), f32(a1i)

	// blend the colors.
	a01 := (1-a0)*a1 + a0
	r01 := ((1-a0)*a1*r1 + a0*r0) / a01
	g01 := ((1-a0)*a1*g1 + a0*g0) / a01
	b01 := ((1-a0)*a1*b1 + a0*b0) / a01

	// write to buffer
	img.Buffer[(y*img.Width+x)*NUM_COLOR_COMPONENTS+0] = uint8(r01 * 255)
	img.Buffer[(y*img.Width+x)*NUM_COLOR_COMPONENTS+1] = uint8(g01 * 255)
	img.Buffer[(y*img.Width+x)*NUM_COLOR_COMPONENTS+2] = uint8(b01 * 255)
	img.Buffer[(y*img.Width+x)*NUM_COLOR_COMPONENTS+3] = uint8(a01 * 255)
}

func (img *Image) Draw_Rect(x, y, w, h int, c Color) {
	for j := max(y, 0); j < min(y+h, img.Height); j++ {
		for i := max(x, 0); i < min(x+w, img.Width); i++ {
			img.put_pixel(i, j, c)
		}
	}
}

func (img *Image) Draw_Rect_With_Alpha(x, y, w, h int, c Color) {
	for j := max(y, 0); j < min(y+h, img.Height); j++ {
		for i := max(x, 0); i < min(x+w, img.Width); i++ {
			img.put_pixel_with_alpha(i, j, c)
		}
	}
}

func (img *Image) Clear_background(c Color) {
	bytes := [NUM_COLOR_COMPONENTS]byte{c.R, c.G, c.B, c.A}
	for i := 0; i < img.Width*img.Height*NUM_COLOR_COMPONENTS; i += NUM_COLOR_COMPONENTS {
		img.Buffer[i+0] = bytes[0]
		img.Buffer[i+1] = bytes[1]
		img.Buffer[i+2] = bytes[2]
		img.Buffer[i+3] = bytes[3]
	}
}

func (img *Image) Draw_Circle(x, y, r int, c Color) {
	for j := max(y-r-1, 0); j < min(y+r+1, img.Height); j++ {
		for i := max(x-r-1, 0); i < min(x+r+1, img.Width); i++ {
			a := i - x
			b := j - y
			if a*a+b*b < r*r {
				img.put_pixel(i, j, c)
			}
		}
	}
}

// DDA line generation algorithm
func Draw_Line[T Vector.Number](img *Image, _p1, _p2 Vector.Vector2[T], c Color) {
	// convert to int. image library should be friendly
	p1 := Vector.Transform[T, int](_p1)
	p2 := Vector.Transform[T, int](_p2)

	if p1.X > p2.X {
		tmp := p1
		p1 = p2
		p2 = tmp
	}

	dx := p2.X - p1.X
	dy := p2.Y - p1.Y

	if dx == 0 {
		if !(0 <= p1.X && p1.X < img.Width) {
			return
		}
		// draw up down line
		y1 := min(p1.Y, p2.Y)
		y2 := max(p1.Y, p2.Y)
		for y := max(y1, 0); y < min(y2, img.Height); y++ {
			img.put_pixel(Vector.Round(p1.X), y, c)
		}
		return
	}

	steps := Vector.Abs(dx)
	if Vector.Abs(dx) <= Vector.Abs(dy) {
		steps = Vector.Abs(dy)
	}

	X_inc := float32(dx) / float32(steps)
	Y_inc := float32(dy) / float32(steps)

	X := float32(p1.X)
	Y := float32(p1.Y)
	for i := 0; i < steps; i++ {
		X_r := Vector.Round(X)
		Y_r := Vector.Round(Y)

		if img.point_within_bounds(X_r, Y_r) {
			img.put_pixel(X_r, Y_r, c)
		}

		X += X_inc
		Y += Y_inc
	}
}

// https://www.sunshine2k.de/coding/java/TriangleRasterization/TriangleRasterization.html
func Draw_Triangle[T Vector.Number](img *Image, p1, p2, p3 Vector.Vector2[T], c Color) {
	v1 := Vector.Transform[T, int](p1)
	v2 := Vector.Transform[T, int](p2)
	v3 := Vector.Transform[T, int](p3)

	sortVerticesAscendingByY := func() {
		// bubble sort, i wish go had a better way to do this, like passing a function into the sort interface, (v1, v2, v3 used to be an array)
		if v1.Y > v2.Y {
			v1, v2 = v2, v1
		}
		if v2.Y > v3.Y {
			v2, v3 = v3, v2
		}
		if v1.Y > v2.Y {
			v1, v2 = v2, v1
		}

		if !(v1.Y <= v2.Y && v2.Y <= v3.Y) {
			log.Fatalf("Did not sort vertex's correctly, got %v, %v, %v\n", v1, v2, v3)
		}
	}
	sortVerticesAscendingByY()

	draw_line := func(x0, x1, y int) {
		if !(0 <= y && y < img.Height) {
			return
		}
		for x := max(min(x0, x1), 0); x < min(max(x0, x1), img.Width); x++ {
			img.put_pixel(x, y, c)
		}
	}
	fillBottomFlatTriangle := func(v1, v2, v3 Vector.Vector2[int]) {
		inv_slope_1 := float32(v2.X-v1.X) / float32(v2.Y-v1.Y)
		inv_slope_2 := float32(v3.X-v1.X) / float32(v3.Y-v1.Y)

		cur_x_1 := float32(v1.X)
		cur_x_2 := float32(v1.X)

		for scan_line_Y := v1.Y; scan_line_Y <= v2.Y; scan_line_Y++ {
			draw_line(int(cur_x_1), int(cur_x_2), scan_line_Y)
			cur_x_1 += inv_slope_1
			cur_x_2 += inv_slope_2
		}
	}
	fillTopFlatTriangle := func(v1, v2, v3 Vector.Vector2[int]) {
		inv_slope_1 := float32(v3.X-v1.X) / float32(v3.Y-v1.Y)
		inv_slope_2 := float32(v3.X-v2.X) / float32(v3.Y-v2.Y)

		cur_x_1 := float32(v3.X)
		cur_x_2 := float32(v3.X)

		for scan_line_Y := v3.Y; scan_line_Y > v1.Y; scan_line_Y-- {
			draw_line(int(cur_x_1), int(cur_x_2), scan_line_Y)
			cur_x_1 -= inv_slope_1
			cur_x_2 -= inv_slope_2
		}
	}

	if v2.Y == v3.Y {
		fillBottomFlatTriangle(v1, v2, v3)
	} else if v1.Y == v2.Y {
		fillTopFlatTriangle(v1, v2, v3)
	} else {

		// I did some rearranging here
		v4 := Vector.Vector2[int]{
			// X: int(float32(v1.X) + float32(v2.Y-v1.Y)/float32(v3.Y-v1.Y)*float32(v3.X-v1.X)),
			X: (((v2.Y - v1.Y) * (v3.X - v1.X)) + (v1.X * (v3.Y - v1.Y))) / (v3.Y - v1.Y),
			Y: v2.Y,
		}

		fillBottomFlatTriangle(v1, v2, v4)
		fillTopFlatTriangle(v2, v4, v3)
	}
}

package boid

import (
	"fmt"
	"log"
	"reflect"
	"strconv"
	"strings"
)

// Use reflection to get and set fields,


type Property_Struct struct {
	Tag_as_string string

	Property_type string

	// Float properties
	Float_range_min float64
	Float_range_max float64
	Float_default   float64
}

type Property_Struct_Field_Flags int
const (
	Flag_None Property_Struct_Field_Flags = 0

	// this is always set.
	// Flag_Property_type   = 1<<0

	Flag_Float_range     = 1<<1
	Flag_Float_default   = 1<<2
)


// contains a list of all properties.
//
// do not get from here, call Get_property_structs() to get this.
var hidden_property_structs map[string]Property_Struct = nil

// will panic if there is something funny, call to get the property map.
func Get_property_structs() map[string]Property_Struct {
	// use property Structs as a flag.
	if hidden_property_structs != nil { return hidden_property_structs }
	hidden_property_structs = make(map[string]Property_Struct, 0)

	boid_sim := Boid_simulation{}
	s := reflect.ValueOf(&boid_sim).Elem()
	typeOfT := s.Type()

	for i := range s.NumField() {
		field := typeOfT.Field(i)

		name := field.Name
		tag := field.Tag

		_, has_property := tag.Lookup("Property")
		if !has_property { continue }

		// --------------------------------------------
		//        Parse Tag into property struct
		// --------------------------------------------

		// start parsing the tag into a struct.
		property_struct := Property_Struct{}
		property_struct.Tag_as_string = string(tag)

		// space separated tags.
		tag_split := strings.Split(string(tag), " ")

		// property must always first.
		_, property_property, prop_type := split_one(tag_split[0], ":")
		if property_property != "Property" { log.Panicf("field '%v' (witch has the property tag), dose not have the property tag first, was %v\n", name, tag) }

		switch prop_type {
		// TODO use an enum here.
		case "float": { property_struct.Property_type = "float" }

		default: { log.Panicf("%v: unknown property type %v\n", name, prop_type) }
		}

		property_struct.Property_type = prop_type
		tag_split = tag_split[1:]

		struct_field_flags := 0

		for len(tag_split) > 0 {
			prop := tag_split[0]
			tag_split = tag_split[1:]

			_, left, right := split_one(prop, ":")

			if right[0] != '"' || right[len(right)-1] != '"' { log.Panicf("%v: malformed tag, was '%v'\n", name, tag) }
			right = right[1 : len(right)-2] // Remove quotes.

			switch left {
			case "Range": {
				if struct_field_flags & Flag_Float_range != 0 { log.Panicf("%v: Range property was set twice.", name) }
				struct_field_flags |= Flag_Float_range

				ok, min_s, max_s := split_one(right, ";")
				if !ok { log.Panicf("%v: right side of range property did not have a ';', was '%v'\n", name, right) }

				min_f, ok1 := strconv.ParseFloat(min_s, 64)
				max_f, ok2 := strconv.ParseFloat(max_s, 64)

				if ok1 != nil || ok2 != nil { log.Panicf("%v: error parsing floats in range. was '%v'\n", name, right) }

				property_struct.Float_range_min = min_f
				property_struct.Float_range_max = max_f
			}

			case "Default": {
				if struct_field_flags & Flag_Float_default != 0 { log.Panicf("%v: Default property was set twice.\n", name) }
				struct_field_flags |= Flag_Float_default

				def, ok := strconv.ParseFloat(right, 64)

				if ok != nil { log.Panicf("%v: error in Default, could not parse float. was '%v'\n", name, right) }

				property_struct.Float_default = def
			}

			default: { log.Panicf("%v: Unknown property %v\n", name, left) }
			}
		}

		// check that all relevant property's fields where set with the flags
		if struct_field_flags & Flag_Float_range == 0 {
			log.Panicf("%v: range field was not set.\n", name)
		}
		if struct_field_flags & Flag_Float_default == 0 {
			log.Panicf("%v: Default field was not set.\n", name)
		}

		hidden_property_structs[name] = property_struct
	}

	return hidden_property_structs
}


func set_boid_defaults(boid_sim *Boid_simulation) {
	property_structs := Get_property_structs()

	s := reflect.ValueOf(boid_sim).Elem()

	for name, prop_struct := range property_structs {

		settable_field := s.FieldByName(name)

		if prop_struct.Property_type == "float" {
			settable_field.SetFloat(prop_struct.Float_default)
		} else {
			panic("TODO other types in set boid defaults.")
		}
	}
}

// // returns in format.
// //
// // name: 'Property:"{float/int}" Range:"{min};{max}" Default:"{default}"'
// //
// // space separated key value pairs.
// func Get_properties() map[string]string {
// 	assert_all_properties_valid()

// 	properties := make(map[string]string)

// 	boid_sim := Boid_simulation{}
// 	s := reflect.ValueOf(&boid_sim).Elem()
// 	typeOfT := s.Type()

// 	for i := range s.NumField() {
// 		field := typeOfT.Field(i)

// 		if !is_property(field.Tag) { continue }

// 		properties[field.Name] = string(field.Tag)
// 	}

// 	return properties
// }

func (boid_sim *Boid_simulation) Set_Properties_with_map(the_map map[string]Boid_Float) {
	property_structs := Get_property_structs()

	// check if the name is in the property names.
	bad_name := false
	for name, _ := range the_map {
		if !contains(property_structs, name) {
			fmt.Printf("ERROR: '%v' is not in property structs\n", name)
			bad_name = true
		}
	}

	if bad_name { log.Fatalf("ERROR: There was a bad name.\n") }

	for name, value := range the_map {

		prop_struct := property_structs[name]

		settable_field := reflect.ValueOf(boid_sim).Elem().FieldByName(name)

		if prop_struct.Property_type == "float" {
			settable_field.SetFloat(float64(value))
		} else {
			panic("TODO other field, also the_map should change...")
		}
	}
}


func split_one(s string, sep string) (found bool, a string, b string) {
	if s == "" && sep == "" { return false, "", "" }

	sections := strings.SplitN(s, sep, 2)

	// when no separator was found
	if len(sections) == 1 { return false, s, "" }

	return true, sections[0], sections[1]
}

func contains[T comparable, U any](m map[T]U, key T) bool {
	_, ok := m[key]
	return ok
}
package boid

import (
	"fmt"
	"log"
	"reflect"
	"strconv"
	"strings"
)

// Use reflection to get and set fields,

/*
func set_boid_defaults(boid_sim *Boid_simulation) {
	s := reflect.ValueOf(boid_sim).Elem()
	typeOfT := s.Type()
	for i := 0; i < s.NumField(); i++ {
		property_tag := typeOfT.Field(i).Tag.Get("Property")
		if len(property_tag) == 0 {
			continue // we don't need to set a default
		}

		tag := typeOfT.Field(i).Tag.Get("Default")
		if len(tag) == 0 {
			log.Fatalf("Property field (%v) needs a default value\n", typeOfT.Field(i).Name)
		}

		default_value, err := strconv.ParseFloat(tag, 64)
		if err != nil {
			log.Fatalf("default value (from %v) could not be parsed into float\n", typeOfT.Field(i).Name)
		}

		field := s.Field(i)
		if !field.CanInterface() || !field.CanSet() {
			log.Panicf("tag that has property cannot be interfaced. %d: %v %v\n", i, typeOfT.Field(i).Name, field.Type())
		}

		// TODO check if the thing is a float...

		field.SetFloat(default_value)
	}
}

func Is_valid_property(name string) (bool, string) {
	// Because go reflection is a bit stupid.
	tmp_boid_sim := Boid_simulation{}
	s := reflect.ValueOf(&tmp_boid_sim).Elem()
	typeOfT := s.Type()

	field, success := typeOfT.FieldByName(name)
	if !success {
		return false, fmt.Sprintf("No field with name '%v' exists on boid simulation", name)
	}

	tag_property := field.Tag.Get("Property")
	if len(tag_property) == 0 {
		return false, fmt.Sprintf("field '%v' dose not have a 'Property' tag.", name)
	}

	tag_default := field.Tag.Get("Default")
	if len(tag_default) == 0 {
		return false, fmt.Sprintf("field '%v' dose not have a 'Default' tag.", name)
	}

	if field.Type.Kind() != reflect.Float32 && field.Type.Kind() != reflect.Float64 {
		return false, fmt.Sprintf("field '%v' is not a float of some kind, Will handle this better later. TODO", name)
	}

	if !field.IsExported() {
		return false, fmt.Sprintf("field '%v' is not exported. (Needed for CanSet function", name)
	}

	return true, ""
}

func (boid_sim *Boid_simulation) Set_property_by_name(name string, number Boid_Float) {
	valid, reason := Is_valid_property(name)
	if !valid {
		log.Fatalf("ERROR: %v\n", reason)
	}

	// set the property
	reflect.ValueOf(boid_sim).Elem().FieldByName(name).SetFloat(float64(number))
}

func (boid_sim *Boid_simulation) Set_Properties_with_map(the_map map[string]Boid_Float) {
	bad_name := false

	for name, _ := range the_map {
		valid, reason := Is_valid_property(name)

		if !valid {
			fmt.Printf("ERROR: '%v'\n", reason)
			bad_name = true
		}
	}

	if bad_name {
		log.Fatalf("ERROR: There was a bad name.\n")
	}

	for name, value := range the_map {
		boid_sim.Set_property_by_name(name, value)
	}
}

// "{a};{b}" -> a, b, err
func parse_property_tag(tag string) (float64, float64, error) {
	result := strings.Split(tag, ";")
	if len(result) != 2 {
		return 0, 0, fmt.Errorf("length of split is %v", len(result))
	}

	min, err := strconv.ParseFloat(result[0], 64)
	if err != nil {
		return 0, 0, err
	}

	max, err := strconv.ParseFloat(result[1], 64)
	if err != nil {
		return 0, 0, err
	}

	if max < min {
		return 0, 0, fmt.Errorf("max is greater than min")
	}

	return min, max, nil
}

// returns in format:
//
//	name: "{min};{max};{default}"
//
// TODO?
//
//	name: "{min};{max};{current/default}"
func Get_properties() map[string]string {
	properties := make(map[string]string)

	boid_sim := Boid_simulation{}
	s := reflect.ValueOf(&boid_sim).Elem()
	typeOfT := s.Type()

	for i := 0; i < s.NumField(); i++ {
		f := s.Field(i)
		tag := typeOfT.Field(i).Tag.Get("Property")
		if len(tag) == 0 {
			continue
		}
		if !f.CanInterface() {
			log.Panicf("tag that has property cannot be interfaced. %d: %v %v\n", i, typeOfT.Field(i).Name, f.Type())
		}

		// fmt.Printf("%d: %s %s = %v\n", i, typeOfT.Field(i).Name, f.Type(), tag)

		min, max, err := parse_property_tag(tag)
		if err != nil {
			log.Panicf("could not parse property %v with error: %v\n", typeOfT.Field(i).Name, err)
		}

		default_tag := typeOfT.Field(i).Tag.Get("Default")
		if len(default_tag) == 0 {
			log.Fatalf("Property %v needs a default\n", typeOfT.Field(i).Name)
		}
		default_value, err := strconv.ParseFloat(default_tag, 64)
		if err != nil {
			log.Fatalf("default value (from %v) could not be parsed into float\n", typeOfT.Field(i).Name)
		}

		// fmt.Printf("min %v, max %v, default %v\n", min, max, default_value)

		properties[typeOfT.Field(i).Name] = fmt.Sprintf("%v;%v;%v", min, max, default_value)
	}

	return properties
}
*/

type Property_Struct struct {
	property_type string

	float_range_min float64
	float_range_max float64
	float_default   float64
}

// dose not error check, call 'assert_all_properties_valid()'
func tag_to_struct(tag reflect.StructTag) Property_Struct {
	property_struct := Property_Struct{}

	// split by spaces.
	split := strings.Split(string(tag), " ")

	// property is always first.
	_, property_property, prop_type := split_one(split[0], ":")

	// only error checking in this function.
	if property_property != "Property" { panic(tag) }

	property_struct.property_type = prop_type
	split = split[1:]

	for len(split) > 0 {
		prop := split[0]
		split = split[1:]

		_, left, right := split_one(prop, ":")
		right = right[1 : len(right)-2] // Remove quotes.

		switch left {

		case "Range": {
			_, min_s, max_s := split_one(right, ";")

			property_struct.float_range_min, _ = strconv.ParseFloat(min_s, 64)
			property_struct.float_range_max, _ = strconv.ParseFloat(max_s, 64)
		}

		case "Default": {
			property_struct.float_default, _ = strconv.ParseFloat(right, 64)
		}

		}
	}

	return property_struct
}

// contains a list of all properties.
//
// is set on first call to assert_all_properties_valid
var Property_Structs map[string]Property_Struct = nil

func Check_Valid_Property_Tags(tag reflect.StructTag) bool {
	// TODO property must be first...
	// TODO check for invalid tags
	panic("TODO")
	return false
}

// TODO is this needed?
func is_property(tag reflect.StructTag) bool {
	_, has_property := tag.Lookup("Property")
	return has_property
}

// will panic if there is something funny
func assert_all_properties_valid() {
	// use property Structs as a flag.
	if Property_Structs != nil { return }
	Property_Structs = make(map[string]Property_Struct, 0)

	boid_sim := Boid_simulation{}
	s := reflect.ValueOf(&boid_sim).Elem()
	typeOfT := s.Type()

	for i := range s.NumField() {
		field := typeOfT.Field(i)

		name := field.Name
		tag := field.Tag

		_, has_property := tag.Lookup("Property")
		if !has_property { continue }

		// start parsing the tag into a struct.
		property_struct := Property_Struct{}

		// space separated tags.
		tag_split := strings.Split(string(tag), " ")

		// property must always first.
		_, property_property, prop_type := split_one(tag_split[0], ":")
		if property_property != "Property" { log.Panicf("field '%v' (witch has the property tag), dose not have the property tag first, was %v\n", name, tag) }

		switch prop_type {
		// TODO use an enum here.
		case "float": { property_struct.property_type = "float" }

		default: { log.Panicf("%v: unknown property type %v\n", name, prop_type) }
		}

		property_struct.property_type = prop_type
		tag_split = tag_split[1:]

		for len(tag_split) > 0 {
			prop := tag_split[0]
			tag_split = tag_split[1:]

			_, left, right := split_one(prop, ":")

			if right[0] != '"' || right[len(right)-1] != '"' { log.Panicf("%v: malformed tag, was '%v'\n", name, tag) }
			right = right[1 : len(right)-2] // Remove quotes.

			switch left {
			case "Range": {
				ok, min_s, max_s := split_one(right, ";")
				if !ok { log.Panicf("%v: right side of range property did not have a ';', was '%v'\n", name, right) }

				min_f, ok1 := strconv.ParseFloat(min_s, 64)
				max_f, ok2 := strconv.ParseFloat(max_s, 64)

				if ok1 != nil || ok2 != nil { log.Panicf("%v: error parsing floats in range. was '%v'\n", name, right) }

				property_struct.float_range_min = min_f
				property_struct.float_range_max = max_f
			}

			case "Default": {
				def, ok := strconv.ParseFloat(right, 64)

				if ok != nil { log.Panicf("%v: error in Default, could not parse float. was '%v'\n", name, right) }

				property_struct.float_default = def
			}

			default: { log.Panicf("%v: Unknown property %v\n", name, left) }
			}
		}

		panic("TODO check that everything was set, and nothing was set twice")

		Property_Structs[name] = property_struct
	}
}


func set_boid_defaults(boid_sim *Boid_simulation) {
	assert_all_properties_valid()

	s := reflect.ValueOf(boid_sim).Elem()
	typeOfT := s.Type()
	for i := 0; i < s.NumField(); i++ {
		field := typeOfT.Field(i)

		if !is_property(field.Tag) { continue }

		property_struct := tag_to_struct(field.Tag)

		settable_field := s.Field(i)

		if property_struct.property_type == "float" {
			settable_field.SetFloat(property_struct.float_default)
		} else {
			panic("TODO other types in set boid defaults.")
		}
	}
}

// returns in format.
//
// name: 'Property:"{float/int}" Range:"{min};{max}" Default:"{default}"'
//
// space separated key value pairs.
func Get_properties() map[string]string {
	assert_all_properties_valid()

	properties := make(map[string]string)

	boid_sim := Boid_simulation{}
	s := reflect.ValueOf(&boid_sim).Elem()
	typeOfT := s.Type()

	for i := range s.NumField() {
		field := typeOfT.Field(i)

		if !is_property(field.Tag) { continue }

		properties[field.Name] = string(field.Tag)
	}

	return properties
}

func (boid_sim *Boid_simulation) Set_Properties_with_map(the_map map[string]Boid_Float) {
	assert_all_properties_valid()

	bad_name := false

	for name, _ := range the_map {

		// check if the name is in the property names.
		valid := false
		for _, real_property := range Property_Names {
			if name == real_property {
				valid = true
				break
			}
		}

		if !valid {
			fmt.Printf("ERROR: '%v'\n", reason)
			bad_name = true
		}
	}

	if bad_name { log.Fatalf("ERROR: There was a bad name.\n") }

	for name, value := range the_map {

		reflect.ValueOf(boid_sim).Elem().FieldByName(name).SetFloat()

		boid_sim.Set_property_by_name(name, value)
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
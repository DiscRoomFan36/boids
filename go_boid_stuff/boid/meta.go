package boid

import (
	"fmt"
	"log"
	"reflect"
	"strconv"
	"strings"
)

// Use reflection to get and set fields,

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

func Get_property_names() []string {
	boid_sim := Boid_simulation{}

	names := make([]string, 0)
	t := reflect.TypeOf(boid_sim)
	for i := 0; i < t.NumField(); i++ {
		field := t.Field(i)

		// TODO unnecessary work in this function.
		valid, _ := Is_valid_property(field.Name)

		if valid {
			names = append(names, t.Field(i).Name)
		}
	}

	return names
}

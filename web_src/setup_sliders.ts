
import { Log_Type, log, DEBUG_SLIDERS } from "./logger";

enum Property_Type {
    None,
    Property_Float,
    Property_Int,
}

class Property_Struct {
    property_type:   Property_Type = Property_Type.None;

    // Float properties
    float_range_min: number = 0;
    float_range_max: number = 0;
    float_default:   number = 0;

    // Int properties
    int_range_min:   number = 0;
    int_range_max:   number = 0;
    int_default:     number = 0;
}

function tag_prop_to_parts(prop: string): [string, string] {
    const [left, right_] = prop.split(":")
    const right = right_.slice(1, right_.length-1)
    return [left, right]
}


// puts some sliders up to control some parameters
export function setup_sliders(properties: [string, string][], set_property: (name:string, value:number) => void) {

    const slider_container = document.getElementById("slideContainer");
    if (slider_container === null) { throw new Error("Cannot Get slider container"); }

    // TODO for the slides that have a small range (like cohesion factor) make the value the square of the number.

    properties.sort() // hope someone else wasn't using this.

    for (const [name, tag] of properties) {

        log(Log_Type.Debug_Sliders, `typescript: ${name}: ${tag}`);

        // TODO this function is growing to big, put it in a separate file.

        const tag_split = (tag as string).split(" ");

        const [prop_property, prop_type] = tag_prop_to_parts(tag_split[0]);
        if (prop_property != "Property") throw new Error(`First property is not property, tag was ${tag}`);

        const property_struct = new Property_Struct();

        switch (prop_type) {
        case "float": property_struct.property_type = Property_Type.Property_Float; break;
        case "int":   property_struct.property_type = Property_Type.Property_Int; break;

        default: throw new Error(`Unknown prop type ${prop_type}`);
        }

        tag_split.shift();


        while (tag_split.length > 0) {
            const [left, right] = tag_prop_to_parts(tag_split[0])
            tag_split.shift()

            switch (left) {
            case "Range":
                const [min_s, max_s] = right.split(";");

                switch (property_struct.property_type) {
                case Property_Type.Property_Float:
                    property_struct.float_range_min = parseFloat(min_s);
                    property_struct.float_range_max = parseFloat(max_s);
                    break;

                case Property_Type.Property_Int:
                    property_struct.int_range_min = parseInt(min_s);
                    property_struct.int_range_max = parseInt(max_s);
                    break;

                default: throw new Error(`Unknown type in ${name}`);
                }

                break;

            case "Default":
                switch (property_struct.property_type) {
                case Property_Type.Property_Float: property_struct.float_default = parseFloat(right); break;
                case Property_Type.Property_Int  : property_struct.int_default   = parseInt  (right); break;

                default: throw new Error(`Unknown type in ${name}`);
                }

                break;

            default: throw new Error(`Unknown property ${left}`);
            }
        }

        // TODO some way to print an object.
        // log(Log_Type.Debug_Sliders, `property struct ${property_struct}`);

        const id = `slider_${name}`;
        const para_id = `${id}_paragraph`;
        const paragraph_text = `${name.replace(/_/g, " ")}`

        var initial_value;
        var initial_value_for_text;

        switch (property_struct.property_type) {
        case Property_Type.Property_Float:
            initial_value = property_struct.float_default;
            initial_value_for_text = initial_value.toPrecision(2)
            break;
        case Property_Type.Property_Int:
            initial_value = property_struct.int_default;
            initial_value_for_text = initial_value
            break;

        default: throw new Error(`Unknown type in 'initial value' ${name}`);
        }

        const map_range_to_slider_number = (x: number): number => {
            switch (property_struct.property_type) {
            case Property_Type.Property_Float: {
                const min = property_struct.float_range_min;
                const max = property_struct.float_range_max;
                return (x-min)/(max-min)*(1000-0) + 0
            }

            case Property_Type.Property_Int: {
                const min = property_struct.int_range_min;
                const max = property_struct.int_range_max;
                return (x-min)/(max-min)*(1000-0) + 0
            }

            default: throw new Error(`Unknown type in 'map_range_to_slider_number' ${name}`);
            }

        }
        const map_range_to_real_range = (x: number): number => {
            switch (property_struct.property_type) {
            case Property_Type.Property_Float: {
                const min = property_struct.float_range_min;
                const max = property_struct.float_range_max;
                // TODO toPrecision might not be the best function for formatting. margin is being messed with (1.0e+2)
                // make it the proper value // TODO is this correct? even for small values?
                return parseFloat(((x-0)/(1000-0)*(max-min) + min).toPrecision(2))
            }

            case Property_Type.Property_Int: {
                const min = property_struct.int_range_min;
                const max = property_struct.int_range_max;
                // make it the proper value
                return Math.floor((x-0)/(1000-0)*(max-min) + min)
            }

            default: throw new Error(`Unknown type in 'map_range_to_real_range' ${name}`);
            }
        }

        // TODO a lot of numbers must be between 0-1, because sliders only use ints (look up if this is the case.) we will have to get creative
        // TODO use step. might clean this up a bit.
        const html_string = `
            <p class="sliderKey" id="${para_id}">
                ${paragraph_text}: ${initial_value_for_text}
            </p>
            <input type="range" min="0" max="1000" value="${map_range_to_slider_number(initial_value)}" class="slider" id="${id}">
            `;

        const new_thing = document.createElement("div");
        new_thing.className = "rangeHolder";
        new_thing.innerHTML = html_string;

        slider_container.appendChild(new_thing);

        const slider = document.getElementById(id) as HTMLInputElement | null;
        if (slider === null) throw new Error("Could not find the slider");


        slider.addEventListener("input", (event) => {
            const slider_value_string = (event.target as HTMLInputElement).value;

            const slider_number = map_range_to_real_range(Number(slider_value_string));

            const slider_text = document.getElementById(para_id) as HTMLParagraphElement | null;
            if (slider_text === null) throw new Error(`could not find slider_text ${para_id}`);

            slider_text.textContent = `${paragraph_text}: ${slider_number}`

            set_property(name, slider_number)
        })
    }
}

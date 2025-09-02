/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./web_src/logger.ts":
/*!***************************!*\
  !*** ./web_src/logger.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Log_Type = exports.DEBUG_SLIDERS = exports.DEBUG_DISPLAY = void 0;
exports.log = log;
exports.DEBUG_DISPLAY = true;
exports.DEBUG_SLIDERS = false;
var Log_Type;
(function (Log_Type) {
    Log_Type[Log_Type["General"] = 0] = "General";
    Log_Type[Log_Type["Debug_Display"] = 1] = "Debug_Display";
    Log_Type[Log_Type["Debug_Sliders"] = 2] = "Debug_Sliders";
})(Log_Type || (exports.Log_Type = Log_Type = {}));
function log(log_type, ...data) {
    // if this is the empty string
    var do_log = false;
    var log_header = "";
    switch (log_type) {
        case Log_Type.General:
            log_header = "";
            do_log = true;
            break;
        case Log_Type.Debug_Display:
            log_header = "DEBUG_DISPLAY";
            if (exports.DEBUG_DISPLAY)
                do_log = true;
            break;
        case Log_Type.Debug_Sliders:
            log_header = "DEBUG_SLIDERS";
            if (exports.DEBUG_SLIDERS)
                do_log = true;
            break;
    }
    if (do_log) {
        if (log_header != "") {
            console.log(`${log_header}: `, ...data);
        }
        else {
            console.log(...data);
        }
    }
}


/***/ }),

/***/ "./web_src/setup_sliders.ts":
/*!**********************************!*\
  !*** ./web_src/setup_sliders.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.setup_sliders = setup_sliders;
const logger_1 = __webpack_require__(/*! ./logger */ "./web_src/logger.ts");
var Property_Type;
(function (Property_Type) {
    Property_Type[Property_Type["None"] = 0] = "None";
    Property_Type[Property_Type["Property_Float"] = 1] = "Property_Float";
    Property_Type[Property_Type["Property_Int"] = 2] = "Property_Int";
    Property_Type[Property_Type["Property_Bool"] = 3] = "Property_Bool";
})(Property_Type || (Property_Type = {}));
class Property_Struct {
    constructor() {
        this.property_type = Property_Type.None;
        // Float properties
        this.float_range_min = 0;
        this.float_range_max = 0;
        this.float_default = 0;
        // Int properties
        this.int_range_min = 0;
        this.int_range_max = 0;
        this.int_default = 0;
        this.bool_default = false;
    }
}
function tag_prop_to_parts(prop) {
    const [left, right_] = prop.split(":");
    const right = right_.slice(1, right_.length - 1);
    return [left, right];
}
function parseBool(s) {
    // 1, t, T, TRUE, true, True,
    // 0, f, F, FALSE, false, False
    switch (s) {
        case "1":
        case "t":
        case "T":
        case "TRUE":
        case "true":
        case "True":
            return true;
        case "0":
        case "f":
        case "F":
        case "FALSE":
        case "false":
        case "False":
            return false;
        default: throw new Error(`Unknown string in parseBool, was ${s}`);
    }
}
// puts some sliders up to control some parameters
function setup_sliders(properties, set_property) {
    const slider_container = document.getElementById("slideContainer");
    if (slider_container === null) {
        throw new Error("Cannot Get slider container");
    }
    // TODO for the slides that have a small range (like cohesion factor) make the value the square of the number.
    properties.sort(); // hope someone else wasn't using this.
    for (const [name, tag] of properties) {
        (0, logger_1.log)(logger_1.Log_Type.Debug_Sliders, `typescript: ${name}: ${tag}`);
        // TODO this function is growing to big, put it in a separate file.
        const tag_split = tag.split(" ");
        const [prop_property, prop_type] = tag_prop_to_parts(tag_split[0]);
        if (prop_property != "Property")
            throw new Error(`First property is not property, tag was ${tag}`);
        const property_struct = new Property_Struct();
        switch (prop_type) {
            case "float":
                property_struct.property_type = Property_Type.Property_Float;
                break;
            case "int":
                property_struct.property_type = Property_Type.Property_Int;
                break;
            case "bool":
                property_struct.property_type = Property_Type.Property_Bool;
                break;
            default: throw new Error(`Unknown prop type ${prop_type}`);
        }
        tag_split.shift();
        while (tag_split.length > 0) {
            const [left, right] = tag_prop_to_parts(tag_split[0]);
            tag_split.shift();
            switch (left) {
                case "Range":
                    switch (property_struct.property_type) {
                        case Property_Type.Property_Float: {
                            const [min_s, max_s] = right.split(";");
                            property_struct.float_range_min = parseFloat(min_s);
                            property_struct.float_range_max = parseFloat(max_s);
                            break;
                        }
                        case Property_Type.Property_Int: {
                            const [min_s, max_s] = right.split(";");
                            property_struct.int_range_min = parseInt(min_s);
                            property_struct.int_range_max = parseInt(max_s);
                            break;
                        }
                        case Property_Type.Property_Bool: {
                            throw new Error("Boolean dose not have a range!");
                        }
                        default: throw new Error(`Unknown type in ${name}`);
                    }
                    break;
                case "Default":
                    switch (property_struct.property_type) {
                        case Property_Type.Property_Float:
                            property_struct.float_default = parseFloat(right);
                            break;
                        case Property_Type.Property_Int:
                            property_struct.int_default = parseInt(right);
                            break;
                        case Property_Type.Property_Bool:
                            property_struct.bool_default = parseBool(right);
                            break;
                        default: throw new Error(`Unknown type in ${name}`);
                    }
                    break;
                default: throw new Error(`Unknown property ${left}`);
            }
        }
        // TODO some way to print an object.
        // log(Log_Type.Debug_Sliders, `property struct ${property_struct}`);
        switch (property_struct.property_type) {
            case Property_Type.Property_Float:
                make_float_slider(slider_container, name, property_struct, set_property);
                break;
            case Property_Type.Property_Int:
                make_int_slider(slider_container, name, property_struct, set_property);
                break;
            case Property_Type.Property_Bool:
                make_bool_slider(slider_container, name, property_struct, set_property);
                break;
            default: throw new Error(`Unknown property type ${property_struct.property_type}`);
        }
    }
}
///////////////////////////////////////////////
//         Make a slider for an float
///////////////////////////////////////////////
function make_float_slider(slider_container, name, property_struct, set_property) {
    const id = `slider_${name}`;
    const para_id = `${id}_paragraph`;
    const paragraph_text = `${name.replace(/_/g, " ")}`;
    const html_string = `
        <p class="sliderKey" id="${para_id}">
            ${paragraph_text}: ${property_struct.float_default}
        </p>
        <input type="range" min="${property_struct.float_range_min}" max="${property_struct.float_range_max}" value="${property_struct.float_default}" step="0.005" class="slider" id="${id}">
        `;
    const new_thing = document.createElement("div");
    new_thing.className = "rangeHolder";
    new_thing.innerHTML = html_string;
    slider_container.appendChild(new_thing);
    const slider = document.getElementById(id);
    if (slider === null)
        throw new Error("Could not find the slider");
    slider.addEventListener("input", (event) => {
        const slider_value_string = event.target.value;
        const slider_number = Number(slider_value_string);
        const slider_text = document.getElementById(para_id);
        if (slider_text === null)
            throw new Error(`could not find slider_text ${para_id}`);
        slider_text.textContent = `${paragraph_text}: ${slider_number}`;
        set_property(name, slider_number);
    });
}
///////////////////////////////////////////////
//          Make a slider for an int
///////////////////////////////////////////////
function make_int_slider(slider_container, name, property_struct, set_property) {
    const id = `slider_${name}`;
    const para_id = `${id}_paragraph`;
    const paragraph_text = `${name.replace(/_/g, " ")}`;
    const html_string = `
        <p class="sliderKey" id="${para_id}">
            ${paragraph_text}: ${property_struct.int_default}
        </p>
        <input type="range" min="${property_struct.int_range_min}" max="${property_struct.int_range_max}" value="${property_struct.int_default}" class="slider" id="${id}">
        `;
    const new_thing = document.createElement("div");
    new_thing.className = "rangeHolder";
    new_thing.innerHTML = html_string;
    slider_container.appendChild(new_thing);
    const slider = document.getElementById(id);
    if (slider === null)
        throw new Error("Could not find the slider");
    slider.addEventListener("input", (event) => {
        const slider_value_string = event.target.value;
        const slider_number = Number(slider_value_string);
        const slider_text = document.getElementById(para_id);
        if (slider_text === null)
            throw new Error(`could not find slider_text ${para_id}`);
        slider_text.textContent = `${paragraph_text}: ${slider_number}`;
        set_property(name, slider_number);
    });
}
///////////////////////////////////////////////
//     Make a slider for an boolean toggle
///////////////////////////////////////////////
function make_bool_slider(slider_container, name, property_struct, set_property) {
    const id = `slider_${name}`;
    const paragraph_text = `${name.replace(/_/g, " ")}`;
    const html_string = `
        <input type="checkbox" ${property_struct.bool_default ? "checked" : ""} class="checkbox_toggle" id="${id}">
        <label for="${id}" class="checkbox_toggle_label">${paragraph_text}</label>
        `;
    const new_thing = document.createElement("div");
    new_thing.className = "rangeHolder";
    new_thing.innerHTML = html_string;
    slider_container.appendChild(new_thing);
    const slider = document.getElementById(id);
    if (slider === null)
        throw new Error("Could not find the slider");
    slider.addEventListener("input", (event) => {
        const checked = event.target.checked;
        set_property(name, checked);
    });
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;
/*!**************************!*\
  !*** ./web_src/index.ts ***!
  \**************************/

// typescript glue code.
Object.defineProperty(exports, "__esModule", ({ value: true }));
const logger_1 = __webpack_require__(/*! ./logger */ "./web_src/logger.ts");
const setup_sliders_1 = __webpack_require__(/*! ./setup_sliders */ "./web_src/setup_sliders.ts");
// NOTE we keep the @ts-ignore's in here
async function GetGoFunctions() {
    // @ts-ignore
    const go = new Go(); // NOTE this comes from the wasm_exec.js thing
    const result = await WebAssembly.instantiateStreaming(fetch("dist/boid.wasm"), go.importObject);
    go.run(result.instance);
    return {
        // @ts-ignore
        SetProperties: SetProperties,
        // @ts-ignore
        GetProperties: GetProperties,
        // @ts-ignore
        GetNextFrame: GetNextFrame,
    };
}
const NUM_COLOR_COMPONENTS = 4;
const SQUISH_FACTOR = 1;
;
;
const mouse = {
    pos: { x: 0, y: 0 },
    left_down: false,
    middle_down: false,
    right_down: false,
};
function renderBoids(display, go) {
    const width = Math.floor(display.ctx.canvas.width / SQUISH_FACTOR);
    const height = Math.floor(display.ctx.canvas.height / SQUISH_FACTOR);
    const buffer_size = width * height * NUM_COLOR_COMPONENTS;
    if (display.backImageWidth !== width || display.backImageHeight !== height) {
        (0, logger_1.log)(logger_1.Log_Type.General, "Oh god. were resizing the buffer");
        if (display.backBufferArray.length < buffer_size) {
            (0, logger_1.log)(logger_1.Log_Type.General, "Its getting bigger"); // my penis
            // make the buffer bigger
            display.backBufferArray = new Uint8ClampedArray(buffer_size);
        }
        const backCanvas = new OffscreenCanvas(width, height);
        const backCtx = backCanvas.getContext("2d");
        if (backCtx === null)
            throw new Error("2D context is not supported");
        display.backCtx = backCtx;
        display.backCtx.imageSmoothingEnabled = false;
        display.backImageWidth = width;
        display.backImageHeight = height;
    }
    const buffer = display.backBufferArray.subarray(0, buffer_size);
    const args = {
        width: width,
        height: height,
        buffer: buffer,
        mouse: mouse,
    };
    const numFilled = go.GetNextFrame(args);
    if (numFilled !== buffer_size)
        throw new Error(`GetNextFrame got ${numFilled}`);
    // @ts-ignore // why dose this line make an error in my editor
    const imageData = new ImageData(buffer, width, height);
    // is this cool?
    display.backCtx.putImageData(imageData, 0, 0);
    // NOTE this will stretch the thing.
    // canvas.width might change during the time this is running
    display.ctx.drawImage(display.backCtx.canvas, 0, 0, display.ctx.canvas.width, display.ctx.canvas.height);
    // imageData = null
}
const renderTimes = [];
const deltaTimes = [];
// Credit: https://github.com/tsoding/koil
function renderDebugInfo(display, renderTime, deltaTime) {
    const fontSize = 28;
    display.ctx.font = `${fontSize}px bold`;
    const labels = [];
    renderTimes.push(renderTime);
    if (renderTimes.length > 60) {
        renderTimes.shift();
    }
    deltaTimes.push(deltaTime);
    if (deltaTimes.length > 60) {
        deltaTimes.shift();
    }
    const renderAvg = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
    const deltaAvg = deltaTimes.reduce((a, b) => a + b, 0) / deltaTimes.length;
    labels.push(`FPS: ${(1 / deltaAvg * 1000).toFixed(2)}`);
    labels.push(`ms per frame: ${deltaAvg.toFixed(2)}`);
    labels.push(`Render Time Avg (ms): ${renderAvg.toFixed(2)}`);
    labels.push(`Render/Sec (MAX): ${(1 / renderAvg * 1000).toFixed(2)}`);
    const padding = 70;
    const shadowOffset = fontSize * 0.06;
    for (let i = 0; i < labels.length; i++) {
        display.ctx.fillStyle = "black";
        display.ctx.fillText(labels[i], padding, padding + fontSize * i);
        display.ctx.fillStyle = "white";
        display.ctx.fillText(labels[i], padding + shadowOffset, padding - shadowOffset + fontSize * i);
    }
}
(async () => {
    const go = await GetGoFunctions();
    { // Handle slider stuff
        const properties = Object.entries(go.GetProperties());
        function set_property(name, value) {
            // https://stackoverflow.com/questions/12710905/how-do-i-dynamically-assign-properties-to-an-object-in-typescript
            const obj = {};
            obj[name] = value;
            go.SetProperties(obj);
        }
        (0, setup_sliders_1.setup_sliders)(properties, set_property);
    }
    // const canvas_container = document.getElementById("canvas_div") as HTMLCanvasElement | null
    const boidCanvas = document.getElementById("boid_canvas");
    if (boidCanvas === null)
        throw new Error("No canvas with id `boid_canvas` is found");
    // why doesn't typescript have an enum for this?
    let mouse_buttons;
    (function (mouse_buttons) {
        mouse_buttons[mouse_buttons["MOUSE_LEFT"] = 0] = "MOUSE_LEFT";
        mouse_buttons[mouse_buttons["MOUSE_MIDDLE"] = 1] = "MOUSE_MIDDLE";
        mouse_buttons[mouse_buttons["MOUSE_RIGHT"] = 2] = "MOUSE_RIGHT";
    })(mouse_buttons || (mouse_buttons = {}));
    const root = document.getRootNode();
    // NOTE should this be on the canvas or on the root?
    root.addEventListener('mousemove', (ev) => { mouse.pos = { x: ev.x, y: ev.y }; });
    // this will break if the user slides there mouse outside of the screen while clicking, but this is the web, people expect it to suck.
    root.addEventListener('mousedown', (ev) => {
        if (ev.button == mouse_buttons.MOUSE_LEFT)
            mouse.left_down = true;
        if (ev.button == mouse_buttons.MOUSE_MIDDLE)
            mouse.middle_down = true;
        if (ev.button == mouse_buttons.MOUSE_RIGHT)
            mouse.right_down = true;
    });
    root.addEventListener('mouseup', (ev) => {
        if (ev.button == mouse_buttons.MOUSE_LEFT)
            mouse.left_down = false;
        if (ev.button == mouse_buttons.MOUSE_MIDDLE)
            mouse.middle_down = false;
        if (ev.button == mouse_buttons.MOUSE_RIGHT)
            mouse.right_down = false;
    });
    const ctx = boidCanvas.getContext("2d");
    if (ctx === null)
        throw new Error("2D context is not supported");
    ctx.imageSmoothingEnabled = false;
    const [backImageWidth, backImageHeight] = [ctx.canvas.width, ctx.canvas.height];
    const backCanvas = new OffscreenCanvas(backImageWidth, backImageHeight);
    const backCtx = backCanvas.getContext("2d");
    if (backCtx === null)
        throw new Error("2D context is not supported");
    backCtx.imageSmoothingEnabled = false;
    const backBufferArray = new Uint8ClampedArray(backImageWidth * backImageHeight * 4);
    const display = {
        ctx,
        backCtx,
        backBufferArray,
        backImageWidth,
        backImageHeight,
    };
    let prevTimestamp = 0;
    const frame = (timestamp) => {
        ctx.canvas.width = window.innerWidth;
        ctx.canvas.height = window.innerHeight;
        const deltaTime = (timestamp - prevTimestamp);
        prevTimestamp = timestamp;
        // TODO Don't need delta time, boid thing dose it for us? change?
        const startTime = performance.now();
        renderBoids(display, go);
        const endTime = performance.now();
        // In ms
        const renderTime = endTime - startTime;
        if (logger_1.DEBUG_DISPLAY)
            renderDebugInfo(display, renderTime, deltaTime);
        window.requestAnimationFrame(frame);
    };
    window.requestAnimationFrame((timestamp) => {
        prevTimestamp = timestamp;
        window.requestAnimationFrame(frame);
    });
})();

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGQuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFhO0FBQ2IsOENBQTZDLEVBQUUsYUFBYSxFQUFDO0FBQzdELGdCQUFnQixHQUFHLHFCQUFxQixHQUFHLHFCQUFxQjtBQUNoRSxXQUFXO0FBQ1gscUJBQXFCO0FBQ3JCLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQyxlQUFlLGdCQUFnQixnQkFBZ0I7QUFDaEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQkFBMkIsV0FBVztBQUN0QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7O0FDeENhO0FBQ2IsOENBQTZDLEVBQUUsYUFBYSxFQUFDO0FBQzdELHFCQUFxQjtBQUNyQixpQkFBaUIsbUJBQU8sQ0FBQyxxQ0FBVTtBQUNuQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDLHNDQUFzQztBQUN2QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFFQUFxRSxFQUFFO0FBQ3ZFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVCQUF1QjtBQUN2QjtBQUNBLDBFQUEwRSxLQUFLLElBQUksSUFBSTtBQUN2RjtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVFQUF1RSxJQUFJO0FBQzNFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwREFBMEQsVUFBVTtBQUNwRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpRUFBaUU7QUFDakU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlFQUFpRTtBQUNqRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9FQUFvRSxLQUFLO0FBQ3pFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0VBQW9FLEtBQUs7QUFDekU7QUFDQTtBQUNBLDZEQUE2RCxLQUFLO0FBQ2xFO0FBQ0E7QUFDQTtBQUNBLDBEQUEwRCxnQkFBZ0I7QUFDMUU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw4REFBOEQsOEJBQThCO0FBQzVGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCLEtBQUs7QUFDOUIsdUJBQXVCLEdBQUc7QUFDMUIsOEJBQThCLHdCQUF3QjtBQUN0RDtBQUNBLG1DQUFtQyxRQUFRO0FBQzNDLGNBQWMsZUFBZSxJQUFJO0FBQ2pDO0FBQ0EsbUNBQW1DLGdDQUFnQyxTQUFTLGdDQUFnQyxXQUFXLDhCQUE4QixvQ0FBb0MsR0FBRztBQUM1TDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDBEQUEwRCxRQUFRO0FBQ2xFLHFDQUFxQyxlQUFlLElBQUksY0FBYztBQUN0RTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCLEtBQUs7QUFDOUIsdUJBQXVCLEdBQUc7QUFDMUIsOEJBQThCLHdCQUF3QjtBQUN0RDtBQUNBLG1DQUFtQyxRQUFRO0FBQzNDLGNBQWMsZUFBZSxJQUFJO0FBQ2pDO0FBQ0EsbUNBQW1DLDhCQUE4QixTQUFTLDhCQUE4QixXQUFXLDRCQUE0Qix1QkFBdUIsR0FBRztBQUN6SztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDBEQUEwRCxRQUFRO0FBQ2xFLHFDQUFxQyxlQUFlLElBQUksY0FBYztBQUN0RTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCLEtBQUs7QUFDOUIsOEJBQThCLHdCQUF3QjtBQUN0RDtBQUNBLGlDQUFpQywrQ0FBK0MsOEJBQThCLEdBQUc7QUFDakgsc0JBQXNCLEdBQUcsa0NBQWtDLGVBQWU7QUFDMUU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDs7Ozs7OztVQzFOQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBOztVQUVBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBOzs7Ozs7Ozs7O0FDdEJhO0FBQ2I7QUFDQSw4Q0FBNkMsRUFBRSxhQUFhLEVBQUM7QUFDN0QsaUJBQWlCLG1CQUFPLENBQUMscUNBQVU7QUFDbkMsd0JBQXdCLG1CQUFPLENBQUMsbURBQWlCO0FBQ2pEO0FBQ0E7QUFDQTtBQUNBLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFdBQVcsWUFBWTtBQUN2QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0ZBQWdGO0FBQ2hGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDRDQUE0QyxVQUFVO0FBQ3REO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwQkFBMEIsU0FBUztBQUNuQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLGlDQUFpQztBQUN6RCxpQ0FBaUMsb0JBQW9CO0FBQ3JELHlDQUF5QyxxQkFBcUI7QUFDOUQscUNBQXFDLGtDQUFrQztBQUN2RTtBQUNBO0FBQ0Esb0JBQW9CLG1CQUFtQjtBQUN2QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSyxzQ0FBc0M7QUFDM0M7QUFDQTtBQUNBLGlEQUFpRCxjQUFjLHFCQUFxQjtBQUNwRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMLENBQUMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9ib2lkcy8uL3dlYl9zcmMvbG9nZ2VyLnRzIiwid2VicGFjazovL2JvaWRzLy4vd2ViX3NyYy9zZXR1cF9zbGlkZXJzLnRzIiwid2VicGFjazovL2JvaWRzL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2JvaWRzLy4vd2ViX3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuTG9nX1R5cGUgPSBleHBvcnRzLkRFQlVHX1NMSURFUlMgPSBleHBvcnRzLkRFQlVHX0RJU1BMQVkgPSB2b2lkIDA7XG5leHBvcnRzLmxvZyA9IGxvZztcbmV4cG9ydHMuREVCVUdfRElTUExBWSA9IHRydWU7XG5leHBvcnRzLkRFQlVHX1NMSURFUlMgPSBmYWxzZTtcbnZhciBMb2dfVHlwZTtcbihmdW5jdGlvbiAoTG9nX1R5cGUpIHtcbiAgICBMb2dfVHlwZVtMb2dfVHlwZVtcIkdlbmVyYWxcIl0gPSAwXSA9IFwiR2VuZXJhbFwiO1xuICAgIExvZ19UeXBlW0xvZ19UeXBlW1wiRGVidWdfRGlzcGxheVwiXSA9IDFdID0gXCJEZWJ1Z19EaXNwbGF5XCI7XG4gICAgTG9nX1R5cGVbTG9nX1R5cGVbXCJEZWJ1Z19TbGlkZXJzXCJdID0gMl0gPSBcIkRlYnVnX1NsaWRlcnNcIjtcbn0pKExvZ19UeXBlIHx8IChleHBvcnRzLkxvZ19UeXBlID0gTG9nX1R5cGUgPSB7fSkpO1xuZnVuY3Rpb24gbG9nKGxvZ190eXBlLCAuLi5kYXRhKSB7XG4gICAgLy8gaWYgdGhpcyBpcyB0aGUgZW1wdHkgc3RyaW5nXG4gICAgdmFyIGRvX2xvZyA9IGZhbHNlO1xuICAgIHZhciBsb2dfaGVhZGVyID0gXCJcIjtcbiAgICBzd2l0Y2ggKGxvZ190eXBlKSB7XG4gICAgICAgIGNhc2UgTG9nX1R5cGUuR2VuZXJhbDpcbiAgICAgICAgICAgIGxvZ19oZWFkZXIgPSBcIlwiO1xuICAgICAgICAgICAgZG9fbG9nID0gdHJ1ZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIExvZ19UeXBlLkRlYnVnX0Rpc3BsYXk6XG4gICAgICAgICAgICBsb2dfaGVhZGVyID0gXCJERUJVR19ESVNQTEFZXCI7XG4gICAgICAgICAgICBpZiAoZXhwb3J0cy5ERUJVR19ESVNQTEFZKVxuICAgICAgICAgICAgICAgIGRvX2xvZyA9IHRydWU7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBMb2dfVHlwZS5EZWJ1Z19TbGlkZXJzOlxuICAgICAgICAgICAgbG9nX2hlYWRlciA9IFwiREVCVUdfU0xJREVSU1wiO1xuICAgICAgICAgICAgaWYgKGV4cG9ydHMuREVCVUdfU0xJREVSUylcbiAgICAgICAgICAgICAgICBkb19sb2cgPSB0cnVlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGlmIChkb19sb2cpIHtcbiAgICAgICAgaWYgKGxvZ19oZWFkZXIgIT0gXCJcIikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYCR7bG9nX2hlYWRlcn06IGAsIC4uLmRhdGEpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5sb2coLi4uZGF0YSk7XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuc2V0dXBfc2xpZGVycyA9IHNldHVwX3NsaWRlcnM7XG5jb25zdCBsb2dnZXJfMSA9IHJlcXVpcmUoXCIuL2xvZ2dlclwiKTtcbnZhciBQcm9wZXJ0eV9UeXBlO1xuKGZ1bmN0aW9uIChQcm9wZXJ0eV9UeXBlKSB7XG4gICAgUHJvcGVydHlfVHlwZVtQcm9wZXJ0eV9UeXBlW1wiTm9uZVwiXSA9IDBdID0gXCJOb25lXCI7XG4gICAgUHJvcGVydHlfVHlwZVtQcm9wZXJ0eV9UeXBlW1wiUHJvcGVydHlfRmxvYXRcIl0gPSAxXSA9IFwiUHJvcGVydHlfRmxvYXRcIjtcbiAgICBQcm9wZXJ0eV9UeXBlW1Byb3BlcnR5X1R5cGVbXCJQcm9wZXJ0eV9JbnRcIl0gPSAyXSA9IFwiUHJvcGVydHlfSW50XCI7XG4gICAgUHJvcGVydHlfVHlwZVtQcm9wZXJ0eV9UeXBlW1wiUHJvcGVydHlfQm9vbFwiXSA9IDNdID0gXCJQcm9wZXJ0eV9Cb29sXCI7XG59KShQcm9wZXJ0eV9UeXBlIHx8IChQcm9wZXJ0eV9UeXBlID0ge30pKTtcbmNsYXNzIFByb3BlcnR5X1N0cnVjdCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucHJvcGVydHlfdHlwZSA9IFByb3BlcnR5X1R5cGUuTm9uZTtcbiAgICAgICAgLy8gRmxvYXQgcHJvcGVydGllc1xuICAgICAgICB0aGlzLmZsb2F0X3JhbmdlX21pbiA9IDA7XG4gICAgICAgIHRoaXMuZmxvYXRfcmFuZ2VfbWF4ID0gMDtcbiAgICAgICAgdGhpcy5mbG9hdF9kZWZhdWx0ID0gMDtcbiAgICAgICAgLy8gSW50IHByb3BlcnRpZXNcbiAgICAgICAgdGhpcy5pbnRfcmFuZ2VfbWluID0gMDtcbiAgICAgICAgdGhpcy5pbnRfcmFuZ2VfbWF4ID0gMDtcbiAgICAgICAgdGhpcy5pbnRfZGVmYXVsdCA9IDA7XG4gICAgICAgIHRoaXMuYm9vbF9kZWZhdWx0ID0gZmFsc2U7XG4gICAgfVxufVxuZnVuY3Rpb24gdGFnX3Byb3BfdG9fcGFydHMocHJvcCkge1xuICAgIGNvbnN0IFtsZWZ0LCByaWdodF9dID0gcHJvcC5zcGxpdChcIjpcIik7XG4gICAgY29uc3QgcmlnaHQgPSByaWdodF8uc2xpY2UoMSwgcmlnaHRfLmxlbmd0aCAtIDEpO1xuICAgIHJldHVybiBbbGVmdCwgcmlnaHRdO1xufVxuZnVuY3Rpb24gcGFyc2VCb29sKHMpIHtcbiAgICAvLyAxLCB0LCBULCBUUlVFLCB0cnVlLCBUcnVlLFxuICAgIC8vIDAsIGYsIEYsIEZBTFNFLCBmYWxzZSwgRmFsc2VcbiAgICBzd2l0Y2ggKHMpIHtcbiAgICAgICAgY2FzZSBcIjFcIjpcbiAgICAgICAgY2FzZSBcInRcIjpcbiAgICAgICAgY2FzZSBcIlRcIjpcbiAgICAgICAgY2FzZSBcIlRSVUVcIjpcbiAgICAgICAgY2FzZSBcInRydWVcIjpcbiAgICAgICAgY2FzZSBcIlRydWVcIjpcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICBjYXNlIFwiMFwiOlxuICAgICAgICBjYXNlIFwiZlwiOlxuICAgICAgICBjYXNlIFwiRlwiOlxuICAgICAgICBjYXNlIFwiRkFMU0VcIjpcbiAgICAgICAgY2FzZSBcImZhbHNlXCI6XG4gICAgICAgIGNhc2UgXCJGYWxzZVwiOlxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICBkZWZhdWx0OiB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gc3RyaW5nIGluIHBhcnNlQm9vbCwgd2FzICR7c31gKTtcbiAgICB9XG59XG4vLyBwdXRzIHNvbWUgc2xpZGVycyB1cCB0byBjb250cm9sIHNvbWUgcGFyYW1ldGVyc1xuZnVuY3Rpb24gc2V0dXBfc2xpZGVycyhwcm9wZXJ0aWVzLCBzZXRfcHJvcGVydHkpIHtcbiAgICBjb25zdCBzbGlkZXJfY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzbGlkZUNvbnRhaW5lclwiKTtcbiAgICBpZiAoc2xpZGVyX2NvbnRhaW5lciA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgR2V0IHNsaWRlciBjb250YWluZXJcIik7XG4gICAgfVxuICAgIC8vIFRPRE8gZm9yIHRoZSBzbGlkZXMgdGhhdCBoYXZlIGEgc21hbGwgcmFuZ2UgKGxpa2UgY29oZXNpb24gZmFjdG9yKSBtYWtlIHRoZSB2YWx1ZSB0aGUgc3F1YXJlIG9mIHRoZSBudW1iZXIuXG4gICAgcHJvcGVydGllcy5zb3J0KCk7IC8vIGhvcGUgc29tZW9uZSBlbHNlIHdhc24ndCB1c2luZyB0aGlzLlxuICAgIGZvciAoY29uc3QgW25hbWUsIHRhZ10gb2YgcHJvcGVydGllcykge1xuICAgICAgICAoMCwgbG9nZ2VyXzEubG9nKShsb2dnZXJfMS5Mb2dfVHlwZS5EZWJ1Z19TbGlkZXJzLCBgdHlwZXNjcmlwdDogJHtuYW1lfTogJHt0YWd9YCk7XG4gICAgICAgIC8vIFRPRE8gdGhpcyBmdW5jdGlvbiBpcyBncm93aW5nIHRvIGJpZywgcHV0IGl0IGluIGEgc2VwYXJhdGUgZmlsZS5cbiAgICAgICAgY29uc3QgdGFnX3NwbGl0ID0gdGFnLnNwbGl0KFwiIFwiKTtcbiAgICAgICAgY29uc3QgW3Byb3BfcHJvcGVydHksIHByb3BfdHlwZV0gPSB0YWdfcHJvcF90b19wYXJ0cyh0YWdfc3BsaXRbMF0pO1xuICAgICAgICBpZiAocHJvcF9wcm9wZXJ0eSAhPSBcIlByb3BlcnR5XCIpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEZpcnN0IHByb3BlcnR5IGlzIG5vdCBwcm9wZXJ0eSwgdGFnIHdhcyAke3RhZ31gKTtcbiAgICAgICAgY29uc3QgcHJvcGVydHlfc3RydWN0ID0gbmV3IFByb3BlcnR5X1N0cnVjdCgpO1xuICAgICAgICBzd2l0Y2ggKHByb3BfdHlwZSkge1xuICAgICAgICAgICAgY2FzZSBcImZsb2F0XCI6XG4gICAgICAgICAgICAgICAgcHJvcGVydHlfc3RydWN0LnByb3BlcnR5X3R5cGUgPSBQcm9wZXJ0eV9UeXBlLlByb3BlcnR5X0Zsb2F0O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcImludFwiOlxuICAgICAgICAgICAgICAgIHByb3BlcnR5X3N0cnVjdC5wcm9wZXJ0eV90eXBlID0gUHJvcGVydHlfVHlwZS5Qcm9wZXJ0eV9JbnQ7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiYm9vbFwiOlxuICAgICAgICAgICAgICAgIHByb3BlcnR5X3N0cnVjdC5wcm9wZXJ0eV90eXBlID0gUHJvcGVydHlfVHlwZS5Qcm9wZXJ0eV9Cb29sO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIHByb3AgdHlwZSAke3Byb3BfdHlwZX1gKTtcbiAgICAgICAgfVxuICAgICAgICB0YWdfc3BsaXQuc2hpZnQoKTtcbiAgICAgICAgd2hpbGUgKHRhZ19zcGxpdC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjb25zdCBbbGVmdCwgcmlnaHRdID0gdGFnX3Byb3BfdG9fcGFydHModGFnX3NwbGl0WzBdKTtcbiAgICAgICAgICAgIHRhZ19zcGxpdC5zaGlmdCgpO1xuICAgICAgICAgICAgc3dpdGNoIChsZWZ0KSB7XG4gICAgICAgICAgICAgICAgY2FzZSBcIlJhbmdlXCI6XG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAocHJvcGVydHlfc3RydWN0LnByb3BlcnR5X3R5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgUHJvcGVydHlfVHlwZS5Qcm9wZXJ0eV9GbG9hdDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IFttaW5fcywgbWF4X3NdID0gcmlnaHQuc3BsaXQoXCI7XCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5X3N0cnVjdC5mbG9hdF9yYW5nZV9taW4gPSBwYXJzZUZsb2F0KG1pbl9zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eV9zdHJ1Y3QuZmxvYXRfcmFuZ2VfbWF4ID0gcGFyc2VGbG9hdChtYXhfcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFByb3BlcnR5X1R5cGUuUHJvcGVydHlfSW50OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgW21pbl9zLCBtYXhfc10gPSByaWdodC5zcGxpdChcIjtcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlfc3RydWN0LmludF9yYW5nZV9taW4gPSBwYXJzZUludChtaW5fcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlfc3RydWN0LmludF9yYW5nZV9tYXggPSBwYXJzZUludChtYXhfcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFByb3BlcnR5X1R5cGUuUHJvcGVydHlfQm9vbDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkJvb2xlYW4gZG9zZSBub3QgaGF2ZSBhIHJhbmdlIVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvcihgVW5rbm93biB0eXBlIGluICR7bmFtZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiRGVmYXVsdFwiOlxuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHByb3BlcnR5X3N0cnVjdC5wcm9wZXJ0eV90eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFByb3BlcnR5X1R5cGUuUHJvcGVydHlfRmxvYXQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlfc3RydWN0LmZsb2F0X2RlZmF1bHQgPSBwYXJzZUZsb2F0KHJpZ2h0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgUHJvcGVydHlfVHlwZS5Qcm9wZXJ0eV9JbnQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlfc3RydWN0LmludF9kZWZhdWx0ID0gcGFyc2VJbnQocmlnaHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBQcm9wZXJ0eV9UeXBlLlByb3BlcnR5X0Jvb2w6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlfc3RydWN0LmJvb2xfZGVmYXVsdCA9IHBhcnNlQm9vbChyaWdodCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gdHlwZSBpbiAke25hbWV9YCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIHByb3BlcnR5ICR7bGVmdH1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBUT0RPIHNvbWUgd2F5IHRvIHByaW50IGFuIG9iamVjdC5cbiAgICAgICAgLy8gbG9nKExvZ19UeXBlLkRlYnVnX1NsaWRlcnMsIGBwcm9wZXJ0eSBzdHJ1Y3QgJHtwcm9wZXJ0eV9zdHJ1Y3R9YCk7XG4gICAgICAgIHN3aXRjaCAocHJvcGVydHlfc3RydWN0LnByb3BlcnR5X3R5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgUHJvcGVydHlfVHlwZS5Qcm9wZXJ0eV9GbG9hdDpcbiAgICAgICAgICAgICAgICBtYWtlX2Zsb2F0X3NsaWRlcihzbGlkZXJfY29udGFpbmVyLCBuYW1lLCBwcm9wZXJ0eV9zdHJ1Y3QsIHNldF9wcm9wZXJ0eSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFByb3BlcnR5X1R5cGUuUHJvcGVydHlfSW50OlxuICAgICAgICAgICAgICAgIG1ha2VfaW50X3NsaWRlcihzbGlkZXJfY29udGFpbmVyLCBuYW1lLCBwcm9wZXJ0eV9zdHJ1Y3QsIHNldF9wcm9wZXJ0eSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFByb3BlcnR5X1R5cGUuUHJvcGVydHlfQm9vbDpcbiAgICAgICAgICAgICAgICBtYWtlX2Jvb2xfc2xpZGVyKHNsaWRlcl9jb250YWluZXIsIG5hbWUsIHByb3BlcnR5X3N0cnVjdCwgc2V0X3Byb3BlcnR5KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvcihgVW5rbm93biBwcm9wZXJ0eSB0eXBlICR7cHJvcGVydHlfc3RydWN0LnByb3BlcnR5X3R5cGV9YCk7XG4gICAgICAgIH1cbiAgICB9XG59XG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gICAgICAgICBNYWtlIGEgc2xpZGVyIGZvciBhbiBmbG9hdFxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbmZ1bmN0aW9uIG1ha2VfZmxvYXRfc2xpZGVyKHNsaWRlcl9jb250YWluZXIsIG5hbWUsIHByb3BlcnR5X3N0cnVjdCwgc2V0X3Byb3BlcnR5KSB7XG4gICAgY29uc3QgaWQgPSBgc2xpZGVyXyR7bmFtZX1gO1xuICAgIGNvbnN0IHBhcmFfaWQgPSBgJHtpZH1fcGFyYWdyYXBoYDtcbiAgICBjb25zdCBwYXJhZ3JhcGhfdGV4dCA9IGAke25hbWUucmVwbGFjZSgvXy9nLCBcIiBcIil9YDtcbiAgICBjb25zdCBodG1sX3N0cmluZyA9IGBcbiAgICAgICAgPHAgY2xhc3M9XCJzbGlkZXJLZXlcIiBpZD1cIiR7cGFyYV9pZH1cIj5cbiAgICAgICAgICAgICR7cGFyYWdyYXBoX3RleHR9OiAke3Byb3BlcnR5X3N0cnVjdC5mbG9hdF9kZWZhdWx0fVxuICAgICAgICA8L3A+XG4gICAgICAgIDxpbnB1dCB0eXBlPVwicmFuZ2VcIiBtaW49XCIke3Byb3BlcnR5X3N0cnVjdC5mbG9hdF9yYW5nZV9taW59XCIgbWF4PVwiJHtwcm9wZXJ0eV9zdHJ1Y3QuZmxvYXRfcmFuZ2VfbWF4fVwiIHZhbHVlPVwiJHtwcm9wZXJ0eV9zdHJ1Y3QuZmxvYXRfZGVmYXVsdH1cIiBzdGVwPVwiMC4wMDVcIiBjbGFzcz1cInNsaWRlclwiIGlkPVwiJHtpZH1cIj5cbiAgICAgICAgYDtcbiAgICBjb25zdCBuZXdfdGhpbmcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIG5ld190aGluZy5jbGFzc05hbWUgPSBcInJhbmdlSG9sZGVyXCI7XG4gICAgbmV3X3RoaW5nLmlubmVySFRNTCA9IGh0bWxfc3RyaW5nO1xuICAgIHNsaWRlcl9jb250YWluZXIuYXBwZW5kQ2hpbGQobmV3X3RoaW5nKTtcbiAgICBjb25zdCBzbGlkZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG4gICAgaWYgKHNsaWRlciA9PT0gbnVsbClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ291bGQgbm90IGZpbmQgdGhlIHNsaWRlclwiKTtcbiAgICBzbGlkZXIuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsIChldmVudCkgPT4ge1xuICAgICAgICBjb25zdCBzbGlkZXJfdmFsdWVfc3RyaW5nID0gZXZlbnQudGFyZ2V0LnZhbHVlO1xuICAgICAgICBjb25zdCBzbGlkZXJfbnVtYmVyID0gTnVtYmVyKHNsaWRlcl92YWx1ZV9zdHJpbmcpO1xuICAgICAgICBjb25zdCBzbGlkZXJfdGV4dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHBhcmFfaWQpO1xuICAgICAgICBpZiAoc2xpZGVyX3RleHQgPT09IG51bGwpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGNvdWxkIG5vdCBmaW5kIHNsaWRlcl90ZXh0ICR7cGFyYV9pZH1gKTtcbiAgICAgICAgc2xpZGVyX3RleHQudGV4dENvbnRlbnQgPSBgJHtwYXJhZ3JhcGhfdGV4dH06ICR7c2xpZGVyX251bWJlcn1gO1xuICAgICAgICBzZXRfcHJvcGVydHkobmFtZSwgc2xpZGVyX251bWJlcik7XG4gICAgfSk7XG59XG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gICAgICAgICAgTWFrZSBhIHNsaWRlciBmb3IgYW4gaW50XG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuZnVuY3Rpb24gbWFrZV9pbnRfc2xpZGVyKHNsaWRlcl9jb250YWluZXIsIG5hbWUsIHByb3BlcnR5X3N0cnVjdCwgc2V0X3Byb3BlcnR5KSB7XG4gICAgY29uc3QgaWQgPSBgc2xpZGVyXyR7bmFtZX1gO1xuICAgIGNvbnN0IHBhcmFfaWQgPSBgJHtpZH1fcGFyYWdyYXBoYDtcbiAgICBjb25zdCBwYXJhZ3JhcGhfdGV4dCA9IGAke25hbWUucmVwbGFjZSgvXy9nLCBcIiBcIil9YDtcbiAgICBjb25zdCBodG1sX3N0cmluZyA9IGBcbiAgICAgICAgPHAgY2xhc3M9XCJzbGlkZXJLZXlcIiBpZD1cIiR7cGFyYV9pZH1cIj5cbiAgICAgICAgICAgICR7cGFyYWdyYXBoX3RleHR9OiAke3Byb3BlcnR5X3N0cnVjdC5pbnRfZGVmYXVsdH1cbiAgICAgICAgPC9wPlxuICAgICAgICA8aW5wdXQgdHlwZT1cInJhbmdlXCIgbWluPVwiJHtwcm9wZXJ0eV9zdHJ1Y3QuaW50X3JhbmdlX21pbn1cIiBtYXg9XCIke3Byb3BlcnR5X3N0cnVjdC5pbnRfcmFuZ2VfbWF4fVwiIHZhbHVlPVwiJHtwcm9wZXJ0eV9zdHJ1Y3QuaW50X2RlZmF1bHR9XCIgY2xhc3M9XCJzbGlkZXJcIiBpZD1cIiR7aWR9XCI+XG4gICAgICAgIGA7XG4gICAgY29uc3QgbmV3X3RoaW5nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICBuZXdfdGhpbmcuY2xhc3NOYW1lID0gXCJyYW5nZUhvbGRlclwiO1xuICAgIG5ld190aGluZy5pbm5lckhUTUwgPSBodG1sX3N0cmluZztcbiAgICBzbGlkZXJfY29udGFpbmVyLmFwcGVuZENoaWxkKG5ld190aGluZyk7XG4gICAgY29uc3Qgc2xpZGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICAgIGlmIChzbGlkZXIgPT09IG51bGwpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvdWxkIG5vdCBmaW5kIHRoZSBzbGlkZXJcIik7XG4gICAgc2xpZGVyLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgY29uc3Qgc2xpZGVyX3ZhbHVlX3N0cmluZyA9IGV2ZW50LnRhcmdldC52YWx1ZTtcbiAgICAgICAgY29uc3Qgc2xpZGVyX251bWJlciA9IE51bWJlcihzbGlkZXJfdmFsdWVfc3RyaW5nKTtcbiAgICAgICAgY29uc3Qgc2xpZGVyX3RleHQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChwYXJhX2lkKTtcbiAgICAgICAgaWYgKHNsaWRlcl90ZXh0ID09PSBudWxsKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBjb3VsZCBub3QgZmluZCBzbGlkZXJfdGV4dCAke3BhcmFfaWR9YCk7XG4gICAgICAgIHNsaWRlcl90ZXh0LnRleHRDb250ZW50ID0gYCR7cGFyYWdyYXBoX3RleHR9OiAke3NsaWRlcl9udW1iZXJ9YDtcbiAgICAgICAgc2V0X3Byb3BlcnR5KG5hbWUsIHNsaWRlcl9udW1iZXIpO1xuICAgIH0pO1xufVxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vICAgICBNYWtlIGEgc2xpZGVyIGZvciBhbiBib29sZWFuIHRvZ2dsZVxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbmZ1bmN0aW9uIG1ha2VfYm9vbF9zbGlkZXIoc2xpZGVyX2NvbnRhaW5lciwgbmFtZSwgcHJvcGVydHlfc3RydWN0LCBzZXRfcHJvcGVydHkpIHtcbiAgICBjb25zdCBpZCA9IGBzbGlkZXJfJHtuYW1lfWA7XG4gICAgY29uc3QgcGFyYWdyYXBoX3RleHQgPSBgJHtuYW1lLnJlcGxhY2UoL18vZywgXCIgXCIpfWA7XG4gICAgY29uc3QgaHRtbF9zdHJpbmcgPSBgXG4gICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiAke3Byb3BlcnR5X3N0cnVjdC5ib29sX2RlZmF1bHQgPyBcImNoZWNrZWRcIiA6IFwiXCJ9IGNsYXNzPVwiY2hlY2tib3hfdG9nZ2xlXCIgaWQ9XCIke2lkfVwiPlxuICAgICAgICA8bGFiZWwgZm9yPVwiJHtpZH1cIiBjbGFzcz1cImNoZWNrYm94X3RvZ2dsZV9sYWJlbFwiPiR7cGFyYWdyYXBoX3RleHR9PC9sYWJlbD5cbiAgICAgICAgYDtcbiAgICBjb25zdCBuZXdfdGhpbmcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIG5ld190aGluZy5jbGFzc05hbWUgPSBcInJhbmdlSG9sZGVyXCI7XG4gICAgbmV3X3RoaW5nLmlubmVySFRNTCA9IGh0bWxfc3RyaW5nO1xuICAgIHNsaWRlcl9jb250YWluZXIuYXBwZW5kQ2hpbGQobmV3X3RoaW5nKTtcbiAgICBjb25zdCBzbGlkZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG4gICAgaWYgKHNsaWRlciA9PT0gbnVsbClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ291bGQgbm90IGZpbmQgdGhlIHNsaWRlclwiKTtcbiAgICBzbGlkZXIuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsIChldmVudCkgPT4ge1xuICAgICAgICBjb25zdCBjaGVja2VkID0gZXZlbnQudGFyZ2V0LmNoZWNrZWQ7XG4gICAgICAgIHNldF9wcm9wZXJ0eShuYW1lLCBjaGVja2VkKTtcbiAgICB9KTtcbn1cbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCJcInVzZSBzdHJpY3RcIjtcbi8vIHR5cGVzY3JpcHQgZ2x1ZSBjb2RlLlxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuY29uc3QgbG9nZ2VyXzEgPSByZXF1aXJlKFwiLi9sb2dnZXJcIik7XG5jb25zdCBzZXR1cF9zbGlkZXJzXzEgPSByZXF1aXJlKFwiLi9zZXR1cF9zbGlkZXJzXCIpO1xuLy8gTk9URSB3ZSBrZWVwIHRoZSBAdHMtaWdub3JlJ3MgaW4gaGVyZVxuYXN5bmMgZnVuY3Rpb24gR2V0R29GdW5jdGlvbnMoKSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGNvbnN0IGdvID0gbmV3IEdvKCk7IC8vIE5PVEUgdGhpcyBjb21lcyBmcm9tIHRoZSB3YXNtX2V4ZWMuanMgdGhpbmdcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBXZWJBc3NlbWJseS5pbnN0YW50aWF0ZVN0cmVhbWluZyhmZXRjaChcImRpc3QvYm9pZC53YXNtXCIpLCBnby5pbXBvcnRPYmplY3QpO1xuICAgIGdvLnJ1bihyZXN1bHQuaW5zdGFuY2UpO1xuICAgIHJldHVybiB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgU2V0UHJvcGVydGllczogU2V0UHJvcGVydGllcyxcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBHZXRQcm9wZXJ0aWVzOiBHZXRQcm9wZXJ0aWVzLFxuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIEdldE5leHRGcmFtZTogR2V0TmV4dEZyYW1lLFxuICAgIH07XG59XG5jb25zdCBOVU1fQ09MT1JfQ09NUE9ORU5UUyA9IDQ7XG5jb25zdCBTUVVJU0hfRkFDVE9SID0gMTtcbjtcbjtcbmNvbnN0IG1vdXNlID0ge1xuICAgIHBvczogeyB4OiAwLCB5OiAwIH0sXG4gICAgbGVmdF9kb3duOiBmYWxzZSxcbiAgICBtaWRkbGVfZG93bjogZmFsc2UsXG4gICAgcmlnaHRfZG93bjogZmFsc2UsXG59O1xuZnVuY3Rpb24gcmVuZGVyQm9pZHMoZGlzcGxheSwgZ28pIHtcbiAgICBjb25zdCB3aWR0aCA9IE1hdGguZmxvb3IoZGlzcGxheS5jdHguY2FudmFzLndpZHRoIC8gU1FVSVNIX0ZBQ1RPUik7XG4gICAgY29uc3QgaGVpZ2h0ID0gTWF0aC5mbG9vcihkaXNwbGF5LmN0eC5jYW52YXMuaGVpZ2h0IC8gU1FVSVNIX0ZBQ1RPUik7XG4gICAgY29uc3QgYnVmZmVyX3NpemUgPSB3aWR0aCAqIGhlaWdodCAqIE5VTV9DT0xPUl9DT01QT05FTlRTO1xuICAgIGlmIChkaXNwbGF5LmJhY2tJbWFnZVdpZHRoICE9PSB3aWR0aCB8fCBkaXNwbGF5LmJhY2tJbWFnZUhlaWdodCAhPT0gaGVpZ2h0KSB7XG4gICAgICAgICgwLCBsb2dnZXJfMS5sb2cpKGxvZ2dlcl8xLkxvZ19UeXBlLkdlbmVyYWwsIFwiT2ggZ29kLiB3ZXJlIHJlc2l6aW5nIHRoZSBidWZmZXJcIik7XG4gICAgICAgIGlmIChkaXNwbGF5LmJhY2tCdWZmZXJBcnJheS5sZW5ndGggPCBidWZmZXJfc2l6ZSkge1xuICAgICAgICAgICAgKDAsIGxvZ2dlcl8xLmxvZykobG9nZ2VyXzEuTG9nX1R5cGUuR2VuZXJhbCwgXCJJdHMgZ2V0dGluZyBiaWdnZXJcIik7IC8vIG15IHBlbmlzXG4gICAgICAgICAgICAvLyBtYWtlIHRoZSBidWZmZXIgYmlnZ2VyXG4gICAgICAgICAgICBkaXNwbGF5LmJhY2tCdWZmZXJBcnJheSA9IG5ldyBVaW50OENsYW1wZWRBcnJheShidWZmZXJfc2l6ZSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYmFja0NhbnZhcyA9IG5ldyBPZmZzY3JlZW5DYW52YXMod2lkdGgsIGhlaWdodCk7XG4gICAgICAgIGNvbnN0IGJhY2tDdHggPSBiYWNrQ2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcbiAgICAgICAgaWYgKGJhY2tDdHggPT09IG51bGwpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCIyRCBjb250ZXh0IGlzIG5vdCBzdXBwb3J0ZWRcIik7XG4gICAgICAgIGRpc3BsYXkuYmFja0N0eCA9IGJhY2tDdHg7XG4gICAgICAgIGRpc3BsYXkuYmFja0N0eC5pbWFnZVNtb290aGluZ0VuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgZGlzcGxheS5iYWNrSW1hZ2VXaWR0aCA9IHdpZHRoO1xuICAgICAgICBkaXNwbGF5LmJhY2tJbWFnZUhlaWdodCA9IGhlaWdodDtcbiAgICB9XG4gICAgY29uc3QgYnVmZmVyID0gZGlzcGxheS5iYWNrQnVmZmVyQXJyYXkuc3ViYXJyYXkoMCwgYnVmZmVyX3NpemUpO1xuICAgIGNvbnN0IGFyZ3MgPSB7XG4gICAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgICAgIGJ1ZmZlcjogYnVmZmVyLFxuICAgICAgICBtb3VzZTogbW91c2UsXG4gICAgfTtcbiAgICBjb25zdCBudW1GaWxsZWQgPSBnby5HZXROZXh0RnJhbWUoYXJncyk7XG4gICAgaWYgKG51bUZpbGxlZCAhPT0gYnVmZmVyX3NpemUpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgR2V0TmV4dEZyYW1lIGdvdCAke251bUZpbGxlZH1gKTtcbiAgICAvLyBAdHMtaWdub3JlIC8vIHdoeSBkb3NlIHRoaXMgbGluZSBtYWtlIGFuIGVycm9yIGluIG15IGVkaXRvclxuICAgIGNvbnN0IGltYWdlRGF0YSA9IG5ldyBJbWFnZURhdGEoYnVmZmVyLCB3aWR0aCwgaGVpZ2h0KTtcbiAgICAvLyBpcyB0aGlzIGNvb2w/XG4gICAgZGlzcGxheS5iYWNrQ3R4LnB1dEltYWdlRGF0YShpbWFnZURhdGEsIDAsIDApO1xuICAgIC8vIE5PVEUgdGhpcyB3aWxsIHN0cmV0Y2ggdGhlIHRoaW5nLlxuICAgIC8vIGNhbnZhcy53aWR0aCBtaWdodCBjaGFuZ2UgZHVyaW5nIHRoZSB0aW1lIHRoaXMgaXMgcnVubmluZ1xuICAgIGRpc3BsYXkuY3R4LmRyYXdJbWFnZShkaXNwbGF5LmJhY2tDdHguY2FudmFzLCAwLCAwLCBkaXNwbGF5LmN0eC5jYW52YXMud2lkdGgsIGRpc3BsYXkuY3R4LmNhbnZhcy5oZWlnaHQpO1xuICAgIC8vIGltYWdlRGF0YSA9IG51bGxcbn1cbmNvbnN0IHJlbmRlclRpbWVzID0gW107XG5jb25zdCBkZWx0YVRpbWVzID0gW107XG4vLyBDcmVkaXQ6IGh0dHBzOi8vZ2l0aHViLmNvbS90c29kaW5nL2tvaWxcbmZ1bmN0aW9uIHJlbmRlckRlYnVnSW5mbyhkaXNwbGF5LCByZW5kZXJUaW1lLCBkZWx0YVRpbWUpIHtcbiAgICBjb25zdCBmb250U2l6ZSA9IDI4O1xuICAgIGRpc3BsYXkuY3R4LmZvbnQgPSBgJHtmb250U2l6ZX1weCBib2xkYDtcbiAgICBjb25zdCBsYWJlbHMgPSBbXTtcbiAgICByZW5kZXJUaW1lcy5wdXNoKHJlbmRlclRpbWUpO1xuICAgIGlmIChyZW5kZXJUaW1lcy5sZW5ndGggPiA2MCkge1xuICAgICAgICByZW5kZXJUaW1lcy5zaGlmdCgpO1xuICAgIH1cbiAgICBkZWx0YVRpbWVzLnB1c2goZGVsdGFUaW1lKTtcbiAgICBpZiAoZGVsdGFUaW1lcy5sZW5ndGggPiA2MCkge1xuICAgICAgICBkZWx0YVRpbWVzLnNoaWZ0KCk7XG4gICAgfVxuICAgIGNvbnN0IHJlbmRlckF2ZyA9IHJlbmRlclRpbWVzLnJlZHVjZSgoYSwgYikgPT4gYSArIGIsIDApIC8gcmVuZGVyVGltZXMubGVuZ3RoO1xuICAgIGNvbnN0IGRlbHRhQXZnID0gZGVsdGFUaW1lcy5yZWR1Y2UoKGEsIGIpID0+IGEgKyBiLCAwKSAvIGRlbHRhVGltZXMubGVuZ3RoO1xuICAgIGxhYmVscy5wdXNoKGBGUFM6ICR7KDEgLyBkZWx0YUF2ZyAqIDEwMDApLnRvRml4ZWQoMil9YCk7XG4gICAgbGFiZWxzLnB1c2goYG1zIHBlciBmcmFtZTogJHtkZWx0YUF2Zy50b0ZpeGVkKDIpfWApO1xuICAgIGxhYmVscy5wdXNoKGBSZW5kZXIgVGltZSBBdmcgKG1zKTogJHtyZW5kZXJBdmcudG9GaXhlZCgyKX1gKTtcbiAgICBsYWJlbHMucHVzaChgUmVuZGVyL1NlYyAoTUFYKTogJHsoMSAvIHJlbmRlckF2ZyAqIDEwMDApLnRvRml4ZWQoMil9YCk7XG4gICAgY29uc3QgcGFkZGluZyA9IDcwO1xuICAgIGNvbnN0IHNoYWRvd09mZnNldCA9IGZvbnRTaXplICogMC4wNjtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxhYmVscy5sZW5ndGg7IGkrKykge1xuICAgICAgICBkaXNwbGF5LmN0eC5maWxsU3R5bGUgPSBcImJsYWNrXCI7XG4gICAgICAgIGRpc3BsYXkuY3R4LmZpbGxUZXh0KGxhYmVsc1tpXSwgcGFkZGluZywgcGFkZGluZyArIGZvbnRTaXplICogaSk7XG4gICAgICAgIGRpc3BsYXkuY3R4LmZpbGxTdHlsZSA9IFwid2hpdGVcIjtcbiAgICAgICAgZGlzcGxheS5jdHguZmlsbFRleHQobGFiZWxzW2ldLCBwYWRkaW5nICsgc2hhZG93T2Zmc2V0LCBwYWRkaW5nIC0gc2hhZG93T2Zmc2V0ICsgZm9udFNpemUgKiBpKTtcbiAgICB9XG59XG4oYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IGdvID0gYXdhaXQgR2V0R29GdW5jdGlvbnMoKTtcbiAgICB7IC8vIEhhbmRsZSBzbGlkZXIgc3R1ZmZcbiAgICAgICAgY29uc3QgcHJvcGVydGllcyA9IE9iamVjdC5lbnRyaWVzKGdvLkdldFByb3BlcnRpZXMoKSk7XG4gICAgICAgIGZ1bmN0aW9uIHNldF9wcm9wZXJ0eShuYW1lLCB2YWx1ZSkge1xuICAgICAgICAgICAgLy8gaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTI3MTA5MDUvaG93LWRvLWktZHluYW1pY2FsbHktYXNzaWduLXByb3BlcnRpZXMtdG8tYW4tb2JqZWN0LWluLXR5cGVzY3JpcHRcbiAgICAgICAgICAgIGNvbnN0IG9iaiA9IHt9O1xuICAgICAgICAgICAgb2JqW25hbWVdID0gdmFsdWU7XG4gICAgICAgICAgICBnby5TZXRQcm9wZXJ0aWVzKG9iaik7XG4gICAgICAgIH1cbiAgICAgICAgKDAsIHNldHVwX3NsaWRlcnNfMS5zZXR1cF9zbGlkZXJzKShwcm9wZXJ0aWVzLCBzZXRfcHJvcGVydHkpO1xuICAgIH1cbiAgICAvLyBjb25zdCBjYW52YXNfY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjYW52YXNfZGl2XCIpIGFzIEhUTUxDYW52YXNFbGVtZW50IHwgbnVsbFxuICAgIGNvbnN0IGJvaWRDYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJvaWRfY2FudmFzXCIpO1xuICAgIGlmIChib2lkQ2FudmFzID09PSBudWxsKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyBjYW52YXMgd2l0aCBpZCBgYm9pZF9jYW52YXNgIGlzIGZvdW5kXCIpO1xuICAgIC8vIHdoeSBkb2Vzbid0IHR5cGVzY3JpcHQgaGF2ZSBhbiBlbnVtIGZvciB0aGlzP1xuICAgIGxldCBtb3VzZV9idXR0b25zO1xuICAgIChmdW5jdGlvbiAobW91c2VfYnV0dG9ucykge1xuICAgICAgICBtb3VzZV9idXR0b25zW21vdXNlX2J1dHRvbnNbXCJNT1VTRV9MRUZUXCJdID0gMF0gPSBcIk1PVVNFX0xFRlRcIjtcbiAgICAgICAgbW91c2VfYnV0dG9uc1ttb3VzZV9idXR0b25zW1wiTU9VU0VfTUlERExFXCJdID0gMV0gPSBcIk1PVVNFX01JRERMRVwiO1xuICAgICAgICBtb3VzZV9idXR0b25zW21vdXNlX2J1dHRvbnNbXCJNT1VTRV9SSUdIVFwiXSA9IDJdID0gXCJNT1VTRV9SSUdIVFwiO1xuICAgIH0pKG1vdXNlX2J1dHRvbnMgfHwgKG1vdXNlX2J1dHRvbnMgPSB7fSkpO1xuICAgIGNvbnN0IHJvb3QgPSBkb2N1bWVudC5nZXRSb290Tm9kZSgpO1xuICAgIC8vIE5PVEUgc2hvdWxkIHRoaXMgYmUgb24gdGhlIGNhbnZhcyBvciBvbiB0aGUgcm9vdD9cbiAgICByb290LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIChldikgPT4geyBtb3VzZS5wb3MgPSB7IHg6IGV2LngsIHk6IGV2LnkgfTsgfSk7XG4gICAgLy8gdGhpcyB3aWxsIGJyZWFrIGlmIHRoZSB1c2VyIHNsaWRlcyB0aGVyZSBtb3VzZSBvdXRzaWRlIG9mIHRoZSBzY3JlZW4gd2hpbGUgY2xpY2tpbmcsIGJ1dCB0aGlzIGlzIHRoZSB3ZWIsIHBlb3BsZSBleHBlY3QgaXQgdG8gc3Vjay5cbiAgICByb290LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIChldikgPT4ge1xuICAgICAgICBpZiAoZXYuYnV0dG9uID09IG1vdXNlX2J1dHRvbnMuTU9VU0VfTEVGVClcbiAgICAgICAgICAgIG1vdXNlLmxlZnRfZG93biA9IHRydWU7XG4gICAgICAgIGlmIChldi5idXR0b24gPT0gbW91c2VfYnV0dG9ucy5NT1VTRV9NSURETEUpXG4gICAgICAgICAgICBtb3VzZS5taWRkbGVfZG93biA9IHRydWU7XG4gICAgICAgIGlmIChldi5idXR0b24gPT0gbW91c2VfYnV0dG9ucy5NT1VTRV9SSUdIVClcbiAgICAgICAgICAgIG1vdXNlLnJpZ2h0X2Rvd24gPSB0cnVlO1xuICAgIH0pO1xuICAgIHJvb3QuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIChldikgPT4ge1xuICAgICAgICBpZiAoZXYuYnV0dG9uID09IG1vdXNlX2J1dHRvbnMuTU9VU0VfTEVGVClcbiAgICAgICAgICAgIG1vdXNlLmxlZnRfZG93biA9IGZhbHNlO1xuICAgICAgICBpZiAoZXYuYnV0dG9uID09IG1vdXNlX2J1dHRvbnMuTU9VU0VfTUlERExFKVxuICAgICAgICAgICAgbW91c2UubWlkZGxlX2Rvd24gPSBmYWxzZTtcbiAgICAgICAgaWYgKGV2LmJ1dHRvbiA9PSBtb3VzZV9idXR0b25zLk1PVVNFX1JJR0hUKVxuICAgICAgICAgICAgbW91c2UucmlnaHRfZG93biA9IGZhbHNlO1xuICAgIH0pO1xuICAgIGNvbnN0IGN0eCA9IGJvaWRDYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpO1xuICAgIGlmIChjdHggPT09IG51bGwpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIjJEIGNvbnRleHQgaXMgbm90IHN1cHBvcnRlZFwiKTtcbiAgICBjdHguaW1hZ2VTbW9vdGhpbmdFbmFibGVkID0gZmFsc2U7XG4gICAgY29uc3QgW2JhY2tJbWFnZVdpZHRoLCBiYWNrSW1hZ2VIZWlnaHRdID0gW2N0eC5jYW52YXMud2lkdGgsIGN0eC5jYW52YXMuaGVpZ2h0XTtcbiAgICBjb25zdCBiYWNrQ2FudmFzID0gbmV3IE9mZnNjcmVlbkNhbnZhcyhiYWNrSW1hZ2VXaWR0aCwgYmFja0ltYWdlSGVpZ2h0KTtcbiAgICBjb25zdCBiYWNrQ3R4ID0gYmFja0NhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XG4gICAgaWYgKGJhY2tDdHggPT09IG51bGwpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIjJEIGNvbnRleHQgaXMgbm90IHN1cHBvcnRlZFwiKTtcbiAgICBiYWNrQ3R4LmltYWdlU21vb3RoaW5nRW5hYmxlZCA9IGZhbHNlO1xuICAgIGNvbnN0IGJhY2tCdWZmZXJBcnJheSA9IG5ldyBVaW50OENsYW1wZWRBcnJheShiYWNrSW1hZ2VXaWR0aCAqIGJhY2tJbWFnZUhlaWdodCAqIDQpO1xuICAgIGNvbnN0IGRpc3BsYXkgPSB7XG4gICAgICAgIGN0eCxcbiAgICAgICAgYmFja0N0eCxcbiAgICAgICAgYmFja0J1ZmZlckFycmF5LFxuICAgICAgICBiYWNrSW1hZ2VXaWR0aCxcbiAgICAgICAgYmFja0ltYWdlSGVpZ2h0LFxuICAgIH07XG4gICAgbGV0IHByZXZUaW1lc3RhbXAgPSAwO1xuICAgIGNvbnN0IGZyYW1lID0gKHRpbWVzdGFtcCkgPT4ge1xuICAgICAgICBjdHguY2FudmFzLndpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XG4gICAgICAgIGN0eC5jYW52YXMuaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xuICAgICAgICBjb25zdCBkZWx0YVRpbWUgPSAodGltZXN0YW1wIC0gcHJldlRpbWVzdGFtcCk7XG4gICAgICAgIHByZXZUaW1lc3RhbXAgPSB0aW1lc3RhbXA7XG4gICAgICAgIC8vIFRPRE8gRG9uJ3QgbmVlZCBkZWx0YSB0aW1lLCBib2lkIHRoaW5nIGRvc2UgaXQgZm9yIHVzPyBjaGFuZ2U/XG4gICAgICAgIGNvbnN0IHN0YXJ0VGltZSA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgICAgICByZW5kZXJCb2lkcyhkaXNwbGF5LCBnbyk7XG4gICAgICAgIGNvbnN0IGVuZFRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKTtcbiAgICAgICAgLy8gSW4gbXNcbiAgICAgICAgY29uc3QgcmVuZGVyVGltZSA9IGVuZFRpbWUgLSBzdGFydFRpbWU7XG4gICAgICAgIGlmIChsb2dnZXJfMS5ERUJVR19ESVNQTEFZKVxuICAgICAgICAgICAgcmVuZGVyRGVidWdJbmZvKGRpc3BsYXksIHJlbmRlclRpbWUsIGRlbHRhVGltZSk7XG4gICAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnJhbWUpO1xuICAgIH07XG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSgodGltZXN0YW1wKSA9PiB7XG4gICAgICAgIHByZXZUaW1lc3RhbXAgPSB0aW1lc3RhbXA7XG4gICAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnJhbWUpO1xuICAgIH0pO1xufSkoKTtcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==
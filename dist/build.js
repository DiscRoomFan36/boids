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
    const initial_value = property_struct.float_default;
    const initial_value_for_text = initial_value.toPrecision(2);
    const map_range_to_slider_number = (x) => {
        const min = property_struct.float_range_min;
        const max = property_struct.float_range_max;
        return (x - min) / (max - min) * (1000 - 0) + 0;
    };
    const map_range_to_real_range = (x) => {
        const min = property_struct.float_range_min;
        const max = property_struct.float_range_max;
        // TODO toPrecision might not be the best function for formatting. margin is being messed with (1.0e+2)
        // make it the proper value // TODO is this correct? even for small values?
        return parseFloat(((x - 0) / (1000 - 0) * (max - min) + min).toPrecision(2));
    };
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
    const slider = document.getElementById(id);
    if (slider === null)
        throw new Error("Could not find the slider");
    slider.addEventListener("input", (event) => {
        const slider_value_string = event.target.value;
        const slider_number = map_range_to_real_range(Number(slider_value_string));
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
function renderBoids(display, go) {
    const width = Math.floor(display.ctx.canvas.width / SQUISH_FACTOR);
    const height = Math.floor(display.ctx.canvas.height / SQUISH_FACTOR);
    const buffer_size = width * height * NUM_COLOR_COMPONENTS;
    if (display.backImageWidth !== width || display.backImageHeight !== height) {
        (0, logger_1.log)(logger_1.Log_Type.General, "Oh god. were resizing the buffer");
        if (display.backBufferArray.length < buffer_size) {
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
    const numFilled = go.GetNextFrame(width, height, buffer);
    if (numFilled !== buffer_size)
        throw new Error(`GetNextFrame got ${numFilled}`);
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
    const boidCanvas = document.getElementById("boid_canvas");
    if (boidCanvas === null)
        throw new Error("No canvas with id `boid_canvas` is found");
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0IsaUNBQWlDO0FBQ3pELGlDQUFpQyxvQkFBb0I7QUFDckQseUNBQXlDLHFCQUFxQjtBQUM5RCxxQ0FBcUMsa0NBQWtDO0FBQ3ZFO0FBQ0E7QUFDQSxvQkFBb0IsbUJBQW1CO0FBQ3ZDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsQ0FBQyIsInNvdXJjZXMiOlsid2VicGFjazovL2JvaWRzLy4vd2ViX3NyYy9sb2dnZXIudHMiLCJ3ZWJwYWNrOi8vYm9pZHMvLi93ZWJfc3JjL3NldHVwX3NsaWRlcnMudHMiLCJ3ZWJwYWNrOi8vYm9pZHMvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vYm9pZHMvLi93ZWJfc3JjL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5Mb2dfVHlwZSA9IGV4cG9ydHMuREVCVUdfU0xJREVSUyA9IGV4cG9ydHMuREVCVUdfRElTUExBWSA9IHZvaWQgMDtcbmV4cG9ydHMubG9nID0gbG9nO1xuZXhwb3J0cy5ERUJVR19ESVNQTEFZID0gdHJ1ZTtcbmV4cG9ydHMuREVCVUdfU0xJREVSUyA9IGZhbHNlO1xudmFyIExvZ19UeXBlO1xuKGZ1bmN0aW9uIChMb2dfVHlwZSkge1xuICAgIExvZ19UeXBlW0xvZ19UeXBlW1wiR2VuZXJhbFwiXSA9IDBdID0gXCJHZW5lcmFsXCI7XG4gICAgTG9nX1R5cGVbTG9nX1R5cGVbXCJEZWJ1Z19EaXNwbGF5XCJdID0gMV0gPSBcIkRlYnVnX0Rpc3BsYXlcIjtcbiAgICBMb2dfVHlwZVtMb2dfVHlwZVtcIkRlYnVnX1NsaWRlcnNcIl0gPSAyXSA9IFwiRGVidWdfU2xpZGVyc1wiO1xufSkoTG9nX1R5cGUgfHwgKGV4cG9ydHMuTG9nX1R5cGUgPSBMb2dfVHlwZSA9IHt9KSk7XG5mdW5jdGlvbiBsb2cobG9nX3R5cGUsIC4uLmRhdGEpIHtcbiAgICAvLyBpZiB0aGlzIGlzIHRoZSBlbXB0eSBzdHJpbmdcbiAgICB2YXIgZG9fbG9nID0gZmFsc2U7XG4gICAgdmFyIGxvZ19oZWFkZXIgPSBcIlwiO1xuICAgIHN3aXRjaCAobG9nX3R5cGUpIHtcbiAgICAgICAgY2FzZSBMb2dfVHlwZS5HZW5lcmFsOlxuICAgICAgICAgICAgbG9nX2hlYWRlciA9IFwiXCI7XG4gICAgICAgICAgICBkb19sb2cgPSB0cnVlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgTG9nX1R5cGUuRGVidWdfRGlzcGxheTpcbiAgICAgICAgICAgIGxvZ19oZWFkZXIgPSBcIkRFQlVHX0RJU1BMQVlcIjtcbiAgICAgICAgICAgIGlmIChleHBvcnRzLkRFQlVHX0RJU1BMQVkpXG4gICAgICAgICAgICAgICAgZG9fbG9nID0gdHJ1ZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIExvZ19UeXBlLkRlYnVnX1NsaWRlcnM6XG4gICAgICAgICAgICBsb2dfaGVhZGVyID0gXCJERUJVR19TTElERVJTXCI7XG4gICAgICAgICAgICBpZiAoZXhwb3J0cy5ERUJVR19TTElERVJTKVxuICAgICAgICAgICAgICAgIGRvX2xvZyA9IHRydWU7XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG4gICAgaWYgKGRvX2xvZykge1xuICAgICAgICBpZiAobG9nX2hlYWRlciAhPSBcIlwiKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgJHtsb2dfaGVhZGVyfTogYCwgLi4uZGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyguLi5kYXRhKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5zZXR1cF9zbGlkZXJzID0gc2V0dXBfc2xpZGVycztcbmNvbnN0IGxvZ2dlcl8xID0gcmVxdWlyZShcIi4vbG9nZ2VyXCIpO1xudmFyIFByb3BlcnR5X1R5cGU7XG4oZnVuY3Rpb24gKFByb3BlcnR5X1R5cGUpIHtcbiAgICBQcm9wZXJ0eV9UeXBlW1Byb3BlcnR5X1R5cGVbXCJOb25lXCJdID0gMF0gPSBcIk5vbmVcIjtcbiAgICBQcm9wZXJ0eV9UeXBlW1Byb3BlcnR5X1R5cGVbXCJQcm9wZXJ0eV9GbG9hdFwiXSA9IDFdID0gXCJQcm9wZXJ0eV9GbG9hdFwiO1xuICAgIFByb3BlcnR5X1R5cGVbUHJvcGVydHlfVHlwZVtcIlByb3BlcnR5X0ludFwiXSA9IDJdID0gXCJQcm9wZXJ0eV9JbnRcIjtcbiAgICBQcm9wZXJ0eV9UeXBlW1Byb3BlcnR5X1R5cGVbXCJQcm9wZXJ0eV9Cb29sXCJdID0gM10gPSBcIlByb3BlcnR5X0Jvb2xcIjtcbn0pKFByb3BlcnR5X1R5cGUgfHwgKFByb3BlcnR5X1R5cGUgPSB7fSkpO1xuY2xhc3MgUHJvcGVydHlfU3RydWN0IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5wcm9wZXJ0eV90eXBlID0gUHJvcGVydHlfVHlwZS5Ob25lO1xuICAgICAgICAvLyBGbG9hdCBwcm9wZXJ0aWVzXG4gICAgICAgIHRoaXMuZmxvYXRfcmFuZ2VfbWluID0gMDtcbiAgICAgICAgdGhpcy5mbG9hdF9yYW5nZV9tYXggPSAwO1xuICAgICAgICB0aGlzLmZsb2F0X2RlZmF1bHQgPSAwO1xuICAgICAgICAvLyBJbnQgcHJvcGVydGllc1xuICAgICAgICB0aGlzLmludF9yYW5nZV9taW4gPSAwO1xuICAgICAgICB0aGlzLmludF9yYW5nZV9tYXggPSAwO1xuICAgICAgICB0aGlzLmludF9kZWZhdWx0ID0gMDtcbiAgICAgICAgdGhpcy5ib29sX2RlZmF1bHQgPSBmYWxzZTtcbiAgICB9XG59XG5mdW5jdGlvbiB0YWdfcHJvcF90b19wYXJ0cyhwcm9wKSB7XG4gICAgY29uc3QgW2xlZnQsIHJpZ2h0X10gPSBwcm9wLnNwbGl0KFwiOlwiKTtcbiAgICBjb25zdCByaWdodCA9IHJpZ2h0Xy5zbGljZSgxLCByaWdodF8ubGVuZ3RoIC0gMSk7XG4gICAgcmV0dXJuIFtsZWZ0LCByaWdodF07XG59XG5mdW5jdGlvbiBwYXJzZUJvb2wocykge1xuICAgIC8vIDEsIHQsIFQsIFRSVUUsIHRydWUsIFRydWUsXG4gICAgLy8gMCwgZiwgRiwgRkFMU0UsIGZhbHNlLCBGYWxzZVxuICAgIHN3aXRjaCAocykge1xuICAgICAgICBjYXNlIFwiMVwiOlxuICAgICAgICBjYXNlIFwidFwiOlxuICAgICAgICBjYXNlIFwiVFwiOlxuICAgICAgICBjYXNlIFwiVFJVRVwiOlxuICAgICAgICBjYXNlIFwidHJ1ZVwiOlxuICAgICAgICBjYXNlIFwiVHJ1ZVwiOlxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIGNhc2UgXCIwXCI6XG4gICAgICAgIGNhc2UgXCJmXCI6XG4gICAgICAgIGNhc2UgXCJGXCI6XG4gICAgICAgIGNhc2UgXCJGQUxTRVwiOlxuICAgICAgICBjYXNlIFwiZmFsc2VcIjpcbiAgICAgICAgY2FzZSBcIkZhbHNlXCI6XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvcihgVW5rbm93biBzdHJpbmcgaW4gcGFyc2VCb29sLCB3YXMgJHtzfWApO1xuICAgIH1cbn1cbi8vIHB1dHMgc29tZSBzbGlkZXJzIHVwIHRvIGNvbnRyb2wgc29tZSBwYXJhbWV0ZXJzXG5mdW5jdGlvbiBzZXR1cF9zbGlkZXJzKHByb3BlcnRpZXMsIHNldF9wcm9wZXJ0eSkge1xuICAgIGNvbnN0IHNsaWRlcl9jb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNsaWRlQ29udGFpbmVyXCIpO1xuICAgIGlmIChzbGlkZXJfY29udGFpbmVyID09PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBHZXQgc2xpZGVyIGNvbnRhaW5lclwiKTtcbiAgICB9XG4gICAgLy8gVE9ETyBmb3IgdGhlIHNsaWRlcyB0aGF0IGhhdmUgYSBzbWFsbCByYW5nZSAobGlrZSBjb2hlc2lvbiBmYWN0b3IpIG1ha2UgdGhlIHZhbHVlIHRoZSBzcXVhcmUgb2YgdGhlIG51bWJlci5cbiAgICBwcm9wZXJ0aWVzLnNvcnQoKTsgLy8gaG9wZSBzb21lb25lIGVsc2Ugd2Fzbid0IHVzaW5nIHRoaXMuXG4gICAgZm9yIChjb25zdCBbbmFtZSwgdGFnXSBvZiBwcm9wZXJ0aWVzKSB7XG4gICAgICAgICgwLCBsb2dnZXJfMS5sb2cpKGxvZ2dlcl8xLkxvZ19UeXBlLkRlYnVnX1NsaWRlcnMsIGB0eXBlc2NyaXB0OiAke25hbWV9OiAke3RhZ31gKTtcbiAgICAgICAgLy8gVE9ETyB0aGlzIGZ1bmN0aW9uIGlzIGdyb3dpbmcgdG8gYmlnLCBwdXQgaXQgaW4gYSBzZXBhcmF0ZSBmaWxlLlxuICAgICAgICBjb25zdCB0YWdfc3BsaXQgPSB0YWcuc3BsaXQoXCIgXCIpO1xuICAgICAgICBjb25zdCBbcHJvcF9wcm9wZXJ0eSwgcHJvcF90eXBlXSA9IHRhZ19wcm9wX3RvX3BhcnRzKHRhZ19zcGxpdFswXSk7XG4gICAgICAgIGlmIChwcm9wX3Byb3BlcnR5ICE9IFwiUHJvcGVydHlcIilcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRmlyc3QgcHJvcGVydHkgaXMgbm90IHByb3BlcnR5LCB0YWcgd2FzICR7dGFnfWApO1xuICAgICAgICBjb25zdCBwcm9wZXJ0eV9zdHJ1Y3QgPSBuZXcgUHJvcGVydHlfU3RydWN0KCk7XG4gICAgICAgIHN3aXRjaCAocHJvcF90eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFwiZmxvYXRcIjpcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eV9zdHJ1Y3QucHJvcGVydHlfdHlwZSA9IFByb3BlcnR5X1R5cGUuUHJvcGVydHlfRmxvYXQ7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiaW50XCI6XG4gICAgICAgICAgICAgICAgcHJvcGVydHlfc3RydWN0LnByb3BlcnR5X3R5cGUgPSBQcm9wZXJ0eV9UeXBlLlByb3BlcnR5X0ludDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJib29sXCI6XG4gICAgICAgICAgICAgICAgcHJvcGVydHlfc3RydWN0LnByb3BlcnR5X3R5cGUgPSBQcm9wZXJ0eV9UeXBlLlByb3BlcnR5X0Jvb2w7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OiB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gcHJvcCB0eXBlICR7cHJvcF90eXBlfWApO1xuICAgICAgICB9XG4gICAgICAgIHRhZ19zcGxpdC5zaGlmdCgpO1xuICAgICAgICB3aGlsZSAodGFnX3NwbGl0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IFtsZWZ0LCByaWdodF0gPSB0YWdfcHJvcF90b19wYXJ0cyh0YWdfc3BsaXRbMF0pO1xuICAgICAgICAgICAgdGFnX3NwbGl0LnNoaWZ0KCk7XG4gICAgICAgICAgICBzd2l0Y2ggKGxlZnQpIHtcbiAgICAgICAgICAgICAgICBjYXNlIFwiUmFuZ2VcIjpcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChwcm9wZXJ0eV9zdHJ1Y3QucHJvcGVydHlfdHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBQcm9wZXJ0eV9UeXBlLlByb3BlcnR5X0Zsb2F0OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgW21pbl9zLCBtYXhfc10gPSByaWdodC5zcGxpdChcIjtcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlfc3RydWN0LmZsb2F0X3JhbmdlX21pbiA9IHBhcnNlRmxvYXQobWluX3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5X3N0cnVjdC5mbG9hdF9yYW5nZV9tYXggPSBwYXJzZUZsb2F0KG1heF9zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgUHJvcGVydHlfVHlwZS5Qcm9wZXJ0eV9JbnQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBbbWluX3MsIG1heF9zXSA9IHJpZ2h0LnNwbGl0KFwiO1wiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eV9zdHJ1Y3QuaW50X3JhbmdlX21pbiA9IHBhcnNlSW50KG1pbl9zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eV9zdHJ1Y3QuaW50X3JhbmdlX21heCA9IHBhcnNlSW50KG1heF9zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgUHJvcGVydHlfVHlwZS5Qcm9wZXJ0eV9Cb29sOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQm9vbGVhbiBkb3NlIG5vdCBoYXZlIGEgcmFuZ2UhXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIHR5cGUgaW4gJHtuYW1lfWApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJEZWZhdWx0XCI6XG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAocHJvcGVydHlfc3RydWN0LnByb3BlcnR5X3R5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgUHJvcGVydHlfVHlwZS5Qcm9wZXJ0eV9GbG9hdDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eV9zdHJ1Y3QuZmxvYXRfZGVmYXVsdCA9IHBhcnNlRmxvYXQocmlnaHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBQcm9wZXJ0eV9UeXBlLlByb3BlcnR5X0ludDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eV9zdHJ1Y3QuaW50X2RlZmF1bHQgPSBwYXJzZUludChyaWdodCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFByb3BlcnR5X1R5cGUuUHJvcGVydHlfQm9vbDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eV9zdHJ1Y3QuYm9vbF9kZWZhdWx0ID0gcGFyc2VCb29sKHJpZ2h0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvcihgVW5rbm93biB0eXBlIGluICR7bmFtZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gcHJvcGVydHkgJHtsZWZ0fWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIFRPRE8gc29tZSB3YXkgdG8gcHJpbnQgYW4gb2JqZWN0LlxuICAgICAgICAvLyBsb2coTG9nX1R5cGUuRGVidWdfU2xpZGVycywgYHByb3BlcnR5IHN0cnVjdCAke3Byb3BlcnR5X3N0cnVjdH1gKTtcbiAgICAgICAgc3dpdGNoIChwcm9wZXJ0eV9zdHJ1Y3QucHJvcGVydHlfdHlwZSkge1xuICAgICAgICAgICAgY2FzZSBQcm9wZXJ0eV9UeXBlLlByb3BlcnR5X0Zsb2F0OlxuICAgICAgICAgICAgICAgIG1ha2VfZmxvYXRfc2xpZGVyKHNsaWRlcl9jb250YWluZXIsIG5hbWUsIHByb3BlcnR5X3N0cnVjdCwgc2V0X3Byb3BlcnR5KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgUHJvcGVydHlfVHlwZS5Qcm9wZXJ0eV9JbnQ6XG4gICAgICAgICAgICAgICAgbWFrZV9pbnRfc2xpZGVyKHNsaWRlcl9jb250YWluZXIsIG5hbWUsIHByb3BlcnR5X3N0cnVjdCwgc2V0X3Byb3BlcnR5KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgUHJvcGVydHlfVHlwZS5Qcm9wZXJ0eV9Cb29sOlxuICAgICAgICAgICAgICAgIG1ha2VfYm9vbF9zbGlkZXIoc2xpZGVyX2NvbnRhaW5lciwgbmFtZSwgcHJvcGVydHlfc3RydWN0LCBzZXRfcHJvcGVydHkpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIHByb3BlcnR5IHR5cGUgJHtwcm9wZXJ0eV9zdHJ1Y3QucHJvcGVydHlfdHlwZX1gKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyAgICAgICAgIE1ha2UgYSBzbGlkZXIgZm9yIGFuIGZsb2F0XG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuZnVuY3Rpb24gbWFrZV9mbG9hdF9zbGlkZXIoc2xpZGVyX2NvbnRhaW5lciwgbmFtZSwgcHJvcGVydHlfc3RydWN0LCBzZXRfcHJvcGVydHkpIHtcbiAgICBjb25zdCBpZCA9IGBzbGlkZXJfJHtuYW1lfWA7XG4gICAgY29uc3QgcGFyYV9pZCA9IGAke2lkfV9wYXJhZ3JhcGhgO1xuICAgIGNvbnN0IHBhcmFncmFwaF90ZXh0ID0gYCR7bmFtZS5yZXBsYWNlKC9fL2csIFwiIFwiKX1gO1xuICAgIGNvbnN0IGluaXRpYWxfdmFsdWUgPSBwcm9wZXJ0eV9zdHJ1Y3QuZmxvYXRfZGVmYXVsdDtcbiAgICBjb25zdCBpbml0aWFsX3ZhbHVlX2Zvcl90ZXh0ID0gaW5pdGlhbF92YWx1ZS50b1ByZWNpc2lvbigyKTtcbiAgICBjb25zdCBtYXBfcmFuZ2VfdG9fc2xpZGVyX251bWJlciA9ICh4KSA9PiB7XG4gICAgICAgIGNvbnN0IG1pbiA9IHByb3BlcnR5X3N0cnVjdC5mbG9hdF9yYW5nZV9taW47XG4gICAgICAgIGNvbnN0IG1heCA9IHByb3BlcnR5X3N0cnVjdC5mbG9hdF9yYW5nZV9tYXg7XG4gICAgICAgIHJldHVybiAoeCAtIG1pbikgLyAobWF4IC0gbWluKSAqICgxMDAwIC0gMCkgKyAwO1xuICAgIH07XG4gICAgY29uc3QgbWFwX3JhbmdlX3RvX3JlYWxfcmFuZ2UgPSAoeCkgPT4ge1xuICAgICAgICBjb25zdCBtaW4gPSBwcm9wZXJ0eV9zdHJ1Y3QuZmxvYXRfcmFuZ2VfbWluO1xuICAgICAgICBjb25zdCBtYXggPSBwcm9wZXJ0eV9zdHJ1Y3QuZmxvYXRfcmFuZ2VfbWF4O1xuICAgICAgICAvLyBUT0RPIHRvUHJlY2lzaW9uIG1pZ2h0IG5vdCBiZSB0aGUgYmVzdCBmdW5jdGlvbiBmb3IgZm9ybWF0dGluZy4gbWFyZ2luIGlzIGJlaW5nIG1lc3NlZCB3aXRoICgxLjBlKzIpXG4gICAgICAgIC8vIG1ha2UgaXQgdGhlIHByb3BlciB2YWx1ZSAvLyBUT0RPIGlzIHRoaXMgY29ycmVjdD8gZXZlbiBmb3Igc21hbGwgdmFsdWVzP1xuICAgICAgICByZXR1cm4gcGFyc2VGbG9hdCgoKHggLSAwKSAvICgxMDAwIC0gMCkgKiAobWF4IC0gbWluKSArIG1pbikudG9QcmVjaXNpb24oMikpO1xuICAgIH07XG4gICAgLy8gVE9ETyBhIGxvdCBvZiBudW1iZXJzIG11c3QgYmUgYmV0d2VlbiAwLTEsIGJlY2F1c2Ugc2xpZGVycyBvbmx5IHVzZSBpbnRzIChsb29rIHVwIGlmIHRoaXMgaXMgdGhlIGNhc2UuKSB3ZSB3aWxsIGhhdmUgdG8gZ2V0IGNyZWF0aXZlXG4gICAgLy8gVE9ETyB1c2Ugc3RlcC4gbWlnaHQgY2xlYW4gdGhpcyB1cCBhIGJpdC5cbiAgICBjb25zdCBodG1sX3N0cmluZyA9IGBcbiAgICAgICAgPHAgY2xhc3M9XCJzbGlkZXJLZXlcIiBpZD1cIiR7cGFyYV9pZH1cIj5cbiAgICAgICAgICAgICR7cGFyYWdyYXBoX3RleHR9OiAke2luaXRpYWxfdmFsdWVfZm9yX3RleHR9XG4gICAgICAgIDwvcD5cbiAgICAgICAgPGlucHV0IHR5cGU9XCJyYW5nZVwiIG1pbj1cIjBcIiBtYXg9XCIxMDAwXCIgdmFsdWU9XCIke21hcF9yYW5nZV90b19zbGlkZXJfbnVtYmVyKGluaXRpYWxfdmFsdWUpfVwiIGNsYXNzPVwic2xpZGVyXCIgaWQ9XCIke2lkfVwiPlxuICAgICAgICBgO1xuICAgIGNvbnN0IG5ld190aGluZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgbmV3X3RoaW5nLmNsYXNzTmFtZSA9IFwicmFuZ2VIb2xkZXJcIjtcbiAgICBuZXdfdGhpbmcuaW5uZXJIVE1MID0gaHRtbF9zdHJpbmc7XG4gICAgc2xpZGVyX2NvbnRhaW5lci5hcHBlbmRDaGlsZChuZXdfdGhpbmcpO1xuICAgIGNvbnN0IHNsaWRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcbiAgICBpZiAoc2xpZGVyID09PSBudWxsKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb3VsZCBub3QgZmluZCB0aGUgc2xpZGVyXCIpO1xuICAgIHNsaWRlci5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgIGNvbnN0IHNsaWRlcl92YWx1ZV9zdHJpbmcgPSBldmVudC50YXJnZXQudmFsdWU7XG4gICAgICAgIGNvbnN0IHNsaWRlcl9udW1iZXIgPSBtYXBfcmFuZ2VfdG9fcmVhbF9yYW5nZShOdW1iZXIoc2xpZGVyX3ZhbHVlX3N0cmluZykpO1xuICAgICAgICBjb25zdCBzbGlkZXJfdGV4dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHBhcmFfaWQpO1xuICAgICAgICBpZiAoc2xpZGVyX3RleHQgPT09IG51bGwpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGNvdWxkIG5vdCBmaW5kIHNsaWRlcl90ZXh0ICR7cGFyYV9pZH1gKTtcbiAgICAgICAgc2xpZGVyX3RleHQudGV4dENvbnRlbnQgPSBgJHtwYXJhZ3JhcGhfdGV4dH06ICR7c2xpZGVyX251bWJlcn1gO1xuICAgICAgICBzZXRfcHJvcGVydHkobmFtZSwgc2xpZGVyX251bWJlcik7XG4gICAgfSk7XG59XG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gICAgICAgICAgTWFrZSBhIHNsaWRlciBmb3IgYW4gaW50XG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuZnVuY3Rpb24gbWFrZV9pbnRfc2xpZGVyKHNsaWRlcl9jb250YWluZXIsIG5hbWUsIHByb3BlcnR5X3N0cnVjdCwgc2V0X3Byb3BlcnR5KSB7XG4gICAgY29uc3QgaWQgPSBgc2xpZGVyXyR7bmFtZX1gO1xuICAgIGNvbnN0IHBhcmFfaWQgPSBgJHtpZH1fcGFyYWdyYXBoYDtcbiAgICBjb25zdCBwYXJhZ3JhcGhfdGV4dCA9IGAke25hbWUucmVwbGFjZSgvXy9nLCBcIiBcIil9YDtcbiAgICBjb25zdCBodG1sX3N0cmluZyA9IGBcbiAgICAgICAgPHAgY2xhc3M9XCJzbGlkZXJLZXlcIiBpZD1cIiR7cGFyYV9pZH1cIj5cbiAgICAgICAgICAgICR7cGFyYWdyYXBoX3RleHR9OiAke3Byb3BlcnR5X3N0cnVjdC5pbnRfZGVmYXVsdH1cbiAgICAgICAgPC9wPlxuICAgICAgICA8aW5wdXQgdHlwZT1cInJhbmdlXCIgbWluPVwiJHtwcm9wZXJ0eV9zdHJ1Y3QuaW50X3JhbmdlX21pbn1cIiBtYXg9XCIke3Byb3BlcnR5X3N0cnVjdC5pbnRfcmFuZ2VfbWF4fVwiIHZhbHVlPVwiJHtwcm9wZXJ0eV9zdHJ1Y3QuaW50X2RlZmF1bHR9XCIgY2xhc3M9XCJzbGlkZXJcIiBpZD1cIiR7aWR9XCI+XG4gICAgICAgIGA7XG4gICAgY29uc3QgbmV3X3RoaW5nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICBuZXdfdGhpbmcuY2xhc3NOYW1lID0gXCJyYW5nZUhvbGRlclwiO1xuICAgIG5ld190aGluZy5pbm5lckhUTUwgPSBodG1sX3N0cmluZztcbiAgICBzbGlkZXJfY29udGFpbmVyLmFwcGVuZENoaWxkKG5ld190aGluZyk7XG4gICAgY29uc3Qgc2xpZGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICAgIGlmIChzbGlkZXIgPT09IG51bGwpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvdWxkIG5vdCBmaW5kIHRoZSBzbGlkZXJcIik7XG4gICAgc2xpZGVyLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgY29uc3Qgc2xpZGVyX3ZhbHVlX3N0cmluZyA9IGV2ZW50LnRhcmdldC52YWx1ZTtcbiAgICAgICAgY29uc3Qgc2xpZGVyX251bWJlciA9IE51bWJlcihzbGlkZXJfdmFsdWVfc3RyaW5nKTtcbiAgICAgICAgY29uc3Qgc2xpZGVyX3RleHQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChwYXJhX2lkKTtcbiAgICAgICAgaWYgKHNsaWRlcl90ZXh0ID09PSBudWxsKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBjb3VsZCBub3QgZmluZCBzbGlkZXJfdGV4dCAke3BhcmFfaWR9YCk7XG4gICAgICAgIHNsaWRlcl90ZXh0LnRleHRDb250ZW50ID0gYCR7cGFyYWdyYXBoX3RleHR9OiAke3NsaWRlcl9udW1iZXJ9YDtcbiAgICAgICAgc2V0X3Byb3BlcnR5KG5hbWUsIHNsaWRlcl9udW1iZXIpO1xuICAgIH0pO1xufVxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vICAgICBNYWtlIGEgc2xpZGVyIGZvciBhbiBib29sZWFuIHRvZ2dsZVxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbmZ1bmN0aW9uIG1ha2VfYm9vbF9zbGlkZXIoc2xpZGVyX2NvbnRhaW5lciwgbmFtZSwgcHJvcGVydHlfc3RydWN0LCBzZXRfcHJvcGVydHkpIHtcbiAgICBjb25zdCBpZCA9IGBzbGlkZXJfJHtuYW1lfWA7XG4gICAgY29uc3QgcGFyYWdyYXBoX3RleHQgPSBgJHtuYW1lLnJlcGxhY2UoL18vZywgXCIgXCIpfWA7XG4gICAgY29uc3QgaHRtbF9zdHJpbmcgPSBgXG4gICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiAke3Byb3BlcnR5X3N0cnVjdC5ib29sX2RlZmF1bHQgPyBcImNoZWNrZWRcIiA6IFwiXCJ9IGNsYXNzPVwiY2hlY2tib3hfdG9nZ2xlXCIgaWQ9XCIke2lkfVwiPlxuICAgICAgICA8bGFiZWwgZm9yPVwiJHtpZH1cIiBjbGFzcz1cImNoZWNrYm94X3RvZ2dsZV9sYWJlbFwiPiR7cGFyYWdyYXBoX3RleHR9PC9sYWJlbD5cbiAgICAgICAgYDtcbiAgICBjb25zdCBuZXdfdGhpbmcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIG5ld190aGluZy5jbGFzc05hbWUgPSBcInJhbmdlSG9sZGVyXCI7XG4gICAgbmV3X3RoaW5nLmlubmVySFRNTCA9IGh0bWxfc3RyaW5nO1xuICAgIHNsaWRlcl9jb250YWluZXIuYXBwZW5kQ2hpbGQobmV3X3RoaW5nKTtcbiAgICBjb25zdCBzbGlkZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG4gICAgaWYgKHNsaWRlciA9PT0gbnVsbClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ291bGQgbm90IGZpbmQgdGhlIHNsaWRlclwiKTtcbiAgICBzbGlkZXIuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsIChldmVudCkgPT4ge1xuICAgICAgICBjb25zdCBjaGVja2VkID0gZXZlbnQudGFyZ2V0LmNoZWNrZWQ7XG4gICAgICAgIHNldF9wcm9wZXJ0eShuYW1lLCBjaGVja2VkKTtcbiAgICB9KTtcbn1cbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCJcInVzZSBzdHJpY3RcIjtcbi8vIHR5cGVzY3JpcHQgZ2x1ZSBjb2RlLlxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuY29uc3QgbG9nZ2VyXzEgPSByZXF1aXJlKFwiLi9sb2dnZXJcIik7XG5jb25zdCBzZXR1cF9zbGlkZXJzXzEgPSByZXF1aXJlKFwiLi9zZXR1cF9zbGlkZXJzXCIpO1xuLy8gTk9URSB3ZSBrZWVwIHRoZSBAdHMtaWdub3JlJ3MgaW4gaGVyZVxuYXN5bmMgZnVuY3Rpb24gR2V0R29GdW5jdGlvbnMoKSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGNvbnN0IGdvID0gbmV3IEdvKCk7IC8vIE5PVEUgdGhpcyBjb21lcyBmcm9tIHRoZSB3YXNtX2V4ZWMuanMgdGhpbmdcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBXZWJBc3NlbWJseS5pbnN0YW50aWF0ZVN0cmVhbWluZyhmZXRjaChcImRpc3QvYm9pZC53YXNtXCIpLCBnby5pbXBvcnRPYmplY3QpO1xuICAgIGdvLnJ1bihyZXN1bHQuaW5zdGFuY2UpO1xuICAgIHJldHVybiB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgU2V0UHJvcGVydGllczogU2V0UHJvcGVydGllcyxcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBHZXRQcm9wZXJ0aWVzOiBHZXRQcm9wZXJ0aWVzLFxuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIEdldE5leHRGcmFtZTogR2V0TmV4dEZyYW1lLFxuICAgIH07XG59XG5jb25zdCBOVU1fQ09MT1JfQ09NUE9ORU5UUyA9IDQ7XG5jb25zdCBTUVVJU0hfRkFDVE9SID0gMTtcbmZ1bmN0aW9uIHJlbmRlckJvaWRzKGRpc3BsYXksIGdvKSB7XG4gICAgY29uc3Qgd2lkdGggPSBNYXRoLmZsb29yKGRpc3BsYXkuY3R4LmNhbnZhcy53aWR0aCAvIFNRVUlTSF9GQUNUT1IpO1xuICAgIGNvbnN0IGhlaWdodCA9IE1hdGguZmxvb3IoZGlzcGxheS5jdHguY2FudmFzLmhlaWdodCAvIFNRVUlTSF9GQUNUT1IpO1xuICAgIGNvbnN0IGJ1ZmZlcl9zaXplID0gd2lkdGggKiBoZWlnaHQgKiBOVU1fQ09MT1JfQ09NUE9ORU5UUztcbiAgICBpZiAoZGlzcGxheS5iYWNrSW1hZ2VXaWR0aCAhPT0gd2lkdGggfHwgZGlzcGxheS5iYWNrSW1hZ2VIZWlnaHQgIT09IGhlaWdodCkge1xuICAgICAgICAoMCwgbG9nZ2VyXzEubG9nKShsb2dnZXJfMS5Mb2dfVHlwZS5HZW5lcmFsLCBcIk9oIGdvZC4gd2VyZSByZXNpemluZyB0aGUgYnVmZmVyXCIpO1xuICAgICAgICBpZiAoZGlzcGxheS5iYWNrQnVmZmVyQXJyYXkubGVuZ3RoIDwgYnVmZmVyX3NpemUpIHtcbiAgICAgICAgICAgIC8vIG1ha2UgdGhlIGJ1ZmZlciBiaWdnZXJcbiAgICAgICAgICAgIGRpc3BsYXkuYmFja0J1ZmZlckFycmF5ID0gbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KGJ1ZmZlcl9zaXplKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBiYWNrQ2FudmFzID0gbmV3IE9mZnNjcmVlbkNhbnZhcyh3aWR0aCwgaGVpZ2h0KTtcbiAgICAgICAgY29uc3QgYmFja0N0eCA9IGJhY2tDYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpO1xuICAgICAgICBpZiAoYmFja0N0eCA9PT0gbnVsbClcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIjJEIGNvbnRleHQgaXMgbm90IHN1cHBvcnRlZFwiKTtcbiAgICAgICAgZGlzcGxheS5iYWNrQ3R4ID0gYmFja0N0eDtcbiAgICAgICAgZGlzcGxheS5iYWNrQ3R4LmltYWdlU21vb3RoaW5nRW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICBkaXNwbGF5LmJhY2tJbWFnZVdpZHRoID0gd2lkdGg7XG4gICAgICAgIGRpc3BsYXkuYmFja0ltYWdlSGVpZ2h0ID0gaGVpZ2h0O1xuICAgIH1cbiAgICBjb25zdCBidWZmZXIgPSBkaXNwbGF5LmJhY2tCdWZmZXJBcnJheS5zdWJhcnJheSgwLCBidWZmZXJfc2l6ZSk7XG4gICAgY29uc3QgbnVtRmlsbGVkID0gZ28uR2V0TmV4dEZyYW1lKHdpZHRoLCBoZWlnaHQsIGJ1ZmZlcik7XG4gICAgaWYgKG51bUZpbGxlZCAhPT0gYnVmZmVyX3NpemUpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgR2V0TmV4dEZyYW1lIGdvdCAke251bUZpbGxlZH1gKTtcbiAgICBjb25zdCBpbWFnZURhdGEgPSBuZXcgSW1hZ2VEYXRhKGJ1ZmZlciwgd2lkdGgsIGhlaWdodCk7XG4gICAgLy8gaXMgdGhpcyBjb29sP1xuICAgIGRpc3BsYXkuYmFja0N0eC5wdXRJbWFnZURhdGEoaW1hZ2VEYXRhLCAwLCAwKTtcbiAgICAvLyBOT1RFIHRoaXMgd2lsbCBzdHJldGNoIHRoZSB0aGluZy5cbiAgICAvLyBjYW52YXMud2lkdGggbWlnaHQgY2hhbmdlIGR1cmluZyB0aGUgdGltZSB0aGlzIGlzIHJ1bm5pbmdcbiAgICBkaXNwbGF5LmN0eC5kcmF3SW1hZ2UoZGlzcGxheS5iYWNrQ3R4LmNhbnZhcywgMCwgMCwgZGlzcGxheS5jdHguY2FudmFzLndpZHRoLCBkaXNwbGF5LmN0eC5jYW52YXMuaGVpZ2h0KTtcbiAgICAvLyBpbWFnZURhdGEgPSBudWxsXG59XG5jb25zdCByZW5kZXJUaW1lcyA9IFtdO1xuY29uc3QgZGVsdGFUaW1lcyA9IFtdO1xuLy8gQ3JlZGl0OiBodHRwczovL2dpdGh1Yi5jb20vdHNvZGluZy9rb2lsXG5mdW5jdGlvbiByZW5kZXJEZWJ1Z0luZm8oZGlzcGxheSwgcmVuZGVyVGltZSwgZGVsdGFUaW1lKSB7XG4gICAgY29uc3QgZm9udFNpemUgPSAyODtcbiAgICBkaXNwbGF5LmN0eC5mb250ID0gYCR7Zm9udFNpemV9cHggYm9sZGA7XG4gICAgY29uc3QgbGFiZWxzID0gW107XG4gICAgcmVuZGVyVGltZXMucHVzaChyZW5kZXJUaW1lKTtcbiAgICBpZiAocmVuZGVyVGltZXMubGVuZ3RoID4gNjApIHtcbiAgICAgICAgcmVuZGVyVGltZXMuc2hpZnQoKTtcbiAgICB9XG4gICAgZGVsdGFUaW1lcy5wdXNoKGRlbHRhVGltZSk7XG4gICAgaWYgKGRlbHRhVGltZXMubGVuZ3RoID4gNjApIHtcbiAgICAgICAgZGVsdGFUaW1lcy5zaGlmdCgpO1xuICAgIH1cbiAgICBjb25zdCByZW5kZXJBdmcgPSByZW5kZXJUaW1lcy5yZWR1Y2UoKGEsIGIpID0+IGEgKyBiLCAwKSAvIHJlbmRlclRpbWVzLmxlbmd0aDtcbiAgICBjb25zdCBkZWx0YUF2ZyA9IGRlbHRhVGltZXMucmVkdWNlKChhLCBiKSA9PiBhICsgYiwgMCkgLyBkZWx0YVRpbWVzLmxlbmd0aDtcbiAgICBsYWJlbHMucHVzaChgRlBTOiAkeygxIC8gZGVsdGFBdmcgKiAxMDAwKS50b0ZpeGVkKDIpfWApO1xuICAgIGxhYmVscy5wdXNoKGBtcyBwZXIgZnJhbWU6ICR7ZGVsdGFBdmcudG9GaXhlZCgyKX1gKTtcbiAgICBsYWJlbHMucHVzaChgUmVuZGVyIFRpbWUgQXZnIChtcyk6ICR7cmVuZGVyQXZnLnRvRml4ZWQoMil9YCk7XG4gICAgbGFiZWxzLnB1c2goYFJlbmRlci9TZWMgKE1BWCk6ICR7KDEgLyByZW5kZXJBdmcgKiAxMDAwKS50b0ZpeGVkKDIpfWApO1xuICAgIGNvbnN0IHBhZGRpbmcgPSA3MDtcbiAgICBjb25zdCBzaGFkb3dPZmZzZXQgPSBmb250U2l6ZSAqIDAuMDY7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsYWJlbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZGlzcGxheS5jdHguZmlsbFN0eWxlID0gXCJibGFja1wiO1xuICAgICAgICBkaXNwbGF5LmN0eC5maWxsVGV4dChsYWJlbHNbaV0sIHBhZGRpbmcsIHBhZGRpbmcgKyBmb250U2l6ZSAqIGkpO1xuICAgICAgICBkaXNwbGF5LmN0eC5maWxsU3R5bGUgPSBcIndoaXRlXCI7XG4gICAgICAgIGRpc3BsYXkuY3R4LmZpbGxUZXh0KGxhYmVsc1tpXSwgcGFkZGluZyArIHNoYWRvd09mZnNldCwgcGFkZGluZyAtIHNoYWRvd09mZnNldCArIGZvbnRTaXplICogaSk7XG4gICAgfVxufVxuKGFzeW5jICgpID0+IHtcbiAgICBjb25zdCBnbyA9IGF3YWl0IEdldEdvRnVuY3Rpb25zKCk7XG4gICAgeyAvLyBIYW5kbGUgc2xpZGVyIHN0dWZmXG4gICAgICAgIGNvbnN0IHByb3BlcnRpZXMgPSBPYmplY3QuZW50cmllcyhnby5HZXRQcm9wZXJ0aWVzKCkpO1xuICAgICAgICBmdW5jdGlvbiBzZXRfcHJvcGVydHkobmFtZSwgdmFsdWUpIHtcbiAgICAgICAgICAgIC8vIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEyNzEwOTA1L2hvdy1kby1pLWR5bmFtaWNhbGx5LWFzc2lnbi1wcm9wZXJ0aWVzLXRvLWFuLW9iamVjdC1pbi10eXBlc2NyaXB0XG4gICAgICAgICAgICBjb25zdCBvYmogPSB7fTtcbiAgICAgICAgICAgIG9ialtuYW1lXSA9IHZhbHVlO1xuICAgICAgICAgICAgZ28uU2V0UHJvcGVydGllcyhvYmopO1xuICAgICAgICB9XG4gICAgICAgICgwLCBzZXR1cF9zbGlkZXJzXzEuc2V0dXBfc2xpZGVycykocHJvcGVydGllcywgc2V0X3Byb3BlcnR5KTtcbiAgICB9XG4gICAgY29uc3QgYm9pZENhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYm9pZF9jYW52YXNcIik7XG4gICAgaWYgKGJvaWRDYW52YXMgPT09IG51bGwpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vIGNhbnZhcyB3aXRoIGlkIGBib2lkX2NhbnZhc2AgaXMgZm91bmRcIik7XG4gICAgY29uc3QgY3R4ID0gYm9pZENhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XG4gICAgaWYgKGN0eCA9PT0gbnVsbClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiMkQgY29udGV4dCBpcyBub3Qgc3VwcG9ydGVkXCIpO1xuICAgIGN0eC5pbWFnZVNtb290aGluZ0VuYWJsZWQgPSBmYWxzZTtcbiAgICBjb25zdCBbYmFja0ltYWdlV2lkdGgsIGJhY2tJbWFnZUhlaWdodF0gPSBbY3R4LmNhbnZhcy53aWR0aCwgY3R4LmNhbnZhcy5oZWlnaHRdO1xuICAgIGNvbnN0IGJhY2tDYW52YXMgPSBuZXcgT2Zmc2NyZWVuQ2FudmFzKGJhY2tJbWFnZVdpZHRoLCBiYWNrSW1hZ2VIZWlnaHQpO1xuICAgIGNvbnN0IGJhY2tDdHggPSBiYWNrQ2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcbiAgICBpZiAoYmFja0N0eCA9PT0gbnVsbClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiMkQgY29udGV4dCBpcyBub3Qgc3VwcG9ydGVkXCIpO1xuICAgIGJhY2tDdHguaW1hZ2VTbW9vdGhpbmdFbmFibGVkID0gZmFsc2U7XG4gICAgY29uc3QgYmFja0J1ZmZlckFycmF5ID0gbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KGJhY2tJbWFnZVdpZHRoICogYmFja0ltYWdlSGVpZ2h0ICogNCk7XG4gICAgY29uc3QgZGlzcGxheSA9IHtcbiAgICAgICAgY3R4LFxuICAgICAgICBiYWNrQ3R4LFxuICAgICAgICBiYWNrQnVmZmVyQXJyYXksXG4gICAgICAgIGJhY2tJbWFnZVdpZHRoLFxuICAgICAgICBiYWNrSW1hZ2VIZWlnaHQsXG4gICAgfTtcbiAgICBsZXQgcHJldlRpbWVzdGFtcCA9IDA7XG4gICAgY29uc3QgZnJhbWUgPSAodGltZXN0YW1wKSA9PiB7XG4gICAgICAgIGN0eC5jYW52YXMud2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcbiAgICAgICAgY3R4LmNhbnZhcy5oZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gICAgICAgIGNvbnN0IGRlbHRhVGltZSA9ICh0aW1lc3RhbXAgLSBwcmV2VGltZXN0YW1wKTtcbiAgICAgICAgcHJldlRpbWVzdGFtcCA9IHRpbWVzdGFtcDtcbiAgICAgICAgLy8gVE9ETyBEb24ndCBuZWVkIGRlbHRhIHRpbWUsIGJvaWQgdGhpbmcgZG9zZSBpdCBmb3IgdXM/IGNoYW5nZT9cbiAgICAgICAgY29uc3Qgc3RhcnRUaW1lID0gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgICAgIHJlbmRlckJvaWRzKGRpc3BsYXksIGdvKTtcbiAgICAgICAgY29uc3QgZW5kVGltZSA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgICAgICAvLyBJbiBtc1xuICAgICAgICBjb25zdCByZW5kZXJUaW1lID0gZW5kVGltZSAtIHN0YXJ0VGltZTtcbiAgICAgICAgaWYgKGxvZ2dlcl8xLkRFQlVHX0RJU1BMQVkpXG4gICAgICAgICAgICByZW5kZXJEZWJ1Z0luZm8oZGlzcGxheSwgcmVuZGVyVGltZSwgZGVsdGFUaW1lKTtcbiAgICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShmcmFtZSk7XG4gICAgfTtcbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKCh0aW1lc3RhbXApID0+IHtcbiAgICAgICAgcHJldlRpbWVzdGFtcCA9IHRpbWVzdGFtcDtcbiAgICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShmcmFtZSk7XG4gICAgfSk7XG59KSgpO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9
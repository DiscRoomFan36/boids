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
exports.DEBUG_DISPLAY = false;
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
    }
}
function tag_prop_to_parts(prop) {
    const [left, right_] = prop.split(":");
    const right = right_.slice(1, right_.length - 1);
    return [left, right];
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
            default: throw new Error(`Unknown prop type ${prop_type}`);
        }
        tag_split.shift();
        while (tag_split.length > 0) {
            const [left, right] = tag_prop_to_parts(tag_split[0]);
            tag_split.shift();
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
                        case Property_Type.Property_Float:
                            property_struct.float_default = parseFloat(right);
                            break;
                        case Property_Type.Property_Int:
                            property_struct.int_default = parseInt(right);
                            break;
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
        const paragraph_text = `${name.replace(/_/g, " ")}`;
        var initial_value;
        var initial_value_for_text;
        switch (property_struct.property_type) {
            case Property_Type.Property_Float:
                initial_value = property_struct.float_default;
                initial_value_for_text = initial_value.toPrecision(2);
                break;
            case Property_Type.Property_Int:
                initial_value = property_struct.int_default;
                initial_value_for_text = initial_value;
                break;
            default: throw new Error(`Unknown type in 'initial value' ${name}`);
        }
        const map_range_to_slider_number = (x) => {
            switch (property_struct.property_type) {
                case Property_Type.Property_Float: {
                    const min = property_struct.float_range_min;
                    const max = property_struct.float_range_max;
                    return (x - min) / (max - min) * (1000 - 0) + 0;
                }
                case Property_Type.Property_Int: {
                    const min = property_struct.int_range_min;
                    const max = property_struct.int_range_max;
                    return (x - min) / (max - min) * (1000 - 0) + 0;
                }
                default: throw new Error(`Unknown type in 'map_range_to_slider_number' ${name}`);
            }
        };
        const map_range_to_real_range = (x) => {
            switch (property_struct.property_type) {
                case Property_Type.Property_Float: {
                    const min = property_struct.float_range_min;
                    const max = property_struct.float_range_max;
                    // TODO toPrecision might not be the best function for formatting. margin is being messed with (1.0e+2)
                    // make it the proper value // TODO is this correct? even for small values?
                    return parseFloat(((x - 0) / (1000 - 0) * (max - min) + min).toPrecision(2));
                }
                case Property_Type.Property_Int: {
                    const min = property_struct.int_range_min;
                    const max = property_struct.int_range_max;
                    // make it the proper value
                    return Math.floor((x - 0) / (1000 - 0) * (max - min) + min);
                }
                default: throw new Error(`Unknown type in 'map_range_to_real_range' ${name}`);
            }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUNBLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNENBQTRDLFVBQVU7QUFDdEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwQkFBMEIsU0FBUztBQUNuQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLGlDQUFpQztBQUN6RCxpQ0FBaUMsb0JBQW9CO0FBQ3JELHlDQUF5QyxxQkFBcUI7QUFDOUQscUNBQXFDLGtDQUFrQztBQUN2RTtBQUNBO0FBQ0Esb0JBQW9CLG1CQUFtQjtBQUN2QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMLENBQUMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9ib2lkcy8uL3dlYl9zcmMvbG9nZ2VyLnRzIiwid2VicGFjazovL2JvaWRzLy4vd2ViX3NyYy9zZXR1cF9zbGlkZXJzLnRzIiwid2VicGFjazovL2JvaWRzL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2JvaWRzLy4vd2ViX3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuTG9nX1R5cGUgPSBleHBvcnRzLkRFQlVHX1NMSURFUlMgPSBleHBvcnRzLkRFQlVHX0RJU1BMQVkgPSB2b2lkIDA7XG5leHBvcnRzLmxvZyA9IGxvZztcbmV4cG9ydHMuREVCVUdfRElTUExBWSA9IGZhbHNlO1xuZXhwb3J0cy5ERUJVR19TTElERVJTID0gZmFsc2U7XG52YXIgTG9nX1R5cGU7XG4oZnVuY3Rpb24gKExvZ19UeXBlKSB7XG4gICAgTG9nX1R5cGVbTG9nX1R5cGVbXCJHZW5lcmFsXCJdID0gMF0gPSBcIkdlbmVyYWxcIjtcbiAgICBMb2dfVHlwZVtMb2dfVHlwZVtcIkRlYnVnX0Rpc3BsYXlcIl0gPSAxXSA9IFwiRGVidWdfRGlzcGxheVwiO1xuICAgIExvZ19UeXBlW0xvZ19UeXBlW1wiRGVidWdfU2xpZGVyc1wiXSA9IDJdID0gXCJEZWJ1Z19TbGlkZXJzXCI7XG59KShMb2dfVHlwZSB8fCAoZXhwb3J0cy5Mb2dfVHlwZSA9IExvZ19UeXBlID0ge30pKTtcbmZ1bmN0aW9uIGxvZyhsb2dfdHlwZSwgLi4uZGF0YSkge1xuICAgIC8vIGlmIHRoaXMgaXMgdGhlIGVtcHR5IHN0cmluZ1xuICAgIHZhciBkb19sb2cgPSBmYWxzZTtcbiAgICB2YXIgbG9nX2hlYWRlciA9IFwiXCI7XG4gICAgc3dpdGNoIChsb2dfdHlwZSkge1xuICAgICAgICBjYXNlIExvZ19UeXBlLkdlbmVyYWw6XG4gICAgICAgICAgICBsb2dfaGVhZGVyID0gXCJcIjtcbiAgICAgICAgICAgIGRvX2xvZyA9IHRydWU7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBMb2dfVHlwZS5EZWJ1Z19EaXNwbGF5OlxuICAgICAgICAgICAgbG9nX2hlYWRlciA9IFwiREVCVUdfRElTUExBWVwiO1xuICAgICAgICAgICAgaWYgKGV4cG9ydHMuREVCVUdfRElTUExBWSlcbiAgICAgICAgICAgICAgICBkb19sb2cgPSB0cnVlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgTG9nX1R5cGUuRGVidWdfU2xpZGVyczpcbiAgICAgICAgICAgIGxvZ19oZWFkZXIgPSBcIkRFQlVHX1NMSURFUlNcIjtcbiAgICAgICAgICAgIGlmIChleHBvcnRzLkRFQlVHX1NMSURFUlMpXG4gICAgICAgICAgICAgICAgZG9fbG9nID0gdHJ1ZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBpZiAoZG9fbG9nKSB7XG4gICAgICAgIGlmIChsb2dfaGVhZGVyICE9IFwiXCIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGAke2xvZ19oZWFkZXJ9OiBgLCAuLi5kYXRhKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKC4uLmRhdGEpO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLnNldHVwX3NsaWRlcnMgPSBzZXR1cF9zbGlkZXJzO1xuY29uc3QgbG9nZ2VyXzEgPSByZXF1aXJlKFwiLi9sb2dnZXJcIik7XG52YXIgUHJvcGVydHlfVHlwZTtcbihmdW5jdGlvbiAoUHJvcGVydHlfVHlwZSkge1xuICAgIFByb3BlcnR5X1R5cGVbUHJvcGVydHlfVHlwZVtcIk5vbmVcIl0gPSAwXSA9IFwiTm9uZVwiO1xuICAgIFByb3BlcnR5X1R5cGVbUHJvcGVydHlfVHlwZVtcIlByb3BlcnR5X0Zsb2F0XCJdID0gMV0gPSBcIlByb3BlcnR5X0Zsb2F0XCI7XG4gICAgUHJvcGVydHlfVHlwZVtQcm9wZXJ0eV9UeXBlW1wiUHJvcGVydHlfSW50XCJdID0gMl0gPSBcIlByb3BlcnR5X0ludFwiO1xufSkoUHJvcGVydHlfVHlwZSB8fCAoUHJvcGVydHlfVHlwZSA9IHt9KSk7XG5jbGFzcyBQcm9wZXJ0eV9TdHJ1Y3Qge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnByb3BlcnR5X3R5cGUgPSBQcm9wZXJ0eV9UeXBlLk5vbmU7XG4gICAgICAgIC8vIEZsb2F0IHByb3BlcnRpZXNcbiAgICAgICAgdGhpcy5mbG9hdF9yYW5nZV9taW4gPSAwO1xuICAgICAgICB0aGlzLmZsb2F0X3JhbmdlX21heCA9IDA7XG4gICAgICAgIHRoaXMuZmxvYXRfZGVmYXVsdCA9IDA7XG4gICAgICAgIC8vIEludCBwcm9wZXJ0aWVzXG4gICAgICAgIHRoaXMuaW50X3JhbmdlX21pbiA9IDA7XG4gICAgICAgIHRoaXMuaW50X3JhbmdlX21heCA9IDA7XG4gICAgICAgIHRoaXMuaW50X2RlZmF1bHQgPSAwO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHRhZ19wcm9wX3RvX3BhcnRzKHByb3ApIHtcbiAgICBjb25zdCBbbGVmdCwgcmlnaHRfXSA9IHByb3Auc3BsaXQoXCI6XCIpO1xuICAgIGNvbnN0IHJpZ2h0ID0gcmlnaHRfLnNsaWNlKDEsIHJpZ2h0Xy5sZW5ndGggLSAxKTtcbiAgICByZXR1cm4gW2xlZnQsIHJpZ2h0XTtcbn1cbi8vIHB1dHMgc29tZSBzbGlkZXJzIHVwIHRvIGNvbnRyb2wgc29tZSBwYXJhbWV0ZXJzXG5mdW5jdGlvbiBzZXR1cF9zbGlkZXJzKHByb3BlcnRpZXMsIHNldF9wcm9wZXJ0eSkge1xuICAgIGNvbnN0IHNsaWRlcl9jb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNsaWRlQ29udGFpbmVyXCIpO1xuICAgIGlmIChzbGlkZXJfY29udGFpbmVyID09PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBHZXQgc2xpZGVyIGNvbnRhaW5lclwiKTtcbiAgICB9XG4gICAgLy8gVE9ETyBmb3IgdGhlIHNsaWRlcyB0aGF0IGhhdmUgYSBzbWFsbCByYW5nZSAobGlrZSBjb2hlc2lvbiBmYWN0b3IpIG1ha2UgdGhlIHZhbHVlIHRoZSBzcXVhcmUgb2YgdGhlIG51bWJlci5cbiAgICBwcm9wZXJ0aWVzLnNvcnQoKTsgLy8gaG9wZSBzb21lb25lIGVsc2Ugd2Fzbid0IHVzaW5nIHRoaXMuXG4gICAgZm9yIChjb25zdCBbbmFtZSwgdGFnXSBvZiBwcm9wZXJ0aWVzKSB7XG4gICAgICAgICgwLCBsb2dnZXJfMS5sb2cpKGxvZ2dlcl8xLkxvZ19UeXBlLkRlYnVnX1NsaWRlcnMsIGB0eXBlc2NyaXB0OiAke25hbWV9OiAke3RhZ31gKTtcbiAgICAgICAgLy8gVE9ETyB0aGlzIGZ1bmN0aW9uIGlzIGdyb3dpbmcgdG8gYmlnLCBwdXQgaXQgaW4gYSBzZXBhcmF0ZSBmaWxlLlxuICAgICAgICBjb25zdCB0YWdfc3BsaXQgPSB0YWcuc3BsaXQoXCIgXCIpO1xuICAgICAgICBjb25zdCBbcHJvcF9wcm9wZXJ0eSwgcHJvcF90eXBlXSA9IHRhZ19wcm9wX3RvX3BhcnRzKHRhZ19zcGxpdFswXSk7XG4gICAgICAgIGlmIChwcm9wX3Byb3BlcnR5ICE9IFwiUHJvcGVydHlcIilcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRmlyc3QgcHJvcGVydHkgaXMgbm90IHByb3BlcnR5LCB0YWcgd2FzICR7dGFnfWApO1xuICAgICAgICBjb25zdCBwcm9wZXJ0eV9zdHJ1Y3QgPSBuZXcgUHJvcGVydHlfU3RydWN0KCk7XG4gICAgICAgIHN3aXRjaCAocHJvcF90eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFwiZmxvYXRcIjpcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eV9zdHJ1Y3QucHJvcGVydHlfdHlwZSA9IFByb3BlcnR5X1R5cGUuUHJvcGVydHlfRmxvYXQ7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiaW50XCI6XG4gICAgICAgICAgICAgICAgcHJvcGVydHlfc3RydWN0LnByb3BlcnR5X3R5cGUgPSBQcm9wZXJ0eV9UeXBlLlByb3BlcnR5X0ludDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvcihgVW5rbm93biBwcm9wIHR5cGUgJHtwcm9wX3R5cGV9YCk7XG4gICAgICAgIH1cbiAgICAgICAgdGFnX3NwbGl0LnNoaWZ0KCk7XG4gICAgICAgIHdoaWxlICh0YWdfc3BsaXQubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29uc3QgW2xlZnQsIHJpZ2h0XSA9IHRhZ19wcm9wX3RvX3BhcnRzKHRhZ19zcGxpdFswXSk7XG4gICAgICAgICAgICB0YWdfc3BsaXQuc2hpZnQoKTtcbiAgICAgICAgICAgIHN3aXRjaCAobGVmdCkge1xuICAgICAgICAgICAgICAgIGNhc2UgXCJSYW5nZVwiOlxuICAgICAgICAgICAgICAgICAgICBjb25zdCBbbWluX3MsIG1heF9zXSA9IHJpZ2h0LnNwbGl0KFwiO1wiKTtcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChwcm9wZXJ0eV9zdHJ1Y3QucHJvcGVydHlfdHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBQcm9wZXJ0eV9UeXBlLlByb3BlcnR5X0Zsb2F0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5X3N0cnVjdC5mbG9hdF9yYW5nZV9taW4gPSBwYXJzZUZsb2F0KG1pbl9zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eV9zdHJ1Y3QuZmxvYXRfcmFuZ2VfbWF4ID0gcGFyc2VGbG9hdChtYXhfcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFByb3BlcnR5X1R5cGUuUHJvcGVydHlfSW50OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5X3N0cnVjdC5pbnRfcmFuZ2VfbWluID0gcGFyc2VJbnQobWluX3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5X3N0cnVjdC5pbnRfcmFuZ2VfbWF4ID0gcGFyc2VJbnQobWF4X3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIHR5cGUgaW4gJHtuYW1lfWApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJEZWZhdWx0XCI6XG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAocHJvcGVydHlfc3RydWN0LnByb3BlcnR5X3R5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgUHJvcGVydHlfVHlwZS5Qcm9wZXJ0eV9GbG9hdDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eV9zdHJ1Y3QuZmxvYXRfZGVmYXVsdCA9IHBhcnNlRmxvYXQocmlnaHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBQcm9wZXJ0eV9UeXBlLlByb3BlcnR5X0ludDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eV9zdHJ1Y3QuaW50X2RlZmF1bHQgPSBwYXJzZUludChyaWdodCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gdHlwZSBpbiAke25hbWV9YCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIHByb3BlcnR5ICR7bGVmdH1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBUT0RPIHNvbWUgd2F5IHRvIHByaW50IGFuIG9iamVjdC5cbiAgICAgICAgLy8gbG9nKExvZ19UeXBlLkRlYnVnX1NsaWRlcnMsIGBwcm9wZXJ0eSBzdHJ1Y3QgJHtwcm9wZXJ0eV9zdHJ1Y3R9YCk7XG4gICAgICAgIGNvbnN0IGlkID0gYHNsaWRlcl8ke25hbWV9YDtcbiAgICAgICAgY29uc3QgcGFyYV9pZCA9IGAke2lkfV9wYXJhZ3JhcGhgO1xuICAgICAgICBjb25zdCBwYXJhZ3JhcGhfdGV4dCA9IGAke25hbWUucmVwbGFjZSgvXy9nLCBcIiBcIil9YDtcbiAgICAgICAgdmFyIGluaXRpYWxfdmFsdWU7XG4gICAgICAgIHZhciBpbml0aWFsX3ZhbHVlX2Zvcl90ZXh0O1xuICAgICAgICBzd2l0Y2ggKHByb3BlcnR5X3N0cnVjdC5wcm9wZXJ0eV90eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFByb3BlcnR5X1R5cGUuUHJvcGVydHlfRmxvYXQ6XG4gICAgICAgICAgICAgICAgaW5pdGlhbF92YWx1ZSA9IHByb3BlcnR5X3N0cnVjdC5mbG9hdF9kZWZhdWx0O1xuICAgICAgICAgICAgICAgIGluaXRpYWxfdmFsdWVfZm9yX3RleHQgPSBpbml0aWFsX3ZhbHVlLnRvUHJlY2lzaW9uKDIpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBQcm9wZXJ0eV9UeXBlLlByb3BlcnR5X0ludDpcbiAgICAgICAgICAgICAgICBpbml0aWFsX3ZhbHVlID0gcHJvcGVydHlfc3RydWN0LmludF9kZWZhdWx0O1xuICAgICAgICAgICAgICAgIGluaXRpYWxfdmFsdWVfZm9yX3RleHQgPSBpbml0aWFsX3ZhbHVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIHR5cGUgaW4gJ2luaXRpYWwgdmFsdWUnICR7bmFtZX1gKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBtYXBfcmFuZ2VfdG9fc2xpZGVyX251bWJlciA9ICh4KSA9PiB7XG4gICAgICAgICAgICBzd2l0Y2ggKHByb3BlcnR5X3N0cnVjdC5wcm9wZXJ0eV90eXBlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSBQcm9wZXJ0eV9UeXBlLlByb3BlcnR5X0Zsb2F0OiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1pbiA9IHByb3BlcnR5X3N0cnVjdC5mbG9hdF9yYW5nZV9taW47XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1heCA9IHByb3BlcnR5X3N0cnVjdC5mbG9hdF9yYW5nZV9tYXg7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoeCAtIG1pbikgLyAobWF4IC0gbWluKSAqICgxMDAwIC0gMCkgKyAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXNlIFByb3BlcnR5X1R5cGUuUHJvcGVydHlfSW50OiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1pbiA9IHByb3BlcnR5X3N0cnVjdC5pbnRfcmFuZ2VfbWluO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXggPSBwcm9wZXJ0eV9zdHJ1Y3QuaW50X3JhbmdlX21heDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICh4IC0gbWluKSAvIChtYXggLSBtaW4pICogKDEwMDAgLSAwKSArIDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvcihgVW5rbm93biB0eXBlIGluICdtYXBfcmFuZ2VfdG9fc2xpZGVyX251bWJlcicgJHtuYW1lfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBtYXBfcmFuZ2VfdG9fcmVhbF9yYW5nZSA9ICh4KSA9PiB7XG4gICAgICAgICAgICBzd2l0Y2ggKHByb3BlcnR5X3N0cnVjdC5wcm9wZXJ0eV90eXBlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSBQcm9wZXJ0eV9UeXBlLlByb3BlcnR5X0Zsb2F0OiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1pbiA9IHByb3BlcnR5X3N0cnVjdC5mbG9hdF9yYW5nZV9taW47XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1heCA9IHByb3BlcnR5X3N0cnVjdC5mbG9hdF9yYW5nZV9tYXg7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE8gdG9QcmVjaXNpb24gbWlnaHQgbm90IGJlIHRoZSBiZXN0IGZ1bmN0aW9uIGZvciBmb3JtYXR0aW5nLiBtYXJnaW4gaXMgYmVpbmcgbWVzc2VkIHdpdGggKDEuMGUrMilcbiAgICAgICAgICAgICAgICAgICAgLy8gbWFrZSBpdCB0aGUgcHJvcGVyIHZhbHVlIC8vIFRPRE8gaXMgdGhpcyBjb3JyZWN0PyBldmVuIGZvciBzbWFsbCB2YWx1ZXM/XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZUZsb2F0KCgoeCAtIDApIC8gKDEwMDAgLSAwKSAqIChtYXggLSBtaW4pICsgbWluKS50b1ByZWNpc2lvbigyKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhc2UgUHJvcGVydHlfVHlwZS5Qcm9wZXJ0eV9JbnQ6IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWluID0gcHJvcGVydHlfc3RydWN0LmludF9yYW5nZV9taW47XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1heCA9IHByb3BlcnR5X3N0cnVjdC5pbnRfcmFuZ2VfbWF4O1xuICAgICAgICAgICAgICAgICAgICAvLyBtYWtlIGl0IHRoZSBwcm9wZXIgdmFsdWVcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IoKHggLSAwKSAvICgxMDAwIC0gMCkgKiAobWF4IC0gbWluKSArIG1pbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvcihgVW5rbm93biB0eXBlIGluICdtYXBfcmFuZ2VfdG9fcmVhbF9yYW5nZScgJHtuYW1lfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICAvLyBUT0RPIGEgbG90IG9mIG51bWJlcnMgbXVzdCBiZSBiZXR3ZWVuIDAtMSwgYmVjYXVzZSBzbGlkZXJzIG9ubHkgdXNlIGludHMgKGxvb2sgdXAgaWYgdGhpcyBpcyB0aGUgY2FzZS4pIHdlIHdpbGwgaGF2ZSB0byBnZXQgY3JlYXRpdmVcbiAgICAgICAgLy8gVE9ETyB1c2Ugc3RlcC4gbWlnaHQgY2xlYW4gdGhpcyB1cCBhIGJpdC5cbiAgICAgICAgY29uc3QgaHRtbF9zdHJpbmcgPSBgXG4gICAgICAgICAgICA8cCBjbGFzcz1cInNsaWRlcktleVwiIGlkPVwiJHtwYXJhX2lkfVwiPlxuICAgICAgICAgICAgICAgICR7cGFyYWdyYXBoX3RleHR9OiAke2luaXRpYWxfdmFsdWVfZm9yX3RleHR9XG4gICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhbmdlXCIgbWluPVwiMFwiIG1heD1cIjEwMDBcIiB2YWx1ZT1cIiR7bWFwX3JhbmdlX3RvX3NsaWRlcl9udW1iZXIoaW5pdGlhbF92YWx1ZSl9XCIgY2xhc3M9XCJzbGlkZXJcIiBpZD1cIiR7aWR9XCI+XG4gICAgICAgICAgICBgO1xuICAgICAgICBjb25zdCBuZXdfdGhpbmcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICBuZXdfdGhpbmcuY2xhc3NOYW1lID0gXCJyYW5nZUhvbGRlclwiO1xuICAgICAgICBuZXdfdGhpbmcuaW5uZXJIVE1MID0gaHRtbF9zdHJpbmc7XG4gICAgICAgIHNsaWRlcl9jb250YWluZXIuYXBwZW5kQ2hpbGQobmV3X3RoaW5nKTtcbiAgICAgICAgY29uc3Qgc2xpZGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICAgICAgICBpZiAoc2xpZGVyID09PSBudWxsKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ291bGQgbm90IGZpbmQgdGhlIHNsaWRlclwiKTtcbiAgICAgICAgc2xpZGVyLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHNsaWRlcl92YWx1ZV9zdHJpbmcgPSBldmVudC50YXJnZXQudmFsdWU7XG4gICAgICAgICAgICBjb25zdCBzbGlkZXJfbnVtYmVyID0gbWFwX3JhbmdlX3RvX3JlYWxfcmFuZ2UoTnVtYmVyKHNsaWRlcl92YWx1ZV9zdHJpbmcpKTtcbiAgICAgICAgICAgIGNvbnN0IHNsaWRlcl90ZXh0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQocGFyYV9pZCk7XG4gICAgICAgICAgICBpZiAoc2xpZGVyX3RleHQgPT09IG51bGwpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBjb3VsZCBub3QgZmluZCBzbGlkZXJfdGV4dCAke3BhcmFfaWR9YCk7XG4gICAgICAgICAgICBzbGlkZXJfdGV4dC50ZXh0Q29udGVudCA9IGAke3BhcmFncmFwaF90ZXh0fTogJHtzbGlkZXJfbnVtYmVyfWA7XG4gICAgICAgICAgICBzZXRfcHJvcGVydHkobmFtZSwgc2xpZGVyX251bWJlcik7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCJcInVzZSBzdHJpY3RcIjtcbi8vIHR5cGVzY3JpcHQgZ2x1ZSBjb2RlLlxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuY29uc3QgbG9nZ2VyXzEgPSByZXF1aXJlKFwiLi9sb2dnZXJcIik7XG5jb25zdCBzZXR1cF9zbGlkZXJzXzEgPSByZXF1aXJlKFwiLi9zZXR1cF9zbGlkZXJzXCIpO1xuLy8gTk9URSB3ZSBrZWVwIHRoZSBAdHMtaWdub3JlJ3MgaW4gaGVyZVxuYXN5bmMgZnVuY3Rpb24gR2V0R29GdW5jdGlvbnMoKSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGNvbnN0IGdvID0gbmV3IEdvKCk7IC8vIE5PVEUgdGhpcyBjb21lcyBmcm9tIHRoZSB3YXNtX2V4ZWMuanMgdGhpbmdcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBXZWJBc3NlbWJseS5pbnN0YW50aWF0ZVN0cmVhbWluZyhmZXRjaChcImRpc3QvYm9pZC53YXNtXCIpLCBnby5pbXBvcnRPYmplY3QpO1xuICAgIGdvLnJ1bihyZXN1bHQuaW5zdGFuY2UpO1xuICAgIHJldHVybiB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgU2V0UHJvcGVydGllczogU2V0UHJvcGVydGllcyxcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBHZXRQcm9wZXJ0aWVzOiBHZXRQcm9wZXJ0aWVzLFxuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIEdldE5leHRGcmFtZTogR2V0TmV4dEZyYW1lLFxuICAgIH07XG59XG5jb25zdCBOVU1fQ09MT1JfQ09NUE9ORU5UUyA9IDQ7XG5jb25zdCBTUVVJU0hfRkFDVE9SID0gMTtcbmZ1bmN0aW9uIHJlbmRlckJvaWRzKGRpc3BsYXksIGdvKSB7XG4gICAgY29uc3Qgd2lkdGggPSBNYXRoLmZsb29yKGRpc3BsYXkuY3R4LmNhbnZhcy53aWR0aCAvIFNRVUlTSF9GQUNUT1IpO1xuICAgIGNvbnN0IGhlaWdodCA9IE1hdGguZmxvb3IoZGlzcGxheS5jdHguY2FudmFzLmhlaWdodCAvIFNRVUlTSF9GQUNUT1IpO1xuICAgIGNvbnN0IGJ1ZmZlcl9zaXplID0gd2lkdGggKiBoZWlnaHQgKiBOVU1fQ09MT1JfQ09NUE9ORU5UUztcbiAgICBpZiAoZGlzcGxheS5iYWNrSW1hZ2VXaWR0aCAhPT0gd2lkdGggfHwgZGlzcGxheS5iYWNrSW1hZ2VIZWlnaHQgIT09IGhlaWdodCkge1xuICAgICAgICAoMCwgbG9nZ2VyXzEubG9nKShsb2dnZXJfMS5Mb2dfVHlwZS5HZW5lcmFsLCBcIk9oIGdvZC4gd2VyZSByZXNpemluZyB0aGUgYnVmZmVyXCIpO1xuICAgICAgICBpZiAoZGlzcGxheS5iYWNrQnVmZmVyQXJyYXkubGVuZ3RoIDwgYnVmZmVyX3NpemUpIHtcbiAgICAgICAgICAgIC8vIG1ha2UgdGhlIGJ1ZmZlciBiaWdnZXJcbiAgICAgICAgICAgIGRpc3BsYXkuYmFja0J1ZmZlckFycmF5ID0gbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KGJ1ZmZlcl9zaXplKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBiYWNrQ2FudmFzID0gbmV3IE9mZnNjcmVlbkNhbnZhcyh3aWR0aCwgaGVpZ2h0KTtcbiAgICAgICAgY29uc3QgYmFja0N0eCA9IGJhY2tDYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpO1xuICAgICAgICBpZiAoYmFja0N0eCA9PT0gbnVsbClcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIjJEIGNvbnRleHQgaXMgbm90IHN1cHBvcnRlZFwiKTtcbiAgICAgICAgZGlzcGxheS5iYWNrQ3R4ID0gYmFja0N0eDtcbiAgICAgICAgZGlzcGxheS5iYWNrQ3R4LmltYWdlU21vb3RoaW5nRW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICBkaXNwbGF5LmJhY2tJbWFnZVdpZHRoID0gd2lkdGg7XG4gICAgICAgIGRpc3BsYXkuYmFja0ltYWdlSGVpZ2h0ID0gaGVpZ2h0O1xuICAgIH1cbiAgICBjb25zdCBidWZmZXIgPSBkaXNwbGF5LmJhY2tCdWZmZXJBcnJheS5zdWJhcnJheSgwLCBidWZmZXJfc2l6ZSk7XG4gICAgY29uc3QgbnVtRmlsbGVkID0gZ28uR2V0TmV4dEZyYW1lKHdpZHRoLCBoZWlnaHQsIGJ1ZmZlcik7XG4gICAgaWYgKG51bUZpbGxlZCAhPT0gYnVmZmVyX3NpemUpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgR2V0TmV4dEZyYW1lIGdvdCAke251bUZpbGxlZH1gKTtcbiAgICBjb25zdCBpbWFnZURhdGEgPSBuZXcgSW1hZ2VEYXRhKGJ1ZmZlciwgd2lkdGgsIGhlaWdodCk7XG4gICAgLy8gaXMgdGhpcyBjb29sP1xuICAgIGRpc3BsYXkuYmFja0N0eC5wdXRJbWFnZURhdGEoaW1hZ2VEYXRhLCAwLCAwKTtcbiAgICAvLyBOT1RFIHRoaXMgd2lsbCBzdHJldGNoIHRoZSB0aGluZy5cbiAgICAvLyBjYW52YXMud2lkdGggbWlnaHQgY2hhbmdlIGR1cmluZyB0aGUgdGltZSB0aGlzIGlzIHJ1bm5pbmdcbiAgICBkaXNwbGF5LmN0eC5kcmF3SW1hZ2UoZGlzcGxheS5iYWNrQ3R4LmNhbnZhcywgMCwgMCwgZGlzcGxheS5jdHguY2FudmFzLndpZHRoLCBkaXNwbGF5LmN0eC5jYW52YXMuaGVpZ2h0KTtcbiAgICAvLyBpbWFnZURhdGEgPSBudWxsXG59XG5jb25zdCByZW5kZXJUaW1lcyA9IFtdO1xuY29uc3QgZGVsdGFUaW1lcyA9IFtdO1xuLy8gQ3JlZGl0OiBodHRwczovL2dpdGh1Yi5jb20vdHNvZGluZy9rb2lsXG5mdW5jdGlvbiByZW5kZXJEZWJ1Z0luZm8oZGlzcGxheSwgcmVuZGVyVGltZSwgZGVsdGFUaW1lKSB7XG4gICAgY29uc3QgZm9udFNpemUgPSAyODtcbiAgICBkaXNwbGF5LmN0eC5mb250ID0gYCR7Zm9udFNpemV9cHggYm9sZGA7XG4gICAgY29uc3QgbGFiZWxzID0gW107XG4gICAgcmVuZGVyVGltZXMucHVzaChyZW5kZXJUaW1lKTtcbiAgICBpZiAocmVuZGVyVGltZXMubGVuZ3RoID4gNjApIHtcbiAgICAgICAgcmVuZGVyVGltZXMuc2hpZnQoKTtcbiAgICB9XG4gICAgZGVsdGFUaW1lcy5wdXNoKGRlbHRhVGltZSk7XG4gICAgaWYgKGRlbHRhVGltZXMubGVuZ3RoID4gNjApIHtcbiAgICAgICAgZGVsdGFUaW1lcy5zaGlmdCgpO1xuICAgIH1cbiAgICBjb25zdCByZW5kZXJBdmcgPSByZW5kZXJUaW1lcy5yZWR1Y2UoKGEsIGIpID0+IGEgKyBiLCAwKSAvIHJlbmRlclRpbWVzLmxlbmd0aDtcbiAgICBjb25zdCBkZWx0YUF2ZyA9IGRlbHRhVGltZXMucmVkdWNlKChhLCBiKSA9PiBhICsgYiwgMCkgLyBkZWx0YVRpbWVzLmxlbmd0aDtcbiAgICBsYWJlbHMucHVzaChgRlBTOiAkeygxIC8gZGVsdGFBdmcgKiAxMDAwKS50b0ZpeGVkKDIpfWApO1xuICAgIGxhYmVscy5wdXNoKGBtcyBwZXIgZnJhbWU6ICR7ZGVsdGFBdmcudG9GaXhlZCgyKX1gKTtcbiAgICBsYWJlbHMucHVzaChgUmVuZGVyIFRpbWUgQXZnIChtcyk6ICR7cmVuZGVyQXZnLnRvRml4ZWQoMil9YCk7XG4gICAgbGFiZWxzLnB1c2goYFJlbmRlci9TZWMgKE1BWCk6ICR7KDEgLyByZW5kZXJBdmcgKiAxMDAwKS50b0ZpeGVkKDIpfWApO1xuICAgIGNvbnN0IHBhZGRpbmcgPSA3MDtcbiAgICBjb25zdCBzaGFkb3dPZmZzZXQgPSBmb250U2l6ZSAqIDAuMDY7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsYWJlbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZGlzcGxheS5jdHguZmlsbFN0eWxlID0gXCJibGFja1wiO1xuICAgICAgICBkaXNwbGF5LmN0eC5maWxsVGV4dChsYWJlbHNbaV0sIHBhZGRpbmcsIHBhZGRpbmcgKyBmb250U2l6ZSAqIGkpO1xuICAgICAgICBkaXNwbGF5LmN0eC5maWxsU3R5bGUgPSBcIndoaXRlXCI7XG4gICAgICAgIGRpc3BsYXkuY3R4LmZpbGxUZXh0KGxhYmVsc1tpXSwgcGFkZGluZyArIHNoYWRvd09mZnNldCwgcGFkZGluZyAtIHNoYWRvd09mZnNldCArIGZvbnRTaXplICogaSk7XG4gICAgfVxufVxuKGFzeW5jICgpID0+IHtcbiAgICBjb25zdCBnbyA9IGF3YWl0IEdldEdvRnVuY3Rpb25zKCk7XG4gICAgeyAvLyBIYW5kbGUgc2xpZGVyIHN0dWZmXG4gICAgICAgIGNvbnN0IHByb3BlcnRpZXMgPSBPYmplY3QuZW50cmllcyhnby5HZXRQcm9wZXJ0aWVzKCkpO1xuICAgICAgICBmdW5jdGlvbiBzZXRfcHJvcGVydHkobmFtZSwgdmFsdWUpIHtcbiAgICAgICAgICAgIC8vIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEyNzEwOTA1L2hvdy1kby1pLWR5bmFtaWNhbGx5LWFzc2lnbi1wcm9wZXJ0aWVzLXRvLWFuLW9iamVjdC1pbi10eXBlc2NyaXB0XG4gICAgICAgICAgICBjb25zdCBvYmogPSB7fTtcbiAgICAgICAgICAgIG9ialtuYW1lXSA9IHZhbHVlO1xuICAgICAgICAgICAgZ28uU2V0UHJvcGVydGllcyhvYmopO1xuICAgICAgICB9XG4gICAgICAgICgwLCBzZXR1cF9zbGlkZXJzXzEuc2V0dXBfc2xpZGVycykocHJvcGVydGllcywgc2V0X3Byb3BlcnR5KTtcbiAgICB9XG4gICAgY29uc3QgYm9pZENhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYm9pZF9jYW52YXNcIik7XG4gICAgaWYgKGJvaWRDYW52YXMgPT09IG51bGwpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vIGNhbnZhcyB3aXRoIGlkIGBib2lkX2NhbnZhc2AgaXMgZm91bmRcIik7XG4gICAgY29uc3QgY3R4ID0gYm9pZENhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XG4gICAgaWYgKGN0eCA9PT0gbnVsbClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiMkQgY29udGV4dCBpcyBub3Qgc3VwcG9ydGVkXCIpO1xuICAgIGN0eC5pbWFnZVNtb290aGluZ0VuYWJsZWQgPSBmYWxzZTtcbiAgICBjb25zdCBbYmFja0ltYWdlV2lkdGgsIGJhY2tJbWFnZUhlaWdodF0gPSBbY3R4LmNhbnZhcy53aWR0aCwgY3R4LmNhbnZhcy5oZWlnaHRdO1xuICAgIGNvbnN0IGJhY2tDYW52YXMgPSBuZXcgT2Zmc2NyZWVuQ2FudmFzKGJhY2tJbWFnZVdpZHRoLCBiYWNrSW1hZ2VIZWlnaHQpO1xuICAgIGNvbnN0IGJhY2tDdHggPSBiYWNrQ2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcbiAgICBpZiAoYmFja0N0eCA9PT0gbnVsbClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiMkQgY29udGV4dCBpcyBub3Qgc3VwcG9ydGVkXCIpO1xuICAgIGJhY2tDdHguaW1hZ2VTbW9vdGhpbmdFbmFibGVkID0gZmFsc2U7XG4gICAgY29uc3QgYmFja0J1ZmZlckFycmF5ID0gbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KGJhY2tJbWFnZVdpZHRoICogYmFja0ltYWdlSGVpZ2h0ICogNCk7XG4gICAgY29uc3QgZGlzcGxheSA9IHtcbiAgICAgICAgY3R4LFxuICAgICAgICBiYWNrQ3R4LFxuICAgICAgICBiYWNrQnVmZmVyQXJyYXksXG4gICAgICAgIGJhY2tJbWFnZVdpZHRoLFxuICAgICAgICBiYWNrSW1hZ2VIZWlnaHQsXG4gICAgfTtcbiAgICBsZXQgcHJldlRpbWVzdGFtcCA9IDA7XG4gICAgY29uc3QgZnJhbWUgPSAodGltZXN0YW1wKSA9PiB7XG4gICAgICAgIGN0eC5jYW52YXMud2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcbiAgICAgICAgY3R4LmNhbnZhcy5oZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gICAgICAgIGNvbnN0IGRlbHRhVGltZSA9ICh0aW1lc3RhbXAgLSBwcmV2VGltZXN0YW1wKTtcbiAgICAgICAgcHJldlRpbWVzdGFtcCA9IHRpbWVzdGFtcDtcbiAgICAgICAgLy8gVE9ETyBEb24ndCBuZWVkIGRlbHRhIHRpbWUsIGJvaWQgdGhpbmcgZG9zZSBpdCBmb3IgdXM/IGNoYW5nZT9cbiAgICAgICAgY29uc3Qgc3RhcnRUaW1lID0gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgICAgIHJlbmRlckJvaWRzKGRpc3BsYXksIGdvKTtcbiAgICAgICAgY29uc3QgZW5kVGltZSA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgICAgICAvLyBJbiBtc1xuICAgICAgICBjb25zdCByZW5kZXJUaW1lID0gZW5kVGltZSAtIHN0YXJ0VGltZTtcbiAgICAgICAgaWYgKGxvZ2dlcl8xLkRFQlVHX0RJU1BMQVkpXG4gICAgICAgICAgICByZW5kZXJEZWJ1Z0luZm8oZGlzcGxheSwgcmVuZGVyVGltZSwgZGVsdGFUaW1lKTtcbiAgICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShmcmFtZSk7XG4gICAgfTtcbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKCh0aW1lc3RhbXApID0+IHtcbiAgICAgICAgcHJldlRpbWVzdGFtcCA9IHRpbWVzdGFtcDtcbiAgICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShmcmFtZSk7XG4gICAgfSk7XG59KSgpO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9
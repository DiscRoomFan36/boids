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
// is it correct to have these here? this one effects
// drawing on the screen, not just logging? although we
// could make all logs appear on screen...
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
function get_header_rect_from_id(id) {
    const header = document.getElementById(id);
    if (header === null)
        throw new Error("no header text has been found (my name in the middle)");
    const dom_rect = header.getBoundingClientRect();
    return {
        x: dom_rect.x,
        y: dom_rect.y,
        width: dom_rect.width,
        height: dom_rect.height,
    };
}
function renderBoids(display, go) {
    // get the position of the title text on screen
    const header_rect = get_header_rect_from_id("my_name_in_the_middle");
    const not_my_passion_rect = get_header_rect_from_id("not_my_passion");
    // const rect = get_header_rect("my_name_in_the_middle")
    // console.log("rect", rect.x, rect.y, rect.width, rect.height);
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
        header_rect: header_rect,
        not_my_passion_rect: not_my_passion_rect,
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
    { // setup input handling.
        // why doesn't typescript have an enum for this?
        let mouse_buttons;
        (function (mouse_buttons) {
            mouse_buttons[mouse_buttons["MOUSE_LEFT"] = 0] = "MOUSE_LEFT";
            mouse_buttons[mouse_buttons["MOUSE_MIDDLE"] = 1] = "MOUSE_MIDDLE";
            mouse_buttons[mouse_buttons["MOUSE_RIGHT"] = 2] = "MOUSE_RIGHT";
        })(mouse_buttons || (mouse_buttons = {}));
        const root = document.getRootNode();
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
    }
    // const canvas_container = document.getElementById("canvas_div") as HTMLCanvasElement | null
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNENBQTRDLFVBQVU7QUFDdEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDBCQUEwQixTQUFTO0FBQ25DO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0IsaUNBQWlDO0FBQ3pELGlDQUFpQyxvQkFBb0I7QUFDckQseUNBQXlDLHFCQUFxQjtBQUM5RCxxQ0FBcUMsa0NBQWtDO0FBQ3ZFO0FBQ0E7QUFDQSxvQkFBb0IsbUJBQW1CO0FBQ3ZDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVMsc0NBQXNDO0FBQy9DO0FBQ0EscURBQXFELGNBQWMscUJBQXFCO0FBQ3hGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMLENBQUMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9ib2lkcy8uL3dlYl9zcmMvbG9nZ2VyLnRzIiwid2VicGFjazovL2JvaWRzLy4vd2ViX3NyYy9zZXR1cF9zbGlkZXJzLnRzIiwid2VicGFjazovL2JvaWRzL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2JvaWRzLy4vd2ViX3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuTG9nX1R5cGUgPSBleHBvcnRzLkRFQlVHX1NMSURFUlMgPSBleHBvcnRzLkRFQlVHX0RJU1BMQVkgPSB2b2lkIDA7XG5leHBvcnRzLmxvZyA9IGxvZztcbi8vIGlzIGl0IGNvcnJlY3QgdG8gaGF2ZSB0aGVzZSBoZXJlPyB0aGlzIG9uZSBlZmZlY3RzXG4vLyBkcmF3aW5nIG9uIHRoZSBzY3JlZW4sIG5vdCBqdXN0IGxvZ2dpbmc/IGFsdGhvdWdoIHdlXG4vLyBjb3VsZCBtYWtlIGFsbCBsb2dzIGFwcGVhciBvbiBzY3JlZW4uLi5cbmV4cG9ydHMuREVCVUdfRElTUExBWSA9IGZhbHNlO1xuZXhwb3J0cy5ERUJVR19TTElERVJTID0gZmFsc2U7XG52YXIgTG9nX1R5cGU7XG4oZnVuY3Rpb24gKExvZ19UeXBlKSB7XG4gICAgTG9nX1R5cGVbTG9nX1R5cGVbXCJHZW5lcmFsXCJdID0gMF0gPSBcIkdlbmVyYWxcIjtcbiAgICBMb2dfVHlwZVtMb2dfVHlwZVtcIkRlYnVnX0Rpc3BsYXlcIl0gPSAxXSA9IFwiRGVidWdfRGlzcGxheVwiO1xuICAgIExvZ19UeXBlW0xvZ19UeXBlW1wiRGVidWdfU2xpZGVyc1wiXSA9IDJdID0gXCJEZWJ1Z19TbGlkZXJzXCI7XG59KShMb2dfVHlwZSB8fCAoZXhwb3J0cy5Mb2dfVHlwZSA9IExvZ19UeXBlID0ge30pKTtcbmZ1bmN0aW9uIGxvZyhsb2dfdHlwZSwgLi4uZGF0YSkge1xuICAgIC8vIGlmIHRoaXMgaXMgdGhlIGVtcHR5IHN0cmluZ1xuICAgIHZhciBkb19sb2cgPSBmYWxzZTtcbiAgICB2YXIgbG9nX2hlYWRlciA9IFwiXCI7XG4gICAgc3dpdGNoIChsb2dfdHlwZSkge1xuICAgICAgICBjYXNlIExvZ19UeXBlLkdlbmVyYWw6XG4gICAgICAgICAgICBsb2dfaGVhZGVyID0gXCJcIjtcbiAgICAgICAgICAgIGRvX2xvZyA9IHRydWU7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBMb2dfVHlwZS5EZWJ1Z19EaXNwbGF5OlxuICAgICAgICAgICAgbG9nX2hlYWRlciA9IFwiREVCVUdfRElTUExBWVwiO1xuICAgICAgICAgICAgaWYgKGV4cG9ydHMuREVCVUdfRElTUExBWSlcbiAgICAgICAgICAgICAgICBkb19sb2cgPSB0cnVlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgTG9nX1R5cGUuRGVidWdfU2xpZGVyczpcbiAgICAgICAgICAgIGxvZ19oZWFkZXIgPSBcIkRFQlVHX1NMSURFUlNcIjtcbiAgICAgICAgICAgIGlmIChleHBvcnRzLkRFQlVHX1NMSURFUlMpXG4gICAgICAgICAgICAgICAgZG9fbG9nID0gdHJ1ZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBpZiAoZG9fbG9nKSB7XG4gICAgICAgIGlmIChsb2dfaGVhZGVyICE9IFwiXCIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGAke2xvZ19oZWFkZXJ9OiBgLCAuLi5kYXRhKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKC4uLmRhdGEpO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLnNldHVwX3NsaWRlcnMgPSBzZXR1cF9zbGlkZXJzO1xuY29uc3QgbG9nZ2VyXzEgPSByZXF1aXJlKFwiLi9sb2dnZXJcIik7XG52YXIgUHJvcGVydHlfVHlwZTtcbihmdW5jdGlvbiAoUHJvcGVydHlfVHlwZSkge1xuICAgIFByb3BlcnR5X1R5cGVbUHJvcGVydHlfVHlwZVtcIk5vbmVcIl0gPSAwXSA9IFwiTm9uZVwiO1xuICAgIFByb3BlcnR5X1R5cGVbUHJvcGVydHlfVHlwZVtcIlByb3BlcnR5X0Zsb2F0XCJdID0gMV0gPSBcIlByb3BlcnR5X0Zsb2F0XCI7XG4gICAgUHJvcGVydHlfVHlwZVtQcm9wZXJ0eV9UeXBlW1wiUHJvcGVydHlfSW50XCJdID0gMl0gPSBcIlByb3BlcnR5X0ludFwiO1xuICAgIFByb3BlcnR5X1R5cGVbUHJvcGVydHlfVHlwZVtcIlByb3BlcnR5X0Jvb2xcIl0gPSAzXSA9IFwiUHJvcGVydHlfQm9vbFwiO1xufSkoUHJvcGVydHlfVHlwZSB8fCAoUHJvcGVydHlfVHlwZSA9IHt9KSk7XG5jbGFzcyBQcm9wZXJ0eV9TdHJ1Y3Qge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnByb3BlcnR5X3R5cGUgPSBQcm9wZXJ0eV9UeXBlLk5vbmU7XG4gICAgICAgIC8vIEZsb2F0IHByb3BlcnRpZXNcbiAgICAgICAgdGhpcy5mbG9hdF9yYW5nZV9taW4gPSAwO1xuICAgICAgICB0aGlzLmZsb2F0X3JhbmdlX21heCA9IDA7XG4gICAgICAgIHRoaXMuZmxvYXRfZGVmYXVsdCA9IDA7XG4gICAgICAgIC8vIEludCBwcm9wZXJ0aWVzXG4gICAgICAgIHRoaXMuaW50X3JhbmdlX21pbiA9IDA7XG4gICAgICAgIHRoaXMuaW50X3JhbmdlX21heCA9IDA7XG4gICAgICAgIHRoaXMuaW50X2RlZmF1bHQgPSAwO1xuICAgICAgICB0aGlzLmJvb2xfZGVmYXVsdCA9IGZhbHNlO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHRhZ19wcm9wX3RvX3BhcnRzKHByb3ApIHtcbiAgICBjb25zdCBbbGVmdCwgcmlnaHRfXSA9IHByb3Auc3BsaXQoXCI6XCIpO1xuICAgIGNvbnN0IHJpZ2h0ID0gcmlnaHRfLnNsaWNlKDEsIHJpZ2h0Xy5sZW5ndGggLSAxKTtcbiAgICByZXR1cm4gW2xlZnQsIHJpZ2h0XTtcbn1cbmZ1bmN0aW9uIHBhcnNlQm9vbChzKSB7XG4gICAgLy8gMSwgdCwgVCwgVFJVRSwgdHJ1ZSwgVHJ1ZSxcbiAgICAvLyAwLCBmLCBGLCBGQUxTRSwgZmFsc2UsIEZhbHNlXG4gICAgc3dpdGNoIChzKSB7XG4gICAgICAgIGNhc2UgXCIxXCI6XG4gICAgICAgIGNhc2UgXCJ0XCI6XG4gICAgICAgIGNhc2UgXCJUXCI6XG4gICAgICAgIGNhc2UgXCJUUlVFXCI6XG4gICAgICAgIGNhc2UgXCJ0cnVlXCI6XG4gICAgICAgIGNhc2UgXCJUcnVlXCI6XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgY2FzZSBcIjBcIjpcbiAgICAgICAgY2FzZSBcImZcIjpcbiAgICAgICAgY2FzZSBcIkZcIjpcbiAgICAgICAgY2FzZSBcIkZBTFNFXCI6XG4gICAgICAgIGNhc2UgXCJmYWxzZVwiOlxuICAgICAgICBjYXNlIFwiRmFsc2VcIjpcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIHN0cmluZyBpbiBwYXJzZUJvb2wsIHdhcyAke3N9YCk7XG4gICAgfVxufVxuLy8gcHV0cyBzb21lIHNsaWRlcnMgdXAgdG8gY29udHJvbCBzb21lIHBhcmFtZXRlcnNcbmZ1bmN0aW9uIHNldHVwX3NsaWRlcnMocHJvcGVydGllcywgc2V0X3Byb3BlcnR5KSB7XG4gICAgY29uc3Qgc2xpZGVyX2NvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2xpZGVDb250YWluZXJcIik7XG4gICAgaWYgKHNsaWRlcl9jb250YWluZXIgPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IEdldCBzbGlkZXIgY29udGFpbmVyXCIpO1xuICAgIH1cbiAgICAvLyBUT0RPIGZvciB0aGUgc2xpZGVzIHRoYXQgaGF2ZSBhIHNtYWxsIHJhbmdlIChsaWtlIGNvaGVzaW9uIGZhY3RvcikgbWFrZSB0aGUgdmFsdWUgdGhlIHNxdWFyZSBvZiB0aGUgbnVtYmVyLlxuICAgIHByb3BlcnRpZXMuc29ydCgpOyAvLyBob3BlIHNvbWVvbmUgZWxzZSB3YXNuJ3QgdXNpbmcgdGhpcy5cbiAgICBmb3IgKGNvbnN0IFtuYW1lLCB0YWddIG9mIHByb3BlcnRpZXMpIHtcbiAgICAgICAgKDAsIGxvZ2dlcl8xLmxvZykobG9nZ2VyXzEuTG9nX1R5cGUuRGVidWdfU2xpZGVycywgYHR5cGVzY3JpcHQ6ICR7bmFtZX06ICR7dGFnfWApO1xuICAgICAgICAvLyBUT0RPIHRoaXMgZnVuY3Rpb24gaXMgZ3Jvd2luZyB0byBiaWcsIHB1dCBpdCBpbiBhIHNlcGFyYXRlIGZpbGUuXG4gICAgICAgIGNvbnN0IHRhZ19zcGxpdCA9IHRhZy5zcGxpdChcIiBcIik7XG4gICAgICAgIGNvbnN0IFtwcm9wX3Byb3BlcnR5LCBwcm9wX3R5cGVdID0gdGFnX3Byb3BfdG9fcGFydHModGFnX3NwbGl0WzBdKTtcbiAgICAgICAgaWYgKHByb3BfcHJvcGVydHkgIT0gXCJQcm9wZXJ0eVwiKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBGaXJzdCBwcm9wZXJ0eSBpcyBub3QgcHJvcGVydHksIHRhZyB3YXMgJHt0YWd9YCk7XG4gICAgICAgIGNvbnN0IHByb3BlcnR5X3N0cnVjdCA9IG5ldyBQcm9wZXJ0eV9TdHJ1Y3QoKTtcbiAgICAgICAgc3dpdGNoIChwcm9wX3R5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJmbG9hdFwiOlxuICAgICAgICAgICAgICAgIHByb3BlcnR5X3N0cnVjdC5wcm9wZXJ0eV90eXBlID0gUHJvcGVydHlfVHlwZS5Qcm9wZXJ0eV9GbG9hdDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJpbnRcIjpcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eV9zdHJ1Y3QucHJvcGVydHlfdHlwZSA9IFByb3BlcnR5X1R5cGUuUHJvcGVydHlfSW50O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcImJvb2xcIjpcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eV9zdHJ1Y3QucHJvcGVydHlfdHlwZSA9IFByb3BlcnR5X1R5cGUuUHJvcGVydHlfQm9vbDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvcihgVW5rbm93biBwcm9wIHR5cGUgJHtwcm9wX3R5cGV9YCk7XG4gICAgICAgIH1cbiAgICAgICAgdGFnX3NwbGl0LnNoaWZ0KCk7XG4gICAgICAgIHdoaWxlICh0YWdfc3BsaXQubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29uc3QgW2xlZnQsIHJpZ2h0XSA9IHRhZ19wcm9wX3RvX3BhcnRzKHRhZ19zcGxpdFswXSk7XG4gICAgICAgICAgICB0YWdfc3BsaXQuc2hpZnQoKTtcbiAgICAgICAgICAgIHN3aXRjaCAobGVmdCkge1xuICAgICAgICAgICAgICAgIGNhc2UgXCJSYW5nZVwiOlxuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHByb3BlcnR5X3N0cnVjdC5wcm9wZXJ0eV90eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFByb3BlcnR5X1R5cGUuUHJvcGVydHlfRmxvYXQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBbbWluX3MsIG1heF9zXSA9IHJpZ2h0LnNwbGl0KFwiO1wiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eV9zdHJ1Y3QuZmxvYXRfcmFuZ2VfbWluID0gcGFyc2VGbG9hdChtaW5fcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlfc3RydWN0LmZsb2F0X3JhbmdlX21heCA9IHBhcnNlRmxvYXQobWF4X3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBQcm9wZXJ0eV9UeXBlLlByb3BlcnR5X0ludDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IFttaW5fcywgbWF4X3NdID0gcmlnaHQuc3BsaXQoXCI7XCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5X3N0cnVjdC5pbnRfcmFuZ2VfbWluID0gcGFyc2VJbnQobWluX3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5X3N0cnVjdC5pbnRfcmFuZ2VfbWF4ID0gcGFyc2VJbnQobWF4X3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBQcm9wZXJ0eV9UeXBlLlByb3BlcnR5X0Jvb2w6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJCb29sZWFuIGRvc2Ugbm90IGhhdmUgYSByYW5nZSFcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gdHlwZSBpbiAke25hbWV9YCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIkRlZmF1bHRcIjpcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChwcm9wZXJ0eV9zdHJ1Y3QucHJvcGVydHlfdHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBQcm9wZXJ0eV9UeXBlLlByb3BlcnR5X0Zsb2F0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5X3N0cnVjdC5mbG9hdF9kZWZhdWx0ID0gcGFyc2VGbG9hdChyaWdodCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFByb3BlcnR5X1R5cGUuUHJvcGVydHlfSW50OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5X3N0cnVjdC5pbnRfZGVmYXVsdCA9IHBhcnNlSW50KHJpZ2h0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgUHJvcGVydHlfVHlwZS5Qcm9wZXJ0eV9Cb29sOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5X3N0cnVjdC5ib29sX2RlZmF1bHQgPSBwYXJzZUJvb2wocmlnaHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIHR5cGUgaW4gJHtuYW1lfWApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvcihgVW5rbm93biBwcm9wZXJ0eSAke2xlZnR9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gVE9ETyBzb21lIHdheSB0byBwcmludCBhbiBvYmplY3QuXG4gICAgICAgIC8vIGxvZyhMb2dfVHlwZS5EZWJ1Z19TbGlkZXJzLCBgcHJvcGVydHkgc3RydWN0ICR7cHJvcGVydHlfc3RydWN0fWApO1xuICAgICAgICBzd2l0Y2ggKHByb3BlcnR5X3N0cnVjdC5wcm9wZXJ0eV90eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFByb3BlcnR5X1R5cGUuUHJvcGVydHlfRmxvYXQ6XG4gICAgICAgICAgICAgICAgbWFrZV9mbG9hdF9zbGlkZXIoc2xpZGVyX2NvbnRhaW5lciwgbmFtZSwgcHJvcGVydHlfc3RydWN0LCBzZXRfcHJvcGVydHkpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBQcm9wZXJ0eV9UeXBlLlByb3BlcnR5X0ludDpcbiAgICAgICAgICAgICAgICBtYWtlX2ludF9zbGlkZXIoc2xpZGVyX2NvbnRhaW5lciwgbmFtZSwgcHJvcGVydHlfc3RydWN0LCBzZXRfcHJvcGVydHkpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBQcm9wZXJ0eV9UeXBlLlByb3BlcnR5X0Jvb2w6XG4gICAgICAgICAgICAgICAgbWFrZV9ib29sX3NsaWRlcihzbGlkZXJfY29udGFpbmVyLCBuYW1lLCBwcm9wZXJ0eV9zdHJ1Y3QsIHNldF9wcm9wZXJ0eSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OiB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gcHJvcGVydHkgdHlwZSAke3Byb3BlcnR5X3N0cnVjdC5wcm9wZXJ0eV90eXBlfWApO1xuICAgICAgICB9XG4gICAgfVxufVxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vICAgICAgICAgTWFrZSBhIHNsaWRlciBmb3IgYW4gZmxvYXRcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5mdW5jdGlvbiBtYWtlX2Zsb2F0X3NsaWRlcihzbGlkZXJfY29udGFpbmVyLCBuYW1lLCBwcm9wZXJ0eV9zdHJ1Y3QsIHNldF9wcm9wZXJ0eSkge1xuICAgIGNvbnN0IGlkID0gYHNsaWRlcl8ke25hbWV9YDtcbiAgICBjb25zdCBwYXJhX2lkID0gYCR7aWR9X3BhcmFncmFwaGA7XG4gICAgY29uc3QgcGFyYWdyYXBoX3RleHQgPSBgJHtuYW1lLnJlcGxhY2UoL18vZywgXCIgXCIpfWA7XG4gICAgY29uc3QgaHRtbF9zdHJpbmcgPSBgXG4gICAgICAgIDxwIGNsYXNzPVwic2xpZGVyS2V5XCIgaWQ9XCIke3BhcmFfaWR9XCI+XG4gICAgICAgICAgICAke3BhcmFncmFwaF90ZXh0fTogJHtwcm9wZXJ0eV9zdHJ1Y3QuZmxvYXRfZGVmYXVsdH1cbiAgICAgICAgPC9wPlxuICAgICAgICA8aW5wdXQgdHlwZT1cInJhbmdlXCIgbWluPVwiJHtwcm9wZXJ0eV9zdHJ1Y3QuZmxvYXRfcmFuZ2VfbWlufVwiIG1heD1cIiR7cHJvcGVydHlfc3RydWN0LmZsb2F0X3JhbmdlX21heH1cIiB2YWx1ZT1cIiR7cHJvcGVydHlfc3RydWN0LmZsb2F0X2RlZmF1bHR9XCIgc3RlcD1cIjAuMDA1XCIgY2xhc3M9XCJzbGlkZXJcIiBpZD1cIiR7aWR9XCI+XG4gICAgICAgIGA7XG4gICAgY29uc3QgbmV3X3RoaW5nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICBuZXdfdGhpbmcuY2xhc3NOYW1lID0gXCJyYW5nZUhvbGRlclwiO1xuICAgIG5ld190aGluZy5pbm5lckhUTUwgPSBodG1sX3N0cmluZztcbiAgICBzbGlkZXJfY29udGFpbmVyLmFwcGVuZENoaWxkKG5ld190aGluZyk7XG4gICAgY29uc3Qgc2xpZGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICAgIGlmIChzbGlkZXIgPT09IG51bGwpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvdWxkIG5vdCBmaW5kIHRoZSBzbGlkZXJcIik7XG4gICAgc2xpZGVyLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgY29uc3Qgc2xpZGVyX3ZhbHVlX3N0cmluZyA9IGV2ZW50LnRhcmdldC52YWx1ZTtcbiAgICAgICAgY29uc3Qgc2xpZGVyX251bWJlciA9IE51bWJlcihzbGlkZXJfdmFsdWVfc3RyaW5nKTtcbiAgICAgICAgY29uc3Qgc2xpZGVyX3RleHQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChwYXJhX2lkKTtcbiAgICAgICAgaWYgKHNsaWRlcl90ZXh0ID09PSBudWxsKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBjb3VsZCBub3QgZmluZCBzbGlkZXJfdGV4dCAke3BhcmFfaWR9YCk7XG4gICAgICAgIHNsaWRlcl90ZXh0LnRleHRDb250ZW50ID0gYCR7cGFyYWdyYXBoX3RleHR9OiAke3NsaWRlcl9udW1iZXJ9YDtcbiAgICAgICAgc2V0X3Byb3BlcnR5KG5hbWUsIHNsaWRlcl9udW1iZXIpO1xuICAgIH0pO1xufVxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vICAgICAgICAgIE1ha2UgYSBzbGlkZXIgZm9yIGFuIGludFxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbmZ1bmN0aW9uIG1ha2VfaW50X3NsaWRlcihzbGlkZXJfY29udGFpbmVyLCBuYW1lLCBwcm9wZXJ0eV9zdHJ1Y3QsIHNldF9wcm9wZXJ0eSkge1xuICAgIGNvbnN0IGlkID0gYHNsaWRlcl8ke25hbWV9YDtcbiAgICBjb25zdCBwYXJhX2lkID0gYCR7aWR9X3BhcmFncmFwaGA7XG4gICAgY29uc3QgcGFyYWdyYXBoX3RleHQgPSBgJHtuYW1lLnJlcGxhY2UoL18vZywgXCIgXCIpfWA7XG4gICAgY29uc3QgaHRtbF9zdHJpbmcgPSBgXG4gICAgICAgIDxwIGNsYXNzPVwic2xpZGVyS2V5XCIgaWQ9XCIke3BhcmFfaWR9XCI+XG4gICAgICAgICAgICAke3BhcmFncmFwaF90ZXh0fTogJHtwcm9wZXJ0eV9zdHJ1Y3QuaW50X2RlZmF1bHR9XG4gICAgICAgIDwvcD5cbiAgICAgICAgPGlucHV0IHR5cGU9XCJyYW5nZVwiIG1pbj1cIiR7cHJvcGVydHlfc3RydWN0LmludF9yYW5nZV9taW59XCIgbWF4PVwiJHtwcm9wZXJ0eV9zdHJ1Y3QuaW50X3JhbmdlX21heH1cIiB2YWx1ZT1cIiR7cHJvcGVydHlfc3RydWN0LmludF9kZWZhdWx0fVwiIGNsYXNzPVwic2xpZGVyXCIgaWQ9XCIke2lkfVwiPlxuICAgICAgICBgO1xuICAgIGNvbnN0IG5ld190aGluZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgbmV3X3RoaW5nLmNsYXNzTmFtZSA9IFwicmFuZ2VIb2xkZXJcIjtcbiAgICBuZXdfdGhpbmcuaW5uZXJIVE1MID0gaHRtbF9zdHJpbmc7XG4gICAgc2xpZGVyX2NvbnRhaW5lci5hcHBlbmRDaGlsZChuZXdfdGhpbmcpO1xuICAgIGNvbnN0IHNsaWRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcbiAgICBpZiAoc2xpZGVyID09PSBudWxsKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb3VsZCBub3QgZmluZCB0aGUgc2xpZGVyXCIpO1xuICAgIHNsaWRlci5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgIGNvbnN0IHNsaWRlcl92YWx1ZV9zdHJpbmcgPSBldmVudC50YXJnZXQudmFsdWU7XG4gICAgICAgIGNvbnN0IHNsaWRlcl9udW1iZXIgPSBOdW1iZXIoc2xpZGVyX3ZhbHVlX3N0cmluZyk7XG4gICAgICAgIGNvbnN0IHNsaWRlcl90ZXh0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQocGFyYV9pZCk7XG4gICAgICAgIGlmIChzbGlkZXJfdGV4dCA9PT0gbnVsbClcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgY291bGQgbm90IGZpbmQgc2xpZGVyX3RleHQgJHtwYXJhX2lkfWApO1xuICAgICAgICBzbGlkZXJfdGV4dC50ZXh0Q29udGVudCA9IGAke3BhcmFncmFwaF90ZXh0fTogJHtzbGlkZXJfbnVtYmVyfWA7XG4gICAgICAgIHNldF9wcm9wZXJ0eShuYW1lLCBzbGlkZXJfbnVtYmVyKTtcbiAgICB9KTtcbn1cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyAgICAgTWFrZSBhIHNsaWRlciBmb3IgYW4gYm9vbGVhbiB0b2dnbGVcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5mdW5jdGlvbiBtYWtlX2Jvb2xfc2xpZGVyKHNsaWRlcl9jb250YWluZXIsIG5hbWUsIHByb3BlcnR5X3N0cnVjdCwgc2V0X3Byb3BlcnR5KSB7XG4gICAgY29uc3QgaWQgPSBgc2xpZGVyXyR7bmFtZX1gO1xuICAgIGNvbnN0IHBhcmFncmFwaF90ZXh0ID0gYCR7bmFtZS5yZXBsYWNlKC9fL2csIFwiIFwiKX1gO1xuICAgIGNvbnN0IGh0bWxfc3RyaW5nID0gYFxuICAgICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgJHtwcm9wZXJ0eV9zdHJ1Y3QuYm9vbF9kZWZhdWx0ID8gXCJjaGVja2VkXCIgOiBcIlwifSBjbGFzcz1cImNoZWNrYm94X3RvZ2dsZVwiIGlkPVwiJHtpZH1cIj5cbiAgICAgICAgPGxhYmVsIGZvcj1cIiR7aWR9XCIgY2xhc3M9XCJjaGVja2JveF90b2dnbGVfbGFiZWxcIj4ke3BhcmFncmFwaF90ZXh0fTwvbGFiZWw+XG4gICAgICAgIGA7XG4gICAgY29uc3QgbmV3X3RoaW5nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICBuZXdfdGhpbmcuY2xhc3NOYW1lID0gXCJyYW5nZUhvbGRlclwiO1xuICAgIG5ld190aGluZy5pbm5lckhUTUwgPSBodG1sX3N0cmluZztcbiAgICBzbGlkZXJfY29udGFpbmVyLmFwcGVuZENoaWxkKG5ld190aGluZyk7XG4gICAgY29uc3Qgc2xpZGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICAgIGlmIChzbGlkZXIgPT09IG51bGwpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvdWxkIG5vdCBmaW5kIHRoZSBzbGlkZXJcIik7XG4gICAgc2xpZGVyLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgY29uc3QgY2hlY2tlZCA9IGV2ZW50LnRhcmdldC5jaGVja2VkO1xuICAgICAgICBzZXRfcHJvcGVydHkobmFtZSwgY2hlY2tlZCk7XG4gICAgfSk7XG59XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG4vLyB0eXBlc2NyaXB0IGdsdWUgY29kZS5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmNvbnN0IGxvZ2dlcl8xID0gcmVxdWlyZShcIi4vbG9nZ2VyXCIpO1xuY29uc3Qgc2V0dXBfc2xpZGVyc18xID0gcmVxdWlyZShcIi4vc2V0dXBfc2xpZGVyc1wiKTtcbi8vIE5PVEUgd2Uga2VlcCB0aGUgQHRzLWlnbm9yZSdzIGluIGhlcmVcbmFzeW5jIGZ1bmN0aW9uIEdldEdvRnVuY3Rpb25zKCkge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBjb25zdCBnbyA9IG5ldyBHbygpOyAvLyBOT1RFIHRoaXMgY29tZXMgZnJvbSB0aGUgd2FzbV9leGVjLmpzIHRoaW5nXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgV2ViQXNzZW1ibHkuaW5zdGFudGlhdGVTdHJlYW1pbmcoZmV0Y2goXCJkaXN0L2JvaWQud2FzbVwiKSwgZ28uaW1wb3J0T2JqZWN0KTtcbiAgICBnby5ydW4ocmVzdWx0Lmluc3RhbmNlKTtcbiAgICByZXR1cm4ge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIFNldFByb3BlcnRpZXM6IFNldFByb3BlcnRpZXMsXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgR2V0UHJvcGVydGllczogR2V0UHJvcGVydGllcyxcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBHZXROZXh0RnJhbWU6IEdldE5leHRGcmFtZSxcbiAgICB9O1xufVxuY29uc3QgTlVNX0NPTE9SX0NPTVBPTkVOVFMgPSA0O1xuY29uc3QgU1FVSVNIX0ZBQ1RPUiA9IDE7XG47XG47XG5jb25zdCBtb3VzZSA9IHtcbiAgICBwb3M6IHsgeDogMCwgeTogMCB9LFxuICAgIGxlZnRfZG93bjogZmFsc2UsXG4gICAgbWlkZGxlX2Rvd246IGZhbHNlLFxuICAgIHJpZ2h0X2Rvd246IGZhbHNlLFxufTtcbmZ1bmN0aW9uIGdldF9oZWFkZXJfcmVjdF9mcm9tX2lkKGlkKSB7XG4gICAgY29uc3QgaGVhZGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICAgIGlmIChoZWFkZXIgPT09IG51bGwpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIm5vIGhlYWRlciB0ZXh0IGhhcyBiZWVuIGZvdW5kIChteSBuYW1lIGluIHRoZSBtaWRkbGUpXCIpO1xuICAgIGNvbnN0IGRvbV9yZWN0ID0gaGVhZGVyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHg6IGRvbV9yZWN0LngsXG4gICAgICAgIHk6IGRvbV9yZWN0LnksXG4gICAgICAgIHdpZHRoOiBkb21fcmVjdC53aWR0aCxcbiAgICAgICAgaGVpZ2h0OiBkb21fcmVjdC5oZWlnaHQsXG4gICAgfTtcbn1cbmZ1bmN0aW9uIHJlbmRlckJvaWRzKGRpc3BsYXksIGdvKSB7XG4gICAgLy8gZ2V0IHRoZSBwb3NpdGlvbiBvZiB0aGUgdGl0bGUgdGV4dCBvbiBzY3JlZW5cbiAgICBjb25zdCBoZWFkZXJfcmVjdCA9IGdldF9oZWFkZXJfcmVjdF9mcm9tX2lkKFwibXlfbmFtZV9pbl90aGVfbWlkZGxlXCIpO1xuICAgIGNvbnN0IG5vdF9teV9wYXNzaW9uX3JlY3QgPSBnZXRfaGVhZGVyX3JlY3RfZnJvbV9pZChcIm5vdF9teV9wYXNzaW9uXCIpO1xuICAgIC8vIGNvbnN0IHJlY3QgPSBnZXRfaGVhZGVyX3JlY3QoXCJteV9uYW1lX2luX3RoZV9taWRkbGVcIilcbiAgICAvLyBjb25zb2xlLmxvZyhcInJlY3RcIiwgcmVjdC54LCByZWN0LnksIHJlY3Qud2lkdGgsIHJlY3QuaGVpZ2h0KTtcbiAgICBjb25zdCB3aWR0aCA9IE1hdGguZmxvb3IoZGlzcGxheS5jdHguY2FudmFzLndpZHRoIC8gU1FVSVNIX0ZBQ1RPUik7XG4gICAgY29uc3QgaGVpZ2h0ID0gTWF0aC5mbG9vcihkaXNwbGF5LmN0eC5jYW52YXMuaGVpZ2h0IC8gU1FVSVNIX0ZBQ1RPUik7XG4gICAgY29uc3QgYnVmZmVyX3NpemUgPSB3aWR0aCAqIGhlaWdodCAqIE5VTV9DT0xPUl9DT01QT05FTlRTO1xuICAgIGlmIChkaXNwbGF5LmJhY2tJbWFnZVdpZHRoICE9PSB3aWR0aCB8fCBkaXNwbGF5LmJhY2tJbWFnZUhlaWdodCAhPT0gaGVpZ2h0KSB7XG4gICAgICAgICgwLCBsb2dnZXJfMS5sb2cpKGxvZ2dlcl8xLkxvZ19UeXBlLkdlbmVyYWwsIFwiT2ggZ29kLiB3ZXJlIHJlc2l6aW5nIHRoZSBidWZmZXJcIik7XG4gICAgICAgIGlmIChkaXNwbGF5LmJhY2tCdWZmZXJBcnJheS5sZW5ndGggPCBidWZmZXJfc2l6ZSkge1xuICAgICAgICAgICAgKDAsIGxvZ2dlcl8xLmxvZykobG9nZ2VyXzEuTG9nX1R5cGUuR2VuZXJhbCwgXCJJdHMgZ2V0dGluZyBiaWdnZXJcIik7IC8vIG15IHBlbmlzXG4gICAgICAgICAgICAvLyBtYWtlIHRoZSBidWZmZXIgYmlnZ2VyXG4gICAgICAgICAgICBkaXNwbGF5LmJhY2tCdWZmZXJBcnJheSA9IG5ldyBVaW50OENsYW1wZWRBcnJheShidWZmZXJfc2l6ZSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYmFja0NhbnZhcyA9IG5ldyBPZmZzY3JlZW5DYW52YXMod2lkdGgsIGhlaWdodCk7XG4gICAgICAgIGNvbnN0IGJhY2tDdHggPSBiYWNrQ2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcbiAgICAgICAgaWYgKGJhY2tDdHggPT09IG51bGwpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCIyRCBjb250ZXh0IGlzIG5vdCBzdXBwb3J0ZWRcIik7XG4gICAgICAgIGRpc3BsYXkuYmFja0N0eCA9IGJhY2tDdHg7XG4gICAgICAgIGRpc3BsYXkuYmFja0N0eC5pbWFnZVNtb290aGluZ0VuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgZGlzcGxheS5iYWNrSW1hZ2VXaWR0aCA9IHdpZHRoO1xuICAgICAgICBkaXNwbGF5LmJhY2tJbWFnZUhlaWdodCA9IGhlaWdodDtcbiAgICB9XG4gICAgY29uc3QgYnVmZmVyID0gZGlzcGxheS5iYWNrQnVmZmVyQXJyYXkuc3ViYXJyYXkoMCwgYnVmZmVyX3NpemUpO1xuICAgIGNvbnN0IGFyZ3MgPSB7XG4gICAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgICAgIGJ1ZmZlcjogYnVmZmVyLFxuICAgICAgICBtb3VzZTogbW91c2UsXG4gICAgICAgIGhlYWRlcl9yZWN0OiBoZWFkZXJfcmVjdCxcbiAgICAgICAgbm90X215X3Bhc3Npb25fcmVjdDogbm90X215X3Bhc3Npb25fcmVjdCxcbiAgICB9O1xuICAgIGNvbnN0IG51bUZpbGxlZCA9IGdvLkdldE5leHRGcmFtZShhcmdzKTtcbiAgICBpZiAobnVtRmlsbGVkICE9PSBidWZmZXJfc2l6ZSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBHZXROZXh0RnJhbWUgZ290ICR7bnVtRmlsbGVkfWApO1xuICAgIC8vIEB0cy1pZ25vcmUgLy8gd2h5IGRvc2UgdGhpcyBsaW5lIG1ha2UgYW4gZXJyb3IgaW4gbXkgZWRpdG9yXG4gICAgY29uc3QgaW1hZ2VEYXRhID0gbmV3IEltYWdlRGF0YShidWZmZXIsIHdpZHRoLCBoZWlnaHQpO1xuICAgIC8vIGlzIHRoaXMgY29vbD9cbiAgICBkaXNwbGF5LmJhY2tDdHgucHV0SW1hZ2VEYXRhKGltYWdlRGF0YSwgMCwgMCk7XG4gICAgLy8gTk9URSB0aGlzIHdpbGwgc3RyZXRjaCB0aGUgdGhpbmcuXG4gICAgLy8gY2FudmFzLndpZHRoIG1pZ2h0IGNoYW5nZSBkdXJpbmcgdGhlIHRpbWUgdGhpcyBpcyBydW5uaW5nXG4gICAgZGlzcGxheS5jdHguZHJhd0ltYWdlKGRpc3BsYXkuYmFja0N0eC5jYW52YXMsIDAsIDAsIGRpc3BsYXkuY3R4LmNhbnZhcy53aWR0aCwgZGlzcGxheS5jdHguY2FudmFzLmhlaWdodCk7XG4gICAgLy8gaW1hZ2VEYXRhID0gbnVsbFxufVxuY29uc3QgcmVuZGVyVGltZXMgPSBbXTtcbmNvbnN0IGRlbHRhVGltZXMgPSBbXTtcbi8vIENyZWRpdDogaHR0cHM6Ly9naXRodWIuY29tL3Rzb2Rpbmcva29pbFxuZnVuY3Rpb24gcmVuZGVyRGVidWdJbmZvKGRpc3BsYXksIHJlbmRlclRpbWUsIGRlbHRhVGltZSkge1xuICAgIGNvbnN0IGZvbnRTaXplID0gMjg7XG4gICAgZGlzcGxheS5jdHguZm9udCA9IGAke2ZvbnRTaXplfXB4IGJvbGRgO1xuICAgIGNvbnN0IGxhYmVscyA9IFtdO1xuICAgIHJlbmRlclRpbWVzLnB1c2gocmVuZGVyVGltZSk7XG4gICAgaWYgKHJlbmRlclRpbWVzLmxlbmd0aCA+IDYwKSB7XG4gICAgICAgIHJlbmRlclRpbWVzLnNoaWZ0KCk7XG4gICAgfVxuICAgIGRlbHRhVGltZXMucHVzaChkZWx0YVRpbWUpO1xuICAgIGlmIChkZWx0YVRpbWVzLmxlbmd0aCA+IDYwKSB7XG4gICAgICAgIGRlbHRhVGltZXMuc2hpZnQoKTtcbiAgICB9XG4gICAgY29uc3QgcmVuZGVyQXZnID0gcmVuZGVyVGltZXMucmVkdWNlKChhLCBiKSA9PiBhICsgYiwgMCkgLyByZW5kZXJUaW1lcy5sZW5ndGg7XG4gICAgY29uc3QgZGVsdGFBdmcgPSBkZWx0YVRpbWVzLnJlZHVjZSgoYSwgYikgPT4gYSArIGIsIDApIC8gZGVsdGFUaW1lcy5sZW5ndGg7XG4gICAgbGFiZWxzLnB1c2goYEZQUzogJHsoMSAvIGRlbHRhQXZnICogMTAwMCkudG9GaXhlZCgyKX1gKTtcbiAgICBsYWJlbHMucHVzaChgbXMgcGVyIGZyYW1lOiAke2RlbHRhQXZnLnRvRml4ZWQoMil9YCk7XG4gICAgbGFiZWxzLnB1c2goYFJlbmRlciBUaW1lIEF2ZyAobXMpOiAke3JlbmRlckF2Zy50b0ZpeGVkKDIpfWApO1xuICAgIGxhYmVscy5wdXNoKGBSZW5kZXIvU2VjIChNQVgpOiAkeygxIC8gcmVuZGVyQXZnICogMTAwMCkudG9GaXhlZCgyKX1gKTtcbiAgICBjb25zdCBwYWRkaW5nID0gNzA7XG4gICAgY29uc3Qgc2hhZG93T2Zmc2V0ID0gZm9udFNpemUgKiAwLjA2O1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGFiZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGRpc3BsYXkuY3R4LmZpbGxTdHlsZSA9IFwiYmxhY2tcIjtcbiAgICAgICAgZGlzcGxheS5jdHguZmlsbFRleHQobGFiZWxzW2ldLCBwYWRkaW5nLCBwYWRkaW5nICsgZm9udFNpemUgKiBpKTtcbiAgICAgICAgZGlzcGxheS5jdHguZmlsbFN0eWxlID0gXCJ3aGl0ZVwiO1xuICAgICAgICBkaXNwbGF5LmN0eC5maWxsVGV4dChsYWJlbHNbaV0sIHBhZGRpbmcgKyBzaGFkb3dPZmZzZXQsIHBhZGRpbmcgLSBzaGFkb3dPZmZzZXQgKyBmb250U2l6ZSAqIGkpO1xuICAgIH1cbn1cbihhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgZ28gPSBhd2FpdCBHZXRHb0Z1bmN0aW9ucygpO1xuICAgIHsgLy8gSGFuZGxlIHNsaWRlciBzdHVmZlxuICAgICAgICBjb25zdCBwcm9wZXJ0aWVzID0gT2JqZWN0LmVudHJpZXMoZ28uR2V0UHJvcGVydGllcygpKTtcbiAgICAgICAgZnVuY3Rpb24gc2V0X3Byb3BlcnR5KG5hbWUsIHZhbHVlKSB7XG4gICAgICAgICAgICAvLyBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xMjcxMDkwNS9ob3ctZG8taS1keW5hbWljYWxseS1hc3NpZ24tcHJvcGVydGllcy10by1hbi1vYmplY3QtaW4tdHlwZXNjcmlwdFxuICAgICAgICAgICAgY29uc3Qgb2JqID0ge307XG4gICAgICAgICAgICBvYmpbbmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIGdvLlNldFByb3BlcnRpZXMob2JqKTtcbiAgICAgICAgfVxuICAgICAgICAoMCwgc2V0dXBfc2xpZGVyc18xLnNldHVwX3NsaWRlcnMpKHByb3BlcnRpZXMsIHNldF9wcm9wZXJ0eSk7XG4gICAgfVxuICAgIHsgLy8gc2V0dXAgaW5wdXQgaGFuZGxpbmcuXG4gICAgICAgIC8vIHdoeSBkb2Vzbid0IHR5cGVzY3JpcHQgaGF2ZSBhbiBlbnVtIGZvciB0aGlzP1xuICAgICAgICBsZXQgbW91c2VfYnV0dG9ucztcbiAgICAgICAgKGZ1bmN0aW9uIChtb3VzZV9idXR0b25zKSB7XG4gICAgICAgICAgICBtb3VzZV9idXR0b25zW21vdXNlX2J1dHRvbnNbXCJNT1VTRV9MRUZUXCJdID0gMF0gPSBcIk1PVVNFX0xFRlRcIjtcbiAgICAgICAgICAgIG1vdXNlX2J1dHRvbnNbbW91c2VfYnV0dG9uc1tcIk1PVVNFX01JRERMRVwiXSA9IDFdID0gXCJNT1VTRV9NSURETEVcIjtcbiAgICAgICAgICAgIG1vdXNlX2J1dHRvbnNbbW91c2VfYnV0dG9uc1tcIk1PVVNFX1JJR0hUXCJdID0gMl0gPSBcIk1PVVNFX1JJR0hUXCI7XG4gICAgICAgIH0pKG1vdXNlX2J1dHRvbnMgfHwgKG1vdXNlX2J1dHRvbnMgPSB7fSkpO1xuICAgICAgICBjb25zdCByb290ID0gZG9jdW1lbnQuZ2V0Um9vdE5vZGUoKTtcbiAgICAgICAgcm9vdC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCAoZXYpID0+IHsgbW91c2UucG9zID0geyB4OiBldi54LCB5OiBldi55IH07IH0pO1xuICAgICAgICAvLyB0aGlzIHdpbGwgYnJlYWsgaWYgdGhlIHVzZXIgc2xpZGVzIHRoZXJlIG1vdXNlIG91dHNpZGUgb2YgdGhlIHNjcmVlbiB3aGlsZSBjbGlja2luZywgYnV0IHRoaXMgaXMgdGhlIHdlYiwgcGVvcGxlIGV4cGVjdCBpdCB0byBzdWNrLlxuICAgICAgICByb290LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIChldikgPT4ge1xuICAgICAgICAgICAgaWYgKGV2LmJ1dHRvbiA9PSBtb3VzZV9idXR0b25zLk1PVVNFX0xFRlQpXG4gICAgICAgICAgICAgICAgbW91c2UubGVmdF9kb3duID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChldi5idXR0b24gPT0gbW91c2VfYnV0dG9ucy5NT1VTRV9NSURETEUpXG4gICAgICAgICAgICAgICAgbW91c2UubWlkZGxlX2Rvd24gPSB0cnVlO1xuICAgICAgICAgICAgaWYgKGV2LmJ1dHRvbiA9PSBtb3VzZV9idXR0b25zLk1PVVNFX1JJR0hUKVxuICAgICAgICAgICAgICAgIG1vdXNlLnJpZ2h0X2Rvd24gPSB0cnVlO1xuICAgICAgICB9KTtcbiAgICAgICAgcm9vdC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgKGV2KSA9PiB7XG4gICAgICAgICAgICBpZiAoZXYuYnV0dG9uID09IG1vdXNlX2J1dHRvbnMuTU9VU0VfTEVGVClcbiAgICAgICAgICAgICAgICBtb3VzZS5sZWZ0X2Rvd24gPSBmYWxzZTtcbiAgICAgICAgICAgIGlmIChldi5idXR0b24gPT0gbW91c2VfYnV0dG9ucy5NT1VTRV9NSURETEUpXG4gICAgICAgICAgICAgICAgbW91c2UubWlkZGxlX2Rvd24gPSBmYWxzZTtcbiAgICAgICAgICAgIGlmIChldi5idXR0b24gPT0gbW91c2VfYnV0dG9ucy5NT1VTRV9SSUdIVClcbiAgICAgICAgICAgICAgICBtb3VzZS5yaWdodF9kb3duID0gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAvLyBjb25zdCBjYW52YXNfY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjYW52YXNfZGl2XCIpIGFzIEhUTUxDYW52YXNFbGVtZW50IHwgbnVsbFxuICAgIGNvbnN0IGJvaWRDYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJvaWRfY2FudmFzXCIpO1xuICAgIGlmIChib2lkQ2FudmFzID09PSBudWxsKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyBjYW52YXMgd2l0aCBpZCBgYm9pZF9jYW52YXNgIGlzIGZvdW5kXCIpO1xuICAgIGNvbnN0IGN0eCA9IGJvaWRDYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpO1xuICAgIGlmIChjdHggPT09IG51bGwpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIjJEIGNvbnRleHQgaXMgbm90IHN1cHBvcnRlZFwiKTtcbiAgICBjdHguaW1hZ2VTbW9vdGhpbmdFbmFibGVkID0gZmFsc2U7XG4gICAgY29uc3QgW2JhY2tJbWFnZVdpZHRoLCBiYWNrSW1hZ2VIZWlnaHRdID0gW2N0eC5jYW52YXMud2lkdGgsIGN0eC5jYW52YXMuaGVpZ2h0XTtcbiAgICBjb25zdCBiYWNrQ2FudmFzID0gbmV3IE9mZnNjcmVlbkNhbnZhcyhiYWNrSW1hZ2VXaWR0aCwgYmFja0ltYWdlSGVpZ2h0KTtcbiAgICBjb25zdCBiYWNrQ3R4ID0gYmFja0NhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XG4gICAgaWYgKGJhY2tDdHggPT09IG51bGwpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIjJEIGNvbnRleHQgaXMgbm90IHN1cHBvcnRlZFwiKTtcbiAgICBiYWNrQ3R4LmltYWdlU21vb3RoaW5nRW5hYmxlZCA9IGZhbHNlO1xuICAgIGNvbnN0IGJhY2tCdWZmZXJBcnJheSA9IG5ldyBVaW50OENsYW1wZWRBcnJheShiYWNrSW1hZ2VXaWR0aCAqIGJhY2tJbWFnZUhlaWdodCAqIDQpO1xuICAgIGNvbnN0IGRpc3BsYXkgPSB7XG4gICAgICAgIGN0eCxcbiAgICAgICAgYmFja0N0eCxcbiAgICAgICAgYmFja0J1ZmZlckFycmF5LFxuICAgICAgICBiYWNrSW1hZ2VXaWR0aCxcbiAgICAgICAgYmFja0ltYWdlSGVpZ2h0LFxuICAgIH07XG4gICAgbGV0IHByZXZUaW1lc3RhbXAgPSAwO1xuICAgIGNvbnN0IGZyYW1lID0gKHRpbWVzdGFtcCkgPT4ge1xuICAgICAgICBjdHguY2FudmFzLndpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XG4gICAgICAgIGN0eC5jYW52YXMuaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xuICAgICAgICBjb25zdCBkZWx0YVRpbWUgPSAodGltZXN0YW1wIC0gcHJldlRpbWVzdGFtcCk7XG4gICAgICAgIHByZXZUaW1lc3RhbXAgPSB0aW1lc3RhbXA7XG4gICAgICAgIC8vIFRPRE8gRG9uJ3QgbmVlZCBkZWx0YSB0aW1lLCBib2lkIHRoaW5nIGRvc2UgaXQgZm9yIHVzPyBjaGFuZ2U/XG4gICAgICAgIGNvbnN0IHN0YXJ0VGltZSA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgICAgICByZW5kZXJCb2lkcyhkaXNwbGF5LCBnbyk7XG4gICAgICAgIGNvbnN0IGVuZFRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKTtcbiAgICAgICAgLy8gSW4gbXNcbiAgICAgICAgY29uc3QgcmVuZGVyVGltZSA9IGVuZFRpbWUgLSBzdGFydFRpbWU7XG4gICAgICAgIGlmIChsb2dnZXJfMS5ERUJVR19ESVNQTEFZKVxuICAgICAgICAgICAgcmVuZGVyRGVidWdJbmZvKGRpc3BsYXksIHJlbmRlclRpbWUsIGRlbHRhVGltZSk7XG4gICAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnJhbWUpO1xuICAgIH07XG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSgodGltZXN0YW1wKSA9PiB7XG4gICAgICAgIHByZXZUaW1lc3RhbXAgPSB0aW1lc3RhbXA7XG4gICAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnJhbWUpO1xuICAgIH0pO1xufSkoKTtcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==
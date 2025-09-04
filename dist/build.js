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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNENBQTRDLFVBQVU7QUFDdEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDBCQUEwQixTQUFTO0FBQ25DO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0IsaUNBQWlDO0FBQ3pELGlDQUFpQyxvQkFBb0I7QUFDckQseUNBQXlDLHFCQUFxQjtBQUM5RCxxQ0FBcUMsa0NBQWtDO0FBQ3ZFO0FBQ0E7QUFDQSxvQkFBb0IsbUJBQW1CO0FBQ3ZDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVMsc0NBQXNDO0FBQy9DO0FBQ0EscURBQXFELGNBQWMscUJBQXFCO0FBQ3hGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMLENBQUMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9ib2lkcy8uL3dlYl9zcmMvbG9nZ2VyLnRzIiwid2VicGFjazovL2JvaWRzLy4vd2ViX3NyYy9zZXR1cF9zbGlkZXJzLnRzIiwid2VicGFjazovL2JvaWRzL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2JvaWRzLy4vd2ViX3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuTG9nX1R5cGUgPSBleHBvcnRzLkRFQlVHX1NMSURFUlMgPSBleHBvcnRzLkRFQlVHX0RJU1BMQVkgPSB2b2lkIDA7XG5leHBvcnRzLmxvZyA9IGxvZztcbi8vIGlzIGl0IGNvcnJlY3QgdG8gaGF2ZSB0aGVzZSBoZXJlPyB0aGlzIG9uZSBlZmZlY3RzXG4vLyBkcmF3aW5nIG9uIHRoZSBzY3JlZW4sIG5vdCBqdXN0IGxvZ2dpbmc/IGFsdGhvdWdoIHdlXG4vLyBjb3VsZCBtYWtlIGFsbCBsb2dzIGFwcGVhciBvbiBzY3JlZW4uLi5cbmV4cG9ydHMuREVCVUdfRElTUExBWSA9IHRydWU7XG5leHBvcnRzLkRFQlVHX1NMSURFUlMgPSBmYWxzZTtcbnZhciBMb2dfVHlwZTtcbihmdW5jdGlvbiAoTG9nX1R5cGUpIHtcbiAgICBMb2dfVHlwZVtMb2dfVHlwZVtcIkdlbmVyYWxcIl0gPSAwXSA9IFwiR2VuZXJhbFwiO1xuICAgIExvZ19UeXBlW0xvZ19UeXBlW1wiRGVidWdfRGlzcGxheVwiXSA9IDFdID0gXCJEZWJ1Z19EaXNwbGF5XCI7XG4gICAgTG9nX1R5cGVbTG9nX1R5cGVbXCJEZWJ1Z19TbGlkZXJzXCJdID0gMl0gPSBcIkRlYnVnX1NsaWRlcnNcIjtcbn0pKExvZ19UeXBlIHx8IChleHBvcnRzLkxvZ19UeXBlID0gTG9nX1R5cGUgPSB7fSkpO1xuZnVuY3Rpb24gbG9nKGxvZ190eXBlLCAuLi5kYXRhKSB7XG4gICAgLy8gaWYgdGhpcyBpcyB0aGUgZW1wdHkgc3RyaW5nXG4gICAgdmFyIGRvX2xvZyA9IGZhbHNlO1xuICAgIHZhciBsb2dfaGVhZGVyID0gXCJcIjtcbiAgICBzd2l0Y2ggKGxvZ190eXBlKSB7XG4gICAgICAgIGNhc2UgTG9nX1R5cGUuR2VuZXJhbDpcbiAgICAgICAgICAgIGxvZ19oZWFkZXIgPSBcIlwiO1xuICAgICAgICAgICAgZG9fbG9nID0gdHJ1ZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIExvZ19UeXBlLkRlYnVnX0Rpc3BsYXk6XG4gICAgICAgICAgICBsb2dfaGVhZGVyID0gXCJERUJVR19ESVNQTEFZXCI7XG4gICAgICAgICAgICBpZiAoZXhwb3J0cy5ERUJVR19ESVNQTEFZKVxuICAgICAgICAgICAgICAgIGRvX2xvZyA9IHRydWU7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBMb2dfVHlwZS5EZWJ1Z19TbGlkZXJzOlxuICAgICAgICAgICAgbG9nX2hlYWRlciA9IFwiREVCVUdfU0xJREVSU1wiO1xuICAgICAgICAgICAgaWYgKGV4cG9ydHMuREVCVUdfU0xJREVSUylcbiAgICAgICAgICAgICAgICBkb19sb2cgPSB0cnVlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGlmIChkb19sb2cpIHtcbiAgICAgICAgaWYgKGxvZ19oZWFkZXIgIT0gXCJcIikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYCR7bG9nX2hlYWRlcn06IGAsIC4uLmRhdGEpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5sb2coLi4uZGF0YSk7XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuc2V0dXBfc2xpZGVycyA9IHNldHVwX3NsaWRlcnM7XG5jb25zdCBsb2dnZXJfMSA9IHJlcXVpcmUoXCIuL2xvZ2dlclwiKTtcbnZhciBQcm9wZXJ0eV9UeXBlO1xuKGZ1bmN0aW9uIChQcm9wZXJ0eV9UeXBlKSB7XG4gICAgUHJvcGVydHlfVHlwZVtQcm9wZXJ0eV9UeXBlW1wiTm9uZVwiXSA9IDBdID0gXCJOb25lXCI7XG4gICAgUHJvcGVydHlfVHlwZVtQcm9wZXJ0eV9UeXBlW1wiUHJvcGVydHlfRmxvYXRcIl0gPSAxXSA9IFwiUHJvcGVydHlfRmxvYXRcIjtcbiAgICBQcm9wZXJ0eV9UeXBlW1Byb3BlcnR5X1R5cGVbXCJQcm9wZXJ0eV9JbnRcIl0gPSAyXSA9IFwiUHJvcGVydHlfSW50XCI7XG4gICAgUHJvcGVydHlfVHlwZVtQcm9wZXJ0eV9UeXBlW1wiUHJvcGVydHlfQm9vbFwiXSA9IDNdID0gXCJQcm9wZXJ0eV9Cb29sXCI7XG59KShQcm9wZXJ0eV9UeXBlIHx8IChQcm9wZXJ0eV9UeXBlID0ge30pKTtcbmNsYXNzIFByb3BlcnR5X1N0cnVjdCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucHJvcGVydHlfdHlwZSA9IFByb3BlcnR5X1R5cGUuTm9uZTtcbiAgICAgICAgLy8gRmxvYXQgcHJvcGVydGllc1xuICAgICAgICB0aGlzLmZsb2F0X3JhbmdlX21pbiA9IDA7XG4gICAgICAgIHRoaXMuZmxvYXRfcmFuZ2VfbWF4ID0gMDtcbiAgICAgICAgdGhpcy5mbG9hdF9kZWZhdWx0ID0gMDtcbiAgICAgICAgLy8gSW50IHByb3BlcnRpZXNcbiAgICAgICAgdGhpcy5pbnRfcmFuZ2VfbWluID0gMDtcbiAgICAgICAgdGhpcy5pbnRfcmFuZ2VfbWF4ID0gMDtcbiAgICAgICAgdGhpcy5pbnRfZGVmYXVsdCA9IDA7XG4gICAgICAgIHRoaXMuYm9vbF9kZWZhdWx0ID0gZmFsc2U7XG4gICAgfVxufVxuZnVuY3Rpb24gdGFnX3Byb3BfdG9fcGFydHMocHJvcCkge1xuICAgIGNvbnN0IFtsZWZ0LCByaWdodF9dID0gcHJvcC5zcGxpdChcIjpcIik7XG4gICAgY29uc3QgcmlnaHQgPSByaWdodF8uc2xpY2UoMSwgcmlnaHRfLmxlbmd0aCAtIDEpO1xuICAgIHJldHVybiBbbGVmdCwgcmlnaHRdO1xufVxuZnVuY3Rpb24gcGFyc2VCb29sKHMpIHtcbiAgICAvLyAxLCB0LCBULCBUUlVFLCB0cnVlLCBUcnVlLFxuICAgIC8vIDAsIGYsIEYsIEZBTFNFLCBmYWxzZSwgRmFsc2VcbiAgICBzd2l0Y2ggKHMpIHtcbiAgICAgICAgY2FzZSBcIjFcIjpcbiAgICAgICAgY2FzZSBcInRcIjpcbiAgICAgICAgY2FzZSBcIlRcIjpcbiAgICAgICAgY2FzZSBcIlRSVUVcIjpcbiAgICAgICAgY2FzZSBcInRydWVcIjpcbiAgICAgICAgY2FzZSBcIlRydWVcIjpcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICBjYXNlIFwiMFwiOlxuICAgICAgICBjYXNlIFwiZlwiOlxuICAgICAgICBjYXNlIFwiRlwiOlxuICAgICAgICBjYXNlIFwiRkFMU0VcIjpcbiAgICAgICAgY2FzZSBcImZhbHNlXCI6XG4gICAgICAgIGNhc2UgXCJGYWxzZVwiOlxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICBkZWZhdWx0OiB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gc3RyaW5nIGluIHBhcnNlQm9vbCwgd2FzICR7c31gKTtcbiAgICB9XG59XG4vLyBwdXRzIHNvbWUgc2xpZGVycyB1cCB0byBjb250cm9sIHNvbWUgcGFyYW1ldGVyc1xuZnVuY3Rpb24gc2V0dXBfc2xpZGVycyhwcm9wZXJ0aWVzLCBzZXRfcHJvcGVydHkpIHtcbiAgICBjb25zdCBzbGlkZXJfY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzbGlkZUNvbnRhaW5lclwiKTtcbiAgICBpZiAoc2xpZGVyX2NvbnRhaW5lciA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgR2V0IHNsaWRlciBjb250YWluZXJcIik7XG4gICAgfVxuICAgIC8vIFRPRE8gZm9yIHRoZSBzbGlkZXMgdGhhdCBoYXZlIGEgc21hbGwgcmFuZ2UgKGxpa2UgY29oZXNpb24gZmFjdG9yKSBtYWtlIHRoZSB2YWx1ZSB0aGUgc3F1YXJlIG9mIHRoZSBudW1iZXIuXG4gICAgcHJvcGVydGllcy5zb3J0KCk7IC8vIGhvcGUgc29tZW9uZSBlbHNlIHdhc24ndCB1c2luZyB0aGlzLlxuICAgIGZvciAoY29uc3QgW25hbWUsIHRhZ10gb2YgcHJvcGVydGllcykge1xuICAgICAgICAoMCwgbG9nZ2VyXzEubG9nKShsb2dnZXJfMS5Mb2dfVHlwZS5EZWJ1Z19TbGlkZXJzLCBgdHlwZXNjcmlwdDogJHtuYW1lfTogJHt0YWd9YCk7XG4gICAgICAgIC8vIFRPRE8gdGhpcyBmdW5jdGlvbiBpcyBncm93aW5nIHRvIGJpZywgcHV0IGl0IGluIGEgc2VwYXJhdGUgZmlsZS5cbiAgICAgICAgY29uc3QgdGFnX3NwbGl0ID0gdGFnLnNwbGl0KFwiIFwiKTtcbiAgICAgICAgY29uc3QgW3Byb3BfcHJvcGVydHksIHByb3BfdHlwZV0gPSB0YWdfcHJvcF90b19wYXJ0cyh0YWdfc3BsaXRbMF0pO1xuICAgICAgICBpZiAocHJvcF9wcm9wZXJ0eSAhPSBcIlByb3BlcnR5XCIpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEZpcnN0IHByb3BlcnR5IGlzIG5vdCBwcm9wZXJ0eSwgdGFnIHdhcyAke3RhZ31gKTtcbiAgICAgICAgY29uc3QgcHJvcGVydHlfc3RydWN0ID0gbmV3IFByb3BlcnR5X1N0cnVjdCgpO1xuICAgICAgICBzd2l0Y2ggKHByb3BfdHlwZSkge1xuICAgICAgICAgICAgY2FzZSBcImZsb2F0XCI6XG4gICAgICAgICAgICAgICAgcHJvcGVydHlfc3RydWN0LnByb3BlcnR5X3R5cGUgPSBQcm9wZXJ0eV9UeXBlLlByb3BlcnR5X0Zsb2F0O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcImludFwiOlxuICAgICAgICAgICAgICAgIHByb3BlcnR5X3N0cnVjdC5wcm9wZXJ0eV90eXBlID0gUHJvcGVydHlfVHlwZS5Qcm9wZXJ0eV9JbnQ7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiYm9vbFwiOlxuICAgICAgICAgICAgICAgIHByb3BlcnR5X3N0cnVjdC5wcm9wZXJ0eV90eXBlID0gUHJvcGVydHlfVHlwZS5Qcm9wZXJ0eV9Cb29sO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIHByb3AgdHlwZSAke3Byb3BfdHlwZX1gKTtcbiAgICAgICAgfVxuICAgICAgICB0YWdfc3BsaXQuc2hpZnQoKTtcbiAgICAgICAgd2hpbGUgKHRhZ19zcGxpdC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjb25zdCBbbGVmdCwgcmlnaHRdID0gdGFnX3Byb3BfdG9fcGFydHModGFnX3NwbGl0WzBdKTtcbiAgICAgICAgICAgIHRhZ19zcGxpdC5zaGlmdCgpO1xuICAgICAgICAgICAgc3dpdGNoIChsZWZ0KSB7XG4gICAgICAgICAgICAgICAgY2FzZSBcIlJhbmdlXCI6XG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAocHJvcGVydHlfc3RydWN0LnByb3BlcnR5X3R5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgUHJvcGVydHlfVHlwZS5Qcm9wZXJ0eV9GbG9hdDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IFttaW5fcywgbWF4X3NdID0gcmlnaHQuc3BsaXQoXCI7XCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5X3N0cnVjdC5mbG9hdF9yYW5nZV9taW4gPSBwYXJzZUZsb2F0KG1pbl9zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eV9zdHJ1Y3QuZmxvYXRfcmFuZ2VfbWF4ID0gcGFyc2VGbG9hdChtYXhfcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFByb3BlcnR5X1R5cGUuUHJvcGVydHlfSW50OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgW21pbl9zLCBtYXhfc10gPSByaWdodC5zcGxpdChcIjtcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlfc3RydWN0LmludF9yYW5nZV9taW4gPSBwYXJzZUludChtaW5fcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlfc3RydWN0LmludF9yYW5nZV9tYXggPSBwYXJzZUludChtYXhfcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFByb3BlcnR5X1R5cGUuUHJvcGVydHlfQm9vbDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkJvb2xlYW4gZG9zZSBub3QgaGF2ZSBhIHJhbmdlIVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvcihgVW5rbm93biB0eXBlIGluICR7bmFtZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiRGVmYXVsdFwiOlxuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHByb3BlcnR5X3N0cnVjdC5wcm9wZXJ0eV90eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFByb3BlcnR5X1R5cGUuUHJvcGVydHlfRmxvYXQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlfc3RydWN0LmZsb2F0X2RlZmF1bHQgPSBwYXJzZUZsb2F0KHJpZ2h0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgUHJvcGVydHlfVHlwZS5Qcm9wZXJ0eV9JbnQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlfc3RydWN0LmludF9kZWZhdWx0ID0gcGFyc2VJbnQocmlnaHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBQcm9wZXJ0eV9UeXBlLlByb3BlcnR5X0Jvb2w6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlfc3RydWN0LmJvb2xfZGVmYXVsdCA9IHBhcnNlQm9vbChyaWdodCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gdHlwZSBpbiAke25hbWV9YCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIHByb3BlcnR5ICR7bGVmdH1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBUT0RPIHNvbWUgd2F5IHRvIHByaW50IGFuIG9iamVjdC5cbiAgICAgICAgLy8gbG9nKExvZ19UeXBlLkRlYnVnX1NsaWRlcnMsIGBwcm9wZXJ0eSBzdHJ1Y3QgJHtwcm9wZXJ0eV9zdHJ1Y3R9YCk7XG4gICAgICAgIHN3aXRjaCAocHJvcGVydHlfc3RydWN0LnByb3BlcnR5X3R5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgUHJvcGVydHlfVHlwZS5Qcm9wZXJ0eV9GbG9hdDpcbiAgICAgICAgICAgICAgICBtYWtlX2Zsb2F0X3NsaWRlcihzbGlkZXJfY29udGFpbmVyLCBuYW1lLCBwcm9wZXJ0eV9zdHJ1Y3QsIHNldF9wcm9wZXJ0eSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFByb3BlcnR5X1R5cGUuUHJvcGVydHlfSW50OlxuICAgICAgICAgICAgICAgIG1ha2VfaW50X3NsaWRlcihzbGlkZXJfY29udGFpbmVyLCBuYW1lLCBwcm9wZXJ0eV9zdHJ1Y3QsIHNldF9wcm9wZXJ0eSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFByb3BlcnR5X1R5cGUuUHJvcGVydHlfQm9vbDpcbiAgICAgICAgICAgICAgICBtYWtlX2Jvb2xfc2xpZGVyKHNsaWRlcl9jb250YWluZXIsIG5hbWUsIHByb3BlcnR5X3N0cnVjdCwgc2V0X3Byb3BlcnR5KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvcihgVW5rbm93biBwcm9wZXJ0eSB0eXBlICR7cHJvcGVydHlfc3RydWN0LnByb3BlcnR5X3R5cGV9YCk7XG4gICAgICAgIH1cbiAgICB9XG59XG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gICAgICAgICBNYWtlIGEgc2xpZGVyIGZvciBhbiBmbG9hdFxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbmZ1bmN0aW9uIG1ha2VfZmxvYXRfc2xpZGVyKHNsaWRlcl9jb250YWluZXIsIG5hbWUsIHByb3BlcnR5X3N0cnVjdCwgc2V0X3Byb3BlcnR5KSB7XG4gICAgY29uc3QgaWQgPSBgc2xpZGVyXyR7bmFtZX1gO1xuICAgIGNvbnN0IHBhcmFfaWQgPSBgJHtpZH1fcGFyYWdyYXBoYDtcbiAgICBjb25zdCBwYXJhZ3JhcGhfdGV4dCA9IGAke25hbWUucmVwbGFjZSgvXy9nLCBcIiBcIil9YDtcbiAgICBjb25zdCBodG1sX3N0cmluZyA9IGBcbiAgICAgICAgPHAgY2xhc3M9XCJzbGlkZXJLZXlcIiBpZD1cIiR7cGFyYV9pZH1cIj5cbiAgICAgICAgICAgICR7cGFyYWdyYXBoX3RleHR9OiAke3Byb3BlcnR5X3N0cnVjdC5mbG9hdF9kZWZhdWx0fVxuICAgICAgICA8L3A+XG4gICAgICAgIDxpbnB1dCB0eXBlPVwicmFuZ2VcIiBtaW49XCIke3Byb3BlcnR5X3N0cnVjdC5mbG9hdF9yYW5nZV9taW59XCIgbWF4PVwiJHtwcm9wZXJ0eV9zdHJ1Y3QuZmxvYXRfcmFuZ2VfbWF4fVwiIHZhbHVlPVwiJHtwcm9wZXJ0eV9zdHJ1Y3QuZmxvYXRfZGVmYXVsdH1cIiBzdGVwPVwiMC4wMDVcIiBjbGFzcz1cInNsaWRlclwiIGlkPVwiJHtpZH1cIj5cbiAgICAgICAgYDtcbiAgICBjb25zdCBuZXdfdGhpbmcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIG5ld190aGluZy5jbGFzc05hbWUgPSBcInJhbmdlSG9sZGVyXCI7XG4gICAgbmV3X3RoaW5nLmlubmVySFRNTCA9IGh0bWxfc3RyaW5nO1xuICAgIHNsaWRlcl9jb250YWluZXIuYXBwZW5kQ2hpbGQobmV3X3RoaW5nKTtcbiAgICBjb25zdCBzbGlkZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG4gICAgaWYgKHNsaWRlciA9PT0gbnVsbClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ291bGQgbm90IGZpbmQgdGhlIHNsaWRlclwiKTtcbiAgICBzbGlkZXIuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsIChldmVudCkgPT4ge1xuICAgICAgICBjb25zdCBzbGlkZXJfdmFsdWVfc3RyaW5nID0gZXZlbnQudGFyZ2V0LnZhbHVlO1xuICAgICAgICBjb25zdCBzbGlkZXJfbnVtYmVyID0gTnVtYmVyKHNsaWRlcl92YWx1ZV9zdHJpbmcpO1xuICAgICAgICBjb25zdCBzbGlkZXJfdGV4dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHBhcmFfaWQpO1xuICAgICAgICBpZiAoc2xpZGVyX3RleHQgPT09IG51bGwpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGNvdWxkIG5vdCBmaW5kIHNsaWRlcl90ZXh0ICR7cGFyYV9pZH1gKTtcbiAgICAgICAgc2xpZGVyX3RleHQudGV4dENvbnRlbnQgPSBgJHtwYXJhZ3JhcGhfdGV4dH06ICR7c2xpZGVyX251bWJlcn1gO1xuICAgICAgICBzZXRfcHJvcGVydHkobmFtZSwgc2xpZGVyX251bWJlcik7XG4gICAgfSk7XG59XG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gICAgICAgICAgTWFrZSBhIHNsaWRlciBmb3IgYW4gaW50XG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuZnVuY3Rpb24gbWFrZV9pbnRfc2xpZGVyKHNsaWRlcl9jb250YWluZXIsIG5hbWUsIHByb3BlcnR5X3N0cnVjdCwgc2V0X3Byb3BlcnR5KSB7XG4gICAgY29uc3QgaWQgPSBgc2xpZGVyXyR7bmFtZX1gO1xuICAgIGNvbnN0IHBhcmFfaWQgPSBgJHtpZH1fcGFyYWdyYXBoYDtcbiAgICBjb25zdCBwYXJhZ3JhcGhfdGV4dCA9IGAke25hbWUucmVwbGFjZSgvXy9nLCBcIiBcIil9YDtcbiAgICBjb25zdCBodG1sX3N0cmluZyA9IGBcbiAgICAgICAgPHAgY2xhc3M9XCJzbGlkZXJLZXlcIiBpZD1cIiR7cGFyYV9pZH1cIj5cbiAgICAgICAgICAgICR7cGFyYWdyYXBoX3RleHR9OiAke3Byb3BlcnR5X3N0cnVjdC5pbnRfZGVmYXVsdH1cbiAgICAgICAgPC9wPlxuICAgICAgICA8aW5wdXQgdHlwZT1cInJhbmdlXCIgbWluPVwiJHtwcm9wZXJ0eV9zdHJ1Y3QuaW50X3JhbmdlX21pbn1cIiBtYXg9XCIke3Byb3BlcnR5X3N0cnVjdC5pbnRfcmFuZ2VfbWF4fVwiIHZhbHVlPVwiJHtwcm9wZXJ0eV9zdHJ1Y3QuaW50X2RlZmF1bHR9XCIgY2xhc3M9XCJzbGlkZXJcIiBpZD1cIiR7aWR9XCI+XG4gICAgICAgIGA7XG4gICAgY29uc3QgbmV3X3RoaW5nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICBuZXdfdGhpbmcuY2xhc3NOYW1lID0gXCJyYW5nZUhvbGRlclwiO1xuICAgIG5ld190aGluZy5pbm5lckhUTUwgPSBodG1sX3N0cmluZztcbiAgICBzbGlkZXJfY29udGFpbmVyLmFwcGVuZENoaWxkKG5ld190aGluZyk7XG4gICAgY29uc3Qgc2xpZGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICAgIGlmIChzbGlkZXIgPT09IG51bGwpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvdWxkIG5vdCBmaW5kIHRoZSBzbGlkZXJcIik7XG4gICAgc2xpZGVyLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgY29uc3Qgc2xpZGVyX3ZhbHVlX3N0cmluZyA9IGV2ZW50LnRhcmdldC52YWx1ZTtcbiAgICAgICAgY29uc3Qgc2xpZGVyX251bWJlciA9IE51bWJlcihzbGlkZXJfdmFsdWVfc3RyaW5nKTtcbiAgICAgICAgY29uc3Qgc2xpZGVyX3RleHQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChwYXJhX2lkKTtcbiAgICAgICAgaWYgKHNsaWRlcl90ZXh0ID09PSBudWxsKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBjb3VsZCBub3QgZmluZCBzbGlkZXJfdGV4dCAke3BhcmFfaWR9YCk7XG4gICAgICAgIHNsaWRlcl90ZXh0LnRleHRDb250ZW50ID0gYCR7cGFyYWdyYXBoX3RleHR9OiAke3NsaWRlcl9udW1iZXJ9YDtcbiAgICAgICAgc2V0X3Byb3BlcnR5KG5hbWUsIHNsaWRlcl9udW1iZXIpO1xuICAgIH0pO1xufVxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vICAgICBNYWtlIGEgc2xpZGVyIGZvciBhbiBib29sZWFuIHRvZ2dsZVxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbmZ1bmN0aW9uIG1ha2VfYm9vbF9zbGlkZXIoc2xpZGVyX2NvbnRhaW5lciwgbmFtZSwgcHJvcGVydHlfc3RydWN0LCBzZXRfcHJvcGVydHkpIHtcbiAgICBjb25zdCBpZCA9IGBzbGlkZXJfJHtuYW1lfWA7XG4gICAgY29uc3QgcGFyYWdyYXBoX3RleHQgPSBgJHtuYW1lLnJlcGxhY2UoL18vZywgXCIgXCIpfWA7XG4gICAgY29uc3QgaHRtbF9zdHJpbmcgPSBgXG4gICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiAke3Byb3BlcnR5X3N0cnVjdC5ib29sX2RlZmF1bHQgPyBcImNoZWNrZWRcIiA6IFwiXCJ9IGNsYXNzPVwiY2hlY2tib3hfdG9nZ2xlXCIgaWQ9XCIke2lkfVwiPlxuICAgICAgICA8bGFiZWwgZm9yPVwiJHtpZH1cIiBjbGFzcz1cImNoZWNrYm94X3RvZ2dsZV9sYWJlbFwiPiR7cGFyYWdyYXBoX3RleHR9PC9sYWJlbD5cbiAgICAgICAgYDtcbiAgICBjb25zdCBuZXdfdGhpbmcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIG5ld190aGluZy5jbGFzc05hbWUgPSBcInJhbmdlSG9sZGVyXCI7XG4gICAgbmV3X3RoaW5nLmlubmVySFRNTCA9IGh0bWxfc3RyaW5nO1xuICAgIHNsaWRlcl9jb250YWluZXIuYXBwZW5kQ2hpbGQobmV3X3RoaW5nKTtcbiAgICBjb25zdCBzbGlkZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG4gICAgaWYgKHNsaWRlciA9PT0gbnVsbClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ291bGQgbm90IGZpbmQgdGhlIHNsaWRlclwiKTtcbiAgICBzbGlkZXIuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsIChldmVudCkgPT4ge1xuICAgICAgICBjb25zdCBjaGVja2VkID0gZXZlbnQudGFyZ2V0LmNoZWNrZWQ7XG4gICAgICAgIHNldF9wcm9wZXJ0eShuYW1lLCBjaGVja2VkKTtcbiAgICB9KTtcbn1cbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCJcInVzZSBzdHJpY3RcIjtcbi8vIHR5cGVzY3JpcHQgZ2x1ZSBjb2RlLlxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuY29uc3QgbG9nZ2VyXzEgPSByZXF1aXJlKFwiLi9sb2dnZXJcIik7XG5jb25zdCBzZXR1cF9zbGlkZXJzXzEgPSByZXF1aXJlKFwiLi9zZXR1cF9zbGlkZXJzXCIpO1xuLy8gTk9URSB3ZSBrZWVwIHRoZSBAdHMtaWdub3JlJ3MgaW4gaGVyZVxuYXN5bmMgZnVuY3Rpb24gR2V0R29GdW5jdGlvbnMoKSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGNvbnN0IGdvID0gbmV3IEdvKCk7IC8vIE5PVEUgdGhpcyBjb21lcyBmcm9tIHRoZSB3YXNtX2V4ZWMuanMgdGhpbmdcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBXZWJBc3NlbWJseS5pbnN0YW50aWF0ZVN0cmVhbWluZyhmZXRjaChcImRpc3QvYm9pZC53YXNtXCIpLCBnby5pbXBvcnRPYmplY3QpO1xuICAgIGdvLnJ1bihyZXN1bHQuaW5zdGFuY2UpO1xuICAgIHJldHVybiB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgU2V0UHJvcGVydGllczogU2V0UHJvcGVydGllcyxcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBHZXRQcm9wZXJ0aWVzOiBHZXRQcm9wZXJ0aWVzLFxuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIEdldE5leHRGcmFtZTogR2V0TmV4dEZyYW1lLFxuICAgIH07XG59XG5jb25zdCBOVU1fQ09MT1JfQ09NUE9ORU5UUyA9IDQ7XG5jb25zdCBTUVVJU0hfRkFDVE9SID0gMTtcbjtcbjtcbmNvbnN0IG1vdXNlID0ge1xuICAgIHBvczogeyB4OiAwLCB5OiAwIH0sXG4gICAgbGVmdF9kb3duOiBmYWxzZSxcbiAgICBtaWRkbGVfZG93bjogZmFsc2UsXG4gICAgcmlnaHRfZG93bjogZmFsc2UsXG59O1xuZnVuY3Rpb24gZ2V0X2hlYWRlcl9yZWN0X2Zyb21faWQoaWQpIHtcbiAgICBjb25zdCBoZWFkZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG4gICAgaWYgKGhlYWRlciA9PT0gbnVsbClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwibm8gaGVhZGVyIHRleHQgaGFzIGJlZW4gZm91bmQgKG15IG5hbWUgaW4gdGhlIG1pZGRsZSlcIik7XG4gICAgY29uc3QgZG9tX3JlY3QgPSBoZWFkZXIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgeDogZG9tX3JlY3QueCxcbiAgICAgICAgeTogZG9tX3JlY3QueSxcbiAgICAgICAgd2lkdGg6IGRvbV9yZWN0LndpZHRoLFxuICAgICAgICBoZWlnaHQ6IGRvbV9yZWN0LmhlaWdodCxcbiAgICB9O1xufVxuZnVuY3Rpb24gcmVuZGVyQm9pZHMoZGlzcGxheSwgZ28pIHtcbiAgICAvLyBnZXQgdGhlIHBvc2l0aW9uIG9mIHRoZSB0aXRsZSB0ZXh0IG9uIHNjcmVlblxuICAgIGNvbnN0IGhlYWRlcl9yZWN0ID0gZ2V0X2hlYWRlcl9yZWN0X2Zyb21faWQoXCJteV9uYW1lX2luX3RoZV9taWRkbGVcIik7XG4gICAgY29uc3Qgbm90X215X3Bhc3Npb25fcmVjdCA9IGdldF9oZWFkZXJfcmVjdF9mcm9tX2lkKFwibm90X215X3Bhc3Npb25cIik7XG4gICAgLy8gY29uc3QgcmVjdCA9IGdldF9oZWFkZXJfcmVjdChcIm15X25hbWVfaW5fdGhlX21pZGRsZVwiKVxuICAgIC8vIGNvbnNvbGUubG9nKFwicmVjdFwiLCByZWN0LngsIHJlY3QueSwgcmVjdC53aWR0aCwgcmVjdC5oZWlnaHQpO1xuICAgIGNvbnN0IHdpZHRoID0gTWF0aC5mbG9vcihkaXNwbGF5LmN0eC5jYW52YXMud2lkdGggLyBTUVVJU0hfRkFDVE9SKTtcbiAgICBjb25zdCBoZWlnaHQgPSBNYXRoLmZsb29yKGRpc3BsYXkuY3R4LmNhbnZhcy5oZWlnaHQgLyBTUVVJU0hfRkFDVE9SKTtcbiAgICBjb25zdCBidWZmZXJfc2l6ZSA9IHdpZHRoICogaGVpZ2h0ICogTlVNX0NPTE9SX0NPTVBPTkVOVFM7XG4gICAgaWYgKGRpc3BsYXkuYmFja0ltYWdlV2lkdGggIT09IHdpZHRoIHx8IGRpc3BsYXkuYmFja0ltYWdlSGVpZ2h0ICE9PSBoZWlnaHQpIHtcbiAgICAgICAgKDAsIGxvZ2dlcl8xLmxvZykobG9nZ2VyXzEuTG9nX1R5cGUuR2VuZXJhbCwgXCJPaCBnb2QuIHdlcmUgcmVzaXppbmcgdGhlIGJ1ZmZlclwiKTtcbiAgICAgICAgaWYgKGRpc3BsYXkuYmFja0J1ZmZlckFycmF5Lmxlbmd0aCA8IGJ1ZmZlcl9zaXplKSB7XG4gICAgICAgICAgICAoMCwgbG9nZ2VyXzEubG9nKShsb2dnZXJfMS5Mb2dfVHlwZS5HZW5lcmFsLCBcIkl0cyBnZXR0aW5nIGJpZ2dlclwiKTsgLy8gbXkgcGVuaXNcbiAgICAgICAgICAgIC8vIG1ha2UgdGhlIGJ1ZmZlciBiaWdnZXJcbiAgICAgICAgICAgIGRpc3BsYXkuYmFja0J1ZmZlckFycmF5ID0gbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KGJ1ZmZlcl9zaXplKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBiYWNrQ2FudmFzID0gbmV3IE9mZnNjcmVlbkNhbnZhcyh3aWR0aCwgaGVpZ2h0KTtcbiAgICAgICAgY29uc3QgYmFja0N0eCA9IGJhY2tDYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpO1xuICAgICAgICBpZiAoYmFja0N0eCA9PT0gbnVsbClcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIjJEIGNvbnRleHQgaXMgbm90IHN1cHBvcnRlZFwiKTtcbiAgICAgICAgZGlzcGxheS5iYWNrQ3R4ID0gYmFja0N0eDtcbiAgICAgICAgZGlzcGxheS5iYWNrQ3R4LmltYWdlU21vb3RoaW5nRW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICBkaXNwbGF5LmJhY2tJbWFnZVdpZHRoID0gd2lkdGg7XG4gICAgICAgIGRpc3BsYXkuYmFja0ltYWdlSGVpZ2h0ID0gaGVpZ2h0O1xuICAgIH1cbiAgICBjb25zdCBidWZmZXIgPSBkaXNwbGF5LmJhY2tCdWZmZXJBcnJheS5zdWJhcnJheSgwLCBidWZmZXJfc2l6ZSk7XG4gICAgY29uc3QgYXJncyA9IHtcbiAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICBoZWlnaHQ6IGhlaWdodCxcbiAgICAgICAgYnVmZmVyOiBidWZmZXIsXG4gICAgICAgIG1vdXNlOiBtb3VzZSxcbiAgICAgICAgaGVhZGVyX3JlY3Q6IGhlYWRlcl9yZWN0LFxuICAgICAgICBub3RfbXlfcGFzc2lvbl9yZWN0OiBub3RfbXlfcGFzc2lvbl9yZWN0LFxuICAgIH07XG4gICAgY29uc3QgbnVtRmlsbGVkID0gZ28uR2V0TmV4dEZyYW1lKGFyZ3MpO1xuICAgIGlmIChudW1GaWxsZWQgIT09IGJ1ZmZlcl9zaXplKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEdldE5leHRGcmFtZSBnb3QgJHtudW1GaWxsZWR9YCk7XG4gICAgLy8gQHRzLWlnbm9yZSAvLyB3aHkgZG9zZSB0aGlzIGxpbmUgbWFrZSBhbiBlcnJvciBpbiBteSBlZGl0b3JcbiAgICBjb25zdCBpbWFnZURhdGEgPSBuZXcgSW1hZ2VEYXRhKGJ1ZmZlciwgd2lkdGgsIGhlaWdodCk7XG4gICAgLy8gaXMgdGhpcyBjb29sP1xuICAgIGRpc3BsYXkuYmFja0N0eC5wdXRJbWFnZURhdGEoaW1hZ2VEYXRhLCAwLCAwKTtcbiAgICAvLyBOT1RFIHRoaXMgd2lsbCBzdHJldGNoIHRoZSB0aGluZy5cbiAgICAvLyBjYW52YXMud2lkdGggbWlnaHQgY2hhbmdlIGR1cmluZyB0aGUgdGltZSB0aGlzIGlzIHJ1bm5pbmdcbiAgICBkaXNwbGF5LmN0eC5kcmF3SW1hZ2UoZGlzcGxheS5iYWNrQ3R4LmNhbnZhcywgMCwgMCwgZGlzcGxheS5jdHguY2FudmFzLndpZHRoLCBkaXNwbGF5LmN0eC5jYW52YXMuaGVpZ2h0KTtcbiAgICAvLyBpbWFnZURhdGEgPSBudWxsXG59XG5jb25zdCByZW5kZXJUaW1lcyA9IFtdO1xuY29uc3QgZGVsdGFUaW1lcyA9IFtdO1xuLy8gQ3JlZGl0OiBodHRwczovL2dpdGh1Yi5jb20vdHNvZGluZy9rb2lsXG5mdW5jdGlvbiByZW5kZXJEZWJ1Z0luZm8oZGlzcGxheSwgcmVuZGVyVGltZSwgZGVsdGFUaW1lKSB7XG4gICAgY29uc3QgZm9udFNpemUgPSAyODtcbiAgICBkaXNwbGF5LmN0eC5mb250ID0gYCR7Zm9udFNpemV9cHggYm9sZGA7XG4gICAgY29uc3QgbGFiZWxzID0gW107XG4gICAgcmVuZGVyVGltZXMucHVzaChyZW5kZXJUaW1lKTtcbiAgICBpZiAocmVuZGVyVGltZXMubGVuZ3RoID4gNjApIHtcbiAgICAgICAgcmVuZGVyVGltZXMuc2hpZnQoKTtcbiAgICB9XG4gICAgZGVsdGFUaW1lcy5wdXNoKGRlbHRhVGltZSk7XG4gICAgaWYgKGRlbHRhVGltZXMubGVuZ3RoID4gNjApIHtcbiAgICAgICAgZGVsdGFUaW1lcy5zaGlmdCgpO1xuICAgIH1cbiAgICBjb25zdCByZW5kZXJBdmcgPSByZW5kZXJUaW1lcy5yZWR1Y2UoKGEsIGIpID0+IGEgKyBiLCAwKSAvIHJlbmRlclRpbWVzLmxlbmd0aDtcbiAgICBjb25zdCBkZWx0YUF2ZyA9IGRlbHRhVGltZXMucmVkdWNlKChhLCBiKSA9PiBhICsgYiwgMCkgLyBkZWx0YVRpbWVzLmxlbmd0aDtcbiAgICBsYWJlbHMucHVzaChgRlBTOiAkeygxIC8gZGVsdGFBdmcgKiAxMDAwKS50b0ZpeGVkKDIpfWApO1xuICAgIGxhYmVscy5wdXNoKGBtcyBwZXIgZnJhbWU6ICR7ZGVsdGFBdmcudG9GaXhlZCgyKX1gKTtcbiAgICBsYWJlbHMucHVzaChgUmVuZGVyIFRpbWUgQXZnIChtcyk6ICR7cmVuZGVyQXZnLnRvRml4ZWQoMil9YCk7XG4gICAgbGFiZWxzLnB1c2goYFJlbmRlci9TZWMgKE1BWCk6ICR7KDEgLyByZW5kZXJBdmcgKiAxMDAwKS50b0ZpeGVkKDIpfWApO1xuICAgIGNvbnN0IHBhZGRpbmcgPSA3MDtcbiAgICBjb25zdCBzaGFkb3dPZmZzZXQgPSBmb250U2l6ZSAqIDAuMDY7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsYWJlbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZGlzcGxheS5jdHguZmlsbFN0eWxlID0gXCJibGFja1wiO1xuICAgICAgICBkaXNwbGF5LmN0eC5maWxsVGV4dChsYWJlbHNbaV0sIHBhZGRpbmcsIHBhZGRpbmcgKyBmb250U2l6ZSAqIGkpO1xuICAgICAgICBkaXNwbGF5LmN0eC5maWxsU3R5bGUgPSBcIndoaXRlXCI7XG4gICAgICAgIGRpc3BsYXkuY3R4LmZpbGxUZXh0KGxhYmVsc1tpXSwgcGFkZGluZyArIHNoYWRvd09mZnNldCwgcGFkZGluZyAtIHNoYWRvd09mZnNldCArIGZvbnRTaXplICogaSk7XG4gICAgfVxufVxuKGFzeW5jICgpID0+IHtcbiAgICBjb25zdCBnbyA9IGF3YWl0IEdldEdvRnVuY3Rpb25zKCk7XG4gICAgeyAvLyBIYW5kbGUgc2xpZGVyIHN0dWZmXG4gICAgICAgIGNvbnN0IHByb3BlcnRpZXMgPSBPYmplY3QuZW50cmllcyhnby5HZXRQcm9wZXJ0aWVzKCkpO1xuICAgICAgICBmdW5jdGlvbiBzZXRfcHJvcGVydHkobmFtZSwgdmFsdWUpIHtcbiAgICAgICAgICAgIC8vIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEyNzEwOTA1L2hvdy1kby1pLWR5bmFtaWNhbGx5LWFzc2lnbi1wcm9wZXJ0aWVzLXRvLWFuLW9iamVjdC1pbi10eXBlc2NyaXB0XG4gICAgICAgICAgICBjb25zdCBvYmogPSB7fTtcbiAgICAgICAgICAgIG9ialtuYW1lXSA9IHZhbHVlO1xuICAgICAgICAgICAgZ28uU2V0UHJvcGVydGllcyhvYmopO1xuICAgICAgICB9XG4gICAgICAgICgwLCBzZXR1cF9zbGlkZXJzXzEuc2V0dXBfc2xpZGVycykocHJvcGVydGllcywgc2V0X3Byb3BlcnR5KTtcbiAgICB9XG4gICAgeyAvLyBzZXR1cCBpbnB1dCBoYW5kbGluZy5cbiAgICAgICAgLy8gd2h5IGRvZXNuJ3QgdHlwZXNjcmlwdCBoYXZlIGFuIGVudW0gZm9yIHRoaXM/XG4gICAgICAgIGxldCBtb3VzZV9idXR0b25zO1xuICAgICAgICAoZnVuY3Rpb24gKG1vdXNlX2J1dHRvbnMpIHtcbiAgICAgICAgICAgIG1vdXNlX2J1dHRvbnNbbW91c2VfYnV0dG9uc1tcIk1PVVNFX0xFRlRcIl0gPSAwXSA9IFwiTU9VU0VfTEVGVFwiO1xuICAgICAgICAgICAgbW91c2VfYnV0dG9uc1ttb3VzZV9idXR0b25zW1wiTU9VU0VfTUlERExFXCJdID0gMV0gPSBcIk1PVVNFX01JRERMRVwiO1xuICAgICAgICAgICAgbW91c2VfYnV0dG9uc1ttb3VzZV9idXR0b25zW1wiTU9VU0VfUklHSFRcIl0gPSAyXSA9IFwiTU9VU0VfUklHSFRcIjtcbiAgICAgICAgfSkobW91c2VfYnV0dG9ucyB8fCAobW91c2VfYnV0dG9ucyA9IHt9KSk7XG4gICAgICAgIGNvbnN0IHJvb3QgPSBkb2N1bWVudC5nZXRSb290Tm9kZSgpO1xuICAgICAgICByb290LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIChldikgPT4geyBtb3VzZS5wb3MgPSB7IHg6IGV2LngsIHk6IGV2LnkgfTsgfSk7XG4gICAgICAgIC8vIHRoaXMgd2lsbCBicmVhayBpZiB0aGUgdXNlciBzbGlkZXMgdGhlcmUgbW91c2Ugb3V0c2lkZSBvZiB0aGUgc2NyZWVuIHdoaWxlIGNsaWNraW5nLCBidXQgdGhpcyBpcyB0aGUgd2ViLCBwZW9wbGUgZXhwZWN0IGl0IHRvIHN1Y2suXG4gICAgICAgIHJvb3QuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgKGV2KSA9PiB7XG4gICAgICAgICAgICBpZiAoZXYuYnV0dG9uID09IG1vdXNlX2J1dHRvbnMuTU9VU0VfTEVGVClcbiAgICAgICAgICAgICAgICBtb3VzZS5sZWZ0X2Rvd24gPSB0cnVlO1xuICAgICAgICAgICAgaWYgKGV2LmJ1dHRvbiA9PSBtb3VzZV9idXR0b25zLk1PVVNFX01JRERMRSlcbiAgICAgICAgICAgICAgICBtb3VzZS5taWRkbGVfZG93biA9IHRydWU7XG4gICAgICAgICAgICBpZiAoZXYuYnV0dG9uID09IG1vdXNlX2J1dHRvbnMuTU9VU0VfUklHSFQpXG4gICAgICAgICAgICAgICAgbW91c2UucmlnaHRfZG93biA9IHRydWU7XG4gICAgICAgIH0pO1xuICAgICAgICByb290LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCAoZXYpID0+IHtcbiAgICAgICAgICAgIGlmIChldi5idXR0b24gPT0gbW91c2VfYnV0dG9ucy5NT1VTRV9MRUZUKVxuICAgICAgICAgICAgICAgIG1vdXNlLmxlZnRfZG93biA9IGZhbHNlO1xuICAgICAgICAgICAgaWYgKGV2LmJ1dHRvbiA9PSBtb3VzZV9idXR0b25zLk1PVVNFX01JRERMRSlcbiAgICAgICAgICAgICAgICBtb3VzZS5taWRkbGVfZG93biA9IGZhbHNlO1xuICAgICAgICAgICAgaWYgKGV2LmJ1dHRvbiA9PSBtb3VzZV9idXR0b25zLk1PVVNFX1JJR0hUKVxuICAgICAgICAgICAgICAgIG1vdXNlLnJpZ2h0X2Rvd24gPSBmYWxzZTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8vIGNvbnN0IGNhbnZhc19jb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNhbnZhc19kaXZcIikgYXMgSFRNTENhbnZhc0VsZW1lbnQgfCBudWxsXG4gICAgY29uc3QgYm9pZENhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYm9pZF9jYW52YXNcIik7XG4gICAgaWYgKGJvaWRDYW52YXMgPT09IG51bGwpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vIGNhbnZhcyB3aXRoIGlkIGBib2lkX2NhbnZhc2AgaXMgZm91bmRcIik7XG4gICAgY29uc3QgY3R4ID0gYm9pZENhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XG4gICAgaWYgKGN0eCA9PT0gbnVsbClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiMkQgY29udGV4dCBpcyBub3Qgc3VwcG9ydGVkXCIpO1xuICAgIGN0eC5pbWFnZVNtb290aGluZ0VuYWJsZWQgPSBmYWxzZTtcbiAgICBjb25zdCBbYmFja0ltYWdlV2lkdGgsIGJhY2tJbWFnZUhlaWdodF0gPSBbY3R4LmNhbnZhcy53aWR0aCwgY3R4LmNhbnZhcy5oZWlnaHRdO1xuICAgIGNvbnN0IGJhY2tDYW52YXMgPSBuZXcgT2Zmc2NyZWVuQ2FudmFzKGJhY2tJbWFnZVdpZHRoLCBiYWNrSW1hZ2VIZWlnaHQpO1xuICAgIGNvbnN0IGJhY2tDdHggPSBiYWNrQ2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcbiAgICBpZiAoYmFja0N0eCA9PT0gbnVsbClcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiMkQgY29udGV4dCBpcyBub3Qgc3VwcG9ydGVkXCIpO1xuICAgIGJhY2tDdHguaW1hZ2VTbW9vdGhpbmdFbmFibGVkID0gZmFsc2U7XG4gICAgY29uc3QgYmFja0J1ZmZlckFycmF5ID0gbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KGJhY2tJbWFnZVdpZHRoICogYmFja0ltYWdlSGVpZ2h0ICogNCk7XG4gICAgY29uc3QgZGlzcGxheSA9IHtcbiAgICAgICAgY3R4LFxuICAgICAgICBiYWNrQ3R4LFxuICAgICAgICBiYWNrQnVmZmVyQXJyYXksXG4gICAgICAgIGJhY2tJbWFnZVdpZHRoLFxuICAgICAgICBiYWNrSW1hZ2VIZWlnaHQsXG4gICAgfTtcbiAgICBsZXQgcHJldlRpbWVzdGFtcCA9IDA7XG4gICAgY29uc3QgZnJhbWUgPSAodGltZXN0YW1wKSA9PiB7XG4gICAgICAgIGN0eC5jYW52YXMud2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcbiAgICAgICAgY3R4LmNhbnZhcy5oZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gICAgICAgIGNvbnN0IGRlbHRhVGltZSA9ICh0aW1lc3RhbXAgLSBwcmV2VGltZXN0YW1wKTtcbiAgICAgICAgcHJldlRpbWVzdGFtcCA9IHRpbWVzdGFtcDtcbiAgICAgICAgLy8gVE9ETyBEb24ndCBuZWVkIGRlbHRhIHRpbWUsIGJvaWQgdGhpbmcgZG9zZSBpdCBmb3IgdXM/IGNoYW5nZT9cbiAgICAgICAgY29uc3Qgc3RhcnRUaW1lID0gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgICAgIHJlbmRlckJvaWRzKGRpc3BsYXksIGdvKTtcbiAgICAgICAgY29uc3QgZW5kVGltZSA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgICAgICAvLyBJbiBtc1xuICAgICAgICBjb25zdCByZW5kZXJUaW1lID0gZW5kVGltZSAtIHN0YXJ0VGltZTtcbiAgICAgICAgaWYgKGxvZ2dlcl8xLkRFQlVHX0RJU1BMQVkpXG4gICAgICAgICAgICByZW5kZXJEZWJ1Z0luZm8oZGlzcGxheSwgcmVuZGVyVGltZSwgZGVsdGFUaW1lKTtcbiAgICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShmcmFtZSk7XG4gICAgfTtcbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKCh0aW1lc3RhbXApID0+IHtcbiAgICAgICAgcHJldlRpbWVzdGFtcCA9IHRpbWVzdGFtcDtcbiAgICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShmcmFtZSk7XG4gICAgfSk7XG59KSgpO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9
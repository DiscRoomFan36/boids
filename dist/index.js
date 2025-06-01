"use strict";
// typescript glue code.
const DEBUG_DISPLAY = false;
const DEBUG_SLIDERS = false;
var Log_Type;
(function (Log_Type) {
    Log_Type[Log_Type["General"] = 0] = "General";
    Log_Type[Log_Type["Debug_Display"] = 1] = "Debug_Display";
    Log_Type[Log_Type["Debug_Sliders"] = 2] = "Debug_Sliders";
})(Log_Type || (Log_Type = {}));
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
            if (DEBUG_DISPLAY)
                do_log = true;
            break;
        case Log_Type.Debug_Sliders:
            log_header = "DEBUG_SLIDERS";
            if (DEBUG_SLIDERS)
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
        log(Log_Type.General, "Oh god. were resizing the buffer");
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
// puts some sliders up to control some parameters
function setup_sliders(go) {
    const properties = go.GetProperties();
    log(Log_Type.Debug_Sliders, "typescript got properties", properties);
    const slider_container = document.getElementById("slideContainer");
    if (slider_container === null) {
        return; // just dont display it. for now
        // TODO
        // throw new Error("Cannot Get slider container");
    }
    // TODO for the slides that have a small range (like cohesion factor) make the value the square of the number.
    const entries = Object.entries(properties);
    entries.sort();
    for (const [key, value] of entries) {
        log(Log_Type.Debug_Sliders, `typescript: ${key}: ${value}`);
        const [min_s, max_s, default_s] = value.split(";");
        const [min, max, default_value] = [parseFloat(min_s), parseFloat(max_s), parseFloat(default_s)];
        log(Log_Type.Debug_Sliders, `    min: ${min}, max: ${max}, default: ${default_value}`);
        const id = `slider_${key}`;
        const para_id = `${id}_paragraph`;
        const paragraph_text = `${key.replace(/_/g, " ")}`;
        const initial_value = default_value;
        const map_range_to_slider_number = (x) => {
            return (x - min) / (max - min) * (1000 - 0) + 0;
        };
        const map_range_to_real_range = (x) => {
            return (x - 0) / (1000 - 0) * (max - min) + min;
        };
        // TODO a lot of numbers must be between 0-1, because sliders only use ints (look up if this is the case.) we will have to get creative
        // TODO toPrecision might not be the best function for formatting. margin is being messed with (1.0e+2)
        const html_string = `
            <p class="sliderKey" id="${para_id}">
                ${paragraph_text}: ${initial_value.toPrecision(2)}
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
            const slider_number = Number(slider_value_string);
            // const slider_number_mapped = map_range_to_real_range(slider_number)
            const slider_text = document.getElementById(para_id);
            if (slider_text === null)
                throw new Error(`could not find slider_text ${para_id}`);
            slider_text.textContent = `${paragraph_text}: ${map_range_to_real_range(slider_number).toPrecision(2)}`;
            // https://stackoverflow.com/questions/12710905/how-do-i-dynamically-assign-properties-to-an-object-in-typescript
            const obj = {};
            obj[key] = map_range_to_real_range(slider_number);
            log(Log_Type.Debug_Sliders, obj);
            go.SetProperties(obj);
        });
    }
}
(async () => {
    const go = await GetGoFunctions();
    setup_sliders(go);
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
        let startTime = performance.now();
        renderBoids(display, go);
        let endTime = performance.now();
        // In ms
        const renderTime = endTime - startTime;
        if (DEBUG_DISPLAY)
            renderDebugInfo(display, renderTime, deltaTime);
        window.requestAnimationFrame(frame);
    };
    window.requestAnimationFrame((timestamp) => {
        prevTimestamp = timestamp;
        window.requestAnimationFrame(frame);
    });
})();

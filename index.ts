// TODO: Something about this
// import { thing } from "./go_wasm";
// import { Go } from "./wasm_exec";
// Go()

// TODO
// if (typeof ImageDimensions !== 'function') {
//     throw new Error("No ImageDimensions functions");
// }

const DEBUG_DISPLAY = true
const DEBUG_SLIDERS = true

interface GoFunctions {
    SetProperties: (obj:Object) => number,
    GetProperties: () => Object,

    GetNextFrame: (width:number, height:number, buffer:Uint8ClampedArray) => number,
}

// NOTE we keep the @ts-ignore's in here
async function GetGoFunctions(): Promise<GoFunctions> {
    // @ts-ignore
    const go = new Go() // NOTE this comes from the wasm_exec.js thing

    const result = await WebAssembly.instantiateStreaming(fetch("dist/boid.wasm"), go.importObject)

    go.run(result.instance)

    return {
        // @ts-ignore
        SetProperties: SetProperties,
        // @ts-ignore
        GetProperties: GetProperties,

        // @ts-ignore
        GetNextFrame: GetNextFrame,
    }
}

// Credit to rexim for the inspiration: https://github.com/tsoding/koil
interface Display {
    ctx: CanvasRenderingContext2D;
    // TODO why is this an error?
    backCtx: OffscreenCanvasRenderingContext2D;

    // imageData: ImageData

    backBufferArray: Uint8ClampedArray
    backImageWidth: number
    backImageHeight: number
}

const NUM_COLOR_COMPONENTS = 4

const SQUISH_FACTOR = 1

function renderBoids(display: Display, go: GoFunctions) {
    const width  = Math.floor(display.ctx.canvas.width  / SQUISH_FACTOR);
    const height = Math.floor(display.ctx.canvas.height / SQUISH_FACTOR);

    const buffer_size = width * height * NUM_COLOR_COMPONENTS;

    // TODO handle the case where the width and height perfectly swap
    if (display.backImageWidth !== width || display.backImageHeight !== height) {
    // if (display.backBufferArray.length !== buffer_size) {
        console.log("Oh god. were resizing the buffer");

        if (display.backBufferArray.length < buffer_size) {
            // make the buffer bigger
            display.backBufferArray = new Uint8ClampedArray(buffer_size)
        }


        const backCanvas = new OffscreenCanvas(width, height)

        const backCtx = backCanvas.getContext("2d")
        if (backCtx === null) throw new Error("2D context is not supported");

        display.backCtx = backCtx
        display.backCtx.imageSmoothingEnabled = false

        display.backImageWidth = width
        display.backImageHeight = height
    }

    const buffer = display.backBufferArray.subarray(0, buffer_size)

    const numFilled = go.GetNextFrame(width, height, buffer);

    if (numFilled !== buffer_size) throw new Error(`GetNextFrame got ${numFilled}`);

    const imageData = new ImageData(buffer, width, height);

    // is this cool?
    display.backCtx.putImageData(imageData, 0, 0);

    // NOTE this will stretch the thing.
    // canvas.width might change during the time this is running
    display.ctx.drawImage(display.backCtx.canvas, 0, 0, display.ctx.canvas.width, display.ctx.canvas.height);

    // imageData = null
}

const renderTimes: number[] = []
const deltaTimes: number[] = []
// Credit: https://github.com/tsoding/koil
function renderDebugInfo(display: Display, renderTime: number, deltaTime: number) {
    const fontSize = 28;
    display.ctx.font = `${fontSize}px bold`;

    const labels = [];

    renderTimes.push(renderTime)
    if (renderTimes.length > 60) { renderTimes.shift() }

    deltaTimes.push(deltaTime)
    if (deltaTimes.length > 60) { deltaTimes.shift() }

    const renderAvg = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
    const deltaAvg = deltaTimes.reduce((a, b) => a + b, 0) / deltaTimes.length;


    labels.push(`FPS: ${(1/deltaAvg*1000).toFixed(2)}`);
    labels.push(`ms per frame: ${deltaAvg.toFixed(2)}`);

    labels.push(`Render Time Avg (ms): ${renderAvg.toFixed(2)}`);
    labels.push(`Render/Sec (MAX): ${(1/renderAvg*1000).toFixed(2)}`);


    const padding = 70;
    const shadowOffset = fontSize*0.06;
    for (let i = 0; i < labels.length; i++) {
        display.ctx.fillStyle = "black";
        display.ctx.fillText(labels[i], padding, padding + fontSize*i);
        display.ctx.fillStyle = "white";
        display.ctx.fillText(labels[i], padding + shadowOffset, padding - shadowOffset + fontSize*i);
    }
}

// puts some sliders up to control some parameters
function setup_sliders(go: GoFunctions) {
    const properties: Object = go.GetProperties();
    if (DEBUG_SLIDERS) console.log("typescript got properties", properties);

    const slider_container = document.getElementById("slideContainer");
    if (slider_container === null) throw new Error("Cannot Get slider container");


    for (const [key, value] of Object.entries(properties)) {

        if (DEBUG_SLIDERS) console.log(`typescript: ${key}: ${value}`);
        const [min_s, max_s] = (value as string).split("-");

        const [min, max] = [parseFloat(min_s), parseFloat(max_s)];
        if (DEBUG_SLIDERS) console.log(`    min: ${min}, max: ${max}`);

        const id = `slider_${key}`;
        const para_id = `${id}_paragraph`;
        const paragraph_text = `${key.replace(/_/g, " ")}`
        const initial_value = (min+max)/2

        // TODO set value based on something.
        // TODO a lot of numbers must be between 0-1, because sliders only use ints (look up if this is the case.) we will have to get creative
        const html_string = `
            <p class="sliderKey" id="${para_id}">${paragraph_text}: ${initial_value}</p>
            <input type="range" min="${min}" max="${max}" value="${initial_value}" class="slider" id="${id}">
        `;


        const new_thing = document.createElement("div");
        new_thing.className = "rangeHolder";
        new_thing.innerHTML = html_string;

        slider_container.appendChild(new_thing);

        const slider = document.getElementById(id) as HTMLInputElement | null;
        if (slider === null) throw new Error("Could not find the slider");


        slider.addEventListener("input", (event) => {
            const slider_value_string = (event.target as HTMLInputElement).value;

            const slider_number = Number(slider_value_string);

            const slider_text = document.getElementById(para_id) as HTMLParagraphElement | null;
            if (slider_text === null) throw new Error(`could not find slider_text ${para_id}`);

            slider_text.textContent = `${paragraph_text}: ${slider_number}`

            // https://stackoverflow.com/questions/12710905/how-do-i-dynamically-assign-properties-to-an-object-in-typescript
            const obj: Record<string,number> = {};
            obj[key] = slider_number;

            if (DEBUG_SLIDERS) console.log(obj);

            go.SetProperties(obj);
        })
    }
}

(async () => {
    const go = await GetGoFunctions()

    setup_sliders(go)

    const gameCanvas = document.getElementById("game") as HTMLCanvasElement | null
    if (gameCanvas === null) throw new Error("No canvas with id `game` is found")

    const ctx = gameCanvas.getContext("2d")
    if (ctx === null) throw new Error("2D context is not supported")
    ctx.imageSmoothingEnabled = false

    const [backImageWidth, backImageHeight] = [ctx.canvas.width, ctx.canvas.height]

    // TODO why is this an error?
    const backCanvas = new OffscreenCanvas(backImageWidth, backImageHeight)
    // const backCanvas = new OffscreenCanvas(1, 1)

    const backCtx = backCanvas.getContext("2d")
    if (backCtx === null) throw new Error("2D context is not supported")
    backCtx.imageSmoothingEnabled = false

    const backBufferArray = new Uint8ClampedArray(backImageWidth * backImageHeight * 4)

    const display: Display = {
        ctx,
        backCtx,

        backBufferArray,

        backImageWidth,
        backImageHeight,
    }

    let prevTimestamp = 0;
    const frame = (timestamp: number) => {
        ctx.canvas.width  = window.innerWidth;
        ctx.canvas.height = window.innerHeight;

        const deltaTime = (timestamp - prevTimestamp);
        // const time = timestamp/1000;
        prevTimestamp = timestamp;

        // TODO Don't need delta time, boid thing dose it for us? change?

        let startTime = performance.now()
        renderBoids(display, go)
        let endTime = performance.now() 

        // In ms
        const renderTime = endTime - startTime;

        if (DEBUG_DISPLAY) renderDebugInfo(display, renderTime, deltaTime)

        window.requestAnimationFrame(frame)
    }

    window.requestAnimationFrame((timestamp) => {
        prevTimestamp = timestamp
        window.requestAnimationFrame(frame)
    })
})()

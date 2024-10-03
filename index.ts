// TODO: Something about this
// import { thing } from "./go_wasm";
// import { Go } from "./wasm_exec";
// Go()

// TODO
// if (typeof ImageDimensions !== 'function') {
//     throw new Error("No ImageDimensions functions");
// }

const DEBUG_DISPLAY = true

// Credit to rexim for the inspiration: https://github.com/tsoding/koil
interface Display {
    ctx: CanvasRenderingContext2D;
    // TODO why is this an error?
    // @ts-ignore
    backCtx: OffscreenCanvasRenderingContext2D;

    // imageData: ImageData

    backBufferArray: Uint8ClampedArray
//     backImageWidth: number
//     backImageHeight: number
}

const NUM_COLOR_COMPONENTS = 4

const SQUISH_FACTOR = 1

function renderBoids(display: Display) {
    const width  = Math.floor(display.ctx.canvas.width  / SQUISH_FACTOR);
    const height = Math.floor(display.ctx.canvas.height / SQUISH_FACTOR);

    const buffer_size = width * height * NUM_COLOR_COMPONENTS;

    if (display.backBufferArray.length !== buffer_size) {
        if (display.backBufferArray.length < buffer_size) {
            // make the buffer bigger
            display.backBufferArray = new Uint8ClampedArray(buffer_size)
        }


        const backCanvas = new OffscreenCanvas(width, height)

        const backCtx = backCanvas.getContext("2d")
        if (backCtx === null) throw new Error("2D context is not supported");

        display.backCtx = backCtx
        display.backCtx.imageSmoothingEnabled = false

        // display.backBufferArray.slice()

        // display.backCtx = new OffscreenCanvas(width, height)
        // display.backBufferArray
    }

    const buffer = display.backBufferArray.subarray(0, buffer_size)

    // TODO find a way to pre-declare this
    // @ts-ignore
    const numFilled = GetNextFrame(width, height, buffer);

    // console.log(`width: ${width}, height: ${height}`)
    // console.log(`buffer_size: ${buffer_size}, numFilled: ${numFilled}`)
    // console.log(`backBufferArray.length: ${display.backBufferArray.length}`)

    if (numFilled !== buffer_size) throw new Error(`GetNextFrame got ${numFilled}`);


    // if (display.backBufferArray.length % (width * 4) !== 0) {
    //     console.log(`oh no ${display.backBufferArray.length % width * 4}`)
    // }

    const imageData = new ImageData(buffer, width, height);
    
    // is this cool?
    display.backCtx.putImageData(imageData, 0, 0);

    // NOTE this will stretch the thing.
    // canvas.width might change during the time this is running
    display.ctx.drawImage(display.backCtx.canvas, 0, 0, display.ctx.canvas.width, display.ctx.canvas.height);

    // imageData = null
}

const renderTimes: number[] = []
// Credit: https://github.com/tsoding/koil
function renderDebugInfo(display: Display, renderTime: number) {
    const fontSize = 28;
    display.ctx.font = `${fontSize}px bold`;
    const labels = [];

    renderTimes.push(renderTime)
    if (renderTimes.length > 60) {
        renderTimes.shift()
    }

    const renderAvg = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;

    // TODO Rolling average
    labels.push(`Render Time Avg (ms): ${renderAvg.toFixed(2)}`);
    labels.push(`Render/Sec (MAX): ${Math.floor(1/renderAvg*1000)}`);

    const padding = 70;
    const shadowOffset = fontSize*0.06;
    for (let i = 0; i < labels.length; i++) {
        display.ctx.fillStyle = "black";
        display.ctx.fillText(labels[i], padding, padding + fontSize*i);
        display.ctx.fillStyle = "white";
        display.ctx.fillText(labels[i], padding + shadowOffset, padding - shadowOffset + fontSize*i);
    }
}

(async () => {
    const gameCanvas = document.getElementById("game") as HTMLCanvasElement | null
    if (gameCanvas === null) throw new Error("No canvas with id `game` is found")

    // @ts-ignore
    const go = new Go() // NOTE this comes from the wasm_exec.js thing
    const result = await WebAssembly.instantiateStreaming(fetch("dist/boid.wasm"), go.importObject)
    go.run(result.instance)

    const ctx = gameCanvas.getContext("2d")
    if (ctx === null) throw new Error("2D context is not supported")
    ctx.imageSmoothingEnabled = false

    const [backImageWidth, backImageHeight] = [ctx.canvas.width, ctx.canvas.height]

    // TODO why is this an error?
    // @ts-ignore
    // const backCanvas = new OffscreenCanvas(backImageWidth, backImageHeight)
    const backCanvas = new OffscreenCanvas(1, 1)

    const backCtx = backCanvas.getContext("2d")
    if (backCtx === null) throw new Error("2D context is not supported")
    backCtx.imageSmoothingEnabled = false

    const backBufferArray = new Uint8ClampedArray(backImageWidth * backImageHeight * 4)

    const display: Display = {
        ctx,
        backCtx,

        backBufferArray,

        // backImageWidth,
        // backImageHeight,
    }

    let prevTimestamp = 0;
    const frame = (timestamp: number) => {
        ctx.canvas.width  = window.innerWidth;
        ctx.canvas.height = window.innerHeight;

        const deltaTime = (timestamp - prevTimestamp) / 1000;
        // const time = timestamp/1000;
        prevTimestamp = timestamp;
        
        // TODO Don't need delta time, boid thing dose it for us? change?
        
        let startTime = performance.now()
        
        renderBoids(display)
        
        let endTime = performance.now() 
        
        // TODO Display FPS
        // In ms
        const renderTime = endTime - startTime;

        if (DEBUG_DISPLAY) renderDebugInfo(display, renderTime)

        window.requestAnimationFrame(frame)
    }

    window.requestAnimationFrame((timestamp) => {
        prevTimestamp = timestamp
        window.requestAnimationFrame(frame)
    })
})()

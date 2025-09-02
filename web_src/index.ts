// typescript glue code.

import { Log_Type, log, DEBUG_DISPLAY } from "./logger";
import { setup_sliders } from "./setup_sliders";

interface Arguments {
    width:  number,
    height: number,
    buffer: Uint8ClampedArray,

    mouse: Mouse,

    // TODO make this an array.
    header_rect: Rect,
    not_my_passion_rect: Rect,
}

interface GoFunctions {
    SetProperties: (obj:Object) => number,
    GetProperties: () => Object,

    GetNextFrame: (args: Arguments) => number,
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
    backCtx: OffscreenCanvasRenderingContext2D;

    // imageData: ImageData

    backBufferArray: Uint8ClampedArray
    backImageWidth: number
    backImageHeight: number
}

const NUM_COLOR_COMPONENTS = 4

const SQUISH_FACTOR = 1



interface Vec2 {
    x: number,
    y: number,
};

interface Rect {
    x: number,
    y: number,
    width: number,
    height: number,
}

interface Mouse {
    pos:            Vec2,
    left_down:      boolean,
    middle_down:    boolean,
    right_down:     boolean,
};

const mouse: Mouse = {
    pos:            {x: 0, y: 0},
    left_down:      false,
    middle_down:    false,
    right_down:     false,
};


function get_header_rect_from_id(id: string): Rect {
    const header = document.getElementById(id) as HTMLHeadingElement | null
    if (header === null) throw new Error("no header text has been found (my name in the middle)")

    const dom_rect = header.getBoundingClientRect()
    return {
        x:      dom_rect.x,
        y:      dom_rect.y,
        width:  dom_rect.width,
        height: dom_rect.height,
    }
}


function renderBoids(display: Display, go: GoFunctions) {

    // get the position of the title text on screen
    const header_rect         = get_header_rect_from_id("my_name_in_the_middle")
    const not_my_passion_rect = get_header_rect_from_id("not_my_passion")
    // const rect = get_header_rect("my_name_in_the_middle")
    // console.log("rect", rect.x, rect.y, rect.width, rect.height);


    const width  = Math.floor(display.ctx.canvas.width  / SQUISH_FACTOR);
    const height = Math.floor(display.ctx.canvas.height / SQUISH_FACTOR);

    const buffer_size = width * height * NUM_COLOR_COMPONENTS;

    if (display.backImageWidth !== width || display.backImageHeight !== height) {
        log(Log_Type.General, "Oh god. were resizing the buffer")

        if (display.backBufferArray.length < buffer_size) {
            log(Log_Type.General, "Its getting bigger"); // my penis
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

    const buffer = display.backBufferArray.subarray(0, buffer_size);

    const args: Arguments = {
        width: width,
        height: height,
        buffer: buffer,

        mouse: mouse,

        header_rect: header_rect,
        not_my_passion_rect: not_my_passion_rect,
    };

    const numFilled = go.GetNextFrame(args);

    if (numFilled !== buffer_size) throw new Error(`GetNextFrame got ${numFilled}`);

    // @ts-ignore // why dose this line make an error in my editor
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

(async () => {
    const go = await GetGoFunctions()

    { // Handle slider stuff
        const properties = Object.entries(go.GetProperties())

        function set_property(name: string, value: number|boolean) {
            // https://stackoverflow.com/questions/12710905/how-do-i-dynamically-assign-properties-to-an-object-in-typescript
            const obj: Record<string,number|boolean> = {};
            obj[name] = value;

            go.SetProperties(obj);
        }

        setup_sliders(properties, set_property)
    }


    { // setup input handling.
        // why doesn't typescript have an enum for this?
        enum mouse_buttons {
            MOUSE_LEFT      = 0,
            MOUSE_MIDDLE    = 1,
            MOUSE_RIGHT     = 2,
        }

        const root = document.getRootNode() as HTMLHtmlElement
        root.addEventListener('mousemove', (ev) => { mouse.pos = {x: ev.x, y: ev.y} })
        // this will break if the user slides there mouse outside of the screen while clicking, but this is the web, people expect it to suck.
        root.addEventListener('mousedown', (ev) => {
            if (ev.button == mouse_buttons.MOUSE_LEFT)      mouse.left_down   = true;
            if (ev.button == mouse_buttons.MOUSE_MIDDLE)    mouse.middle_down = true;
            if (ev.button == mouse_buttons.MOUSE_RIGHT)     mouse.right_down  = true;
        });
        root.addEventListener('mouseup',   (ev) => {
            if (ev.button == mouse_buttons.MOUSE_LEFT)      mouse.left_down   = false;
            if (ev.button == mouse_buttons.MOUSE_MIDDLE)    mouse.middle_down = false;
            if (ev.button == mouse_buttons.MOUSE_RIGHT)     mouse.right_down  = false;
        });
    }


    // const canvas_container = document.getElementById("canvas_div") as HTMLCanvasElement | null
    const boidCanvas = document.getElementById("boid_canvas") as HTMLCanvasElement | null
    if (boidCanvas === null) throw new Error("No canvas with id `boid_canvas` is found")

    const ctx = boidCanvas.getContext("2d")
    if (ctx === null) throw new Error("2D context is not supported")
    ctx.imageSmoothingEnabled = false

    const [backImageWidth, backImageHeight] = [ctx.canvas.width, ctx.canvas.height]
    const backCanvas = new OffscreenCanvas(backImageWidth, backImageHeight)

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
        prevTimestamp = timestamp;

        // TODO Don't need delta time, boid thing dose it for us? change?

        const startTime = performance.now()
        renderBoids(display, go)
        const endTime = performance.now() 

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

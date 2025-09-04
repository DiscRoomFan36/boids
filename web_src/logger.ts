
// is it correct to have these here? this one effects
// drawing on the screen, not just logging? although we
// could make all logs appear on screen...
export const DEBUG_DISPLAY = true;
export const DEBUG_SLIDERS = false;

export enum Log_Type {
    General,

    Debug_Display,
    Debug_Sliders,
}

export function log(log_type: Log_Type, ...data: any[]): void {
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
            if (DEBUG_DISPLAY) do_log = true;
            break;


        case Log_Type.Debug_Sliders:
            log_header = "DEBUG_SLIDERS";
            if (DEBUG_SLIDERS) do_log = true;
            break;
    }

    if (do_log) {
        if (log_header != "") {
            console.log(`${log_header}: `, ...data);
        } else {
            console.log(...data);
        }
    }
}

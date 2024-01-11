// Makes a singleton GUI so multiple modules can use it.

import { GUI } from 'lil-gui';

let debugUI: GUI | null = null;

export function getDebugUI() {
    if (!debugUI) {
        debugUI = new GUI();
    }
    return debugUI;
}


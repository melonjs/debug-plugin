export default DebugPanel;
declare class DebugPanel extends Renderable {
    constructor(debugToggle?: number);
    checkbox: {};
    counters: Counters;
    visible: boolean;
    frameUpdateTime: number;
    frameDrawTime: number;
    version: string;
    canvas: HTMLCanvasElement | OffscreenCanvas;
    font_size: number;
    mod: number;
    font: BitmapText;
    debugToggle: number;
    keyHandler: import("eventemitter3").EventEmitter<string | symbol, any>;
    help_str: string;
    help_str_len: number;
    fps_str_len: number;
    memoryPositionX: number;
    frameUpdateStartTime: number;
    frameDrawStartTime: number;
    /**
     * patch system fn to draw debug information
     */
    patchSystemFn(): void;
    /**
     * show the debug panel
     */
    show(): void;
    /**
     * hide the debug panel
     */
    hide(): void;
    update(): boolean;
    onClick(e: any): void;
    drawQuadTreeNode(renderer: any, node: any): void;
    drawQuadTree(renderer: any): void;
    /** @private */
    private drawMemoryGraph;
    draw(renderer: any): void;
}
import { Renderable } from "melonjs";
import Counters from "./counters";
import { BitmapText } from "melonjs";

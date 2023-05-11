declare const DebugPanelPlugin_base: any;
/**
 * @classdesc
 * a simple debug panel plugin <br>
 * <img src="images/debugPanel.png"/> <br>
 * <b>usage : </b><br>
 * &bull; upon loading the debug panel, it will be automatically registered under me.plugins.debugPanel <br>
 * &bull; you can then press the default "s" key to show or hide the panel, or use me.plugins.debugPanel.show() and me.plugins.debugPanel.show(), or add #debug as a parameter to your URL e.g. http://myURL/index.html#debug <br>
 * &bull; default key can be configured using the following parameters in the url : e.g. http://myURL/index.html#debugToggleKey=d <br>
 * <b>the debug panel provides the following information : </b><br>
 * &bull; amount of total objects currently active in the current stage <br>
 * &bull; amount of draws operation <br>
 * &bull; amount of body shape (for collision) <br>
 * &bull; amount of bounding box <br>
 * &bull; amount of sprites objects <br>
 * &bull; amount of objects currently inactive in the the object pool <br>
 * &bull; memory usage (Heap Memory information is only available under Chrome) <br>
 * &bull; frame update time (in ms) <br>
 * &bull; frame draw time (in ms) <br>
 * &bull; current fps rate vs target fps <br>
 * additionally, using the checkbox in the panel it is also possible to display : <br>
 * &bull; the hitbox or bounding box for all objects <br>
 * &bull; current velocity vector <br>
 * &bull; quadtree spatial visualization <br>
 * @augments plugin.Base
 */
export class DebugPanelPlugin extends DebugPanelPlugin_base {
    [x: string]: any;
    constructor(debugToggle: any);
    version: string;
    panel: DebugPanel;
    /**
     * show the debug panel
     */
    show(): void;
    /**
     * hide the debug panel
     */
    hide(): void;
    /**
     * toggle the debug panel visibility state
     */
    toggle(): void;
}
import DebugPanel from "./debugPanel";
export {};
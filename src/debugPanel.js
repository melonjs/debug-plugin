import {
    video,
    Renderable,
    utils,
    BitmapText,
    Rect,
    event,
    plugin,
    plugins,
    Entity,
    Container,
    Camera2d,
    ImageLayer,
    Text,
    game,
    input,
    timer,
    Math,
    pool,
    collision
} from "melonjs";

import Counters from "./counters";
import fontImageSource from "./font/PressStart2P.png";
import fontDataSource from "./font/PressStart2P.fnt";

const DEBUG_HEIGHT = 50;

class DebugPanel extends Renderable {
    constructor(debugToggle = input.KEY.S) {
        // call the super constructor
        super(0, 0, video.renderer.getWidth(), DEBUG_HEIGHT );

        // enable collision and event detection
        this.isKinematic = false;

        // to hold the debug CheckBox
        // zone and status
        this.checkbox = {};

        // Useful counters
        this.counters = new Counters([
            "shapes",
            "sprites",
            "velocity",
            "bounds",
            "children"
        ]);

        // for z ordering
        // make it ridiculously high
        this.pos.z = Infinity;

        // visibility flag
        this.visible = false;

        // frame update time in ms
        this.frameUpdateTime = 0;

        // frame draw time in ms
        this.frameDrawTime = 0;

        // set the object GUID value
        this.GUID = "debug-" + utils.createGUID();

        // set the object entity name
        this.name = "debugPanel";

        // the debug panel version
        this.version = "__VERSION__";

        // persistent
        this.isPersistent = true;

        // a floating object
        this.floating = true;

        // renderable
        this.isRenderable = true;

        // always update, even when not visible
        this.alwaysUpdate = true;

        // WebGL/Canvas compatibility
        this.canvas = video.createCanvas(this.width, this.height, true);

        // create a default font, with fixed char width
        this.font_size = 10;
        this.mod = 2;
        if (this.width < 500) {
            this.font_size = 7;
            this.mod = this.mod * (this.font_size / 10);
        }

        // create the bitmapfont
        var fontImage = new Image();
        fontImage.src = fontImageSource;

        this.font = new BitmapText(0, 0, {
            fontData: fontDataSource,
            font: fontImage
        });
        this.font.name = "debugPanelFont";

        // clickable areas
        var hash = utils.getUriFragment();
        var size = 10 * this.mod;
        this.checkbox.renderHitBox = new Rect(250, 2,  size, size);
        this.checkbox.renderHitBox.selected = hash.hitbox || false;
        this.checkbox.renderVelocity = new Rect(250, 17, size, size);
        this.checkbox.renderVelocity.selected = hash.velocity || false;
        this.checkbox.renderQuadTree = new Rect(410, 2,  size, size);
        this.checkbox.renderVelocity.selected = hash.quadtree || false;

        // add some keyboard shortcuts
        this.debugToggle = debugToggle;
        this.keyHandler = event.on(event.KEYDOWN, (action, keyCode) => {
            if (keyCode === this.debugToggle) {
                plugins.debugPanel.toggle();
            }
        });

        // some internal string/length
        this.help_str        = "["+String.fromCharCode(32 + this.debugToggle)+"]show/hide";
        this.help_str_len    = this.font.measureText(this.help_str).width;
        this.fps_str_len     = this.font.measureText("00/00 fps").width;
        this.memoryPositionX = 325 * this.mod;

        // resize the panel if the browser is resized
        event.on(event.CANVAS_ONRESIZE, (w) => {
            this.resize(w, DEBUG_HEIGHT);
        });

        // few variables to keep track of time
        this.frameUpdateStartTime = 0;
        this.frameDrawStartTime = 0;
        this.frameUpdateTime = 0;
        this.frameDrawTime = 0;

        event.on(event.GAME_BEFORE_UPDATE, (time) => {
            this.frameUpdateStartTime = time;
        });
        event.on(event.GAME_AFTER_UPDATE, (time) => {
            this.frameUpdateTime = time - this.frameUpdateStartTime;
        });

        event.on(event.GAME_BEFORE_DRAW, (time) => {
            this.frameDrawStartTime = time;
            this.counters.reset();
        });
        event.on(event.GAME_AFTER_DRAW, (time) => {
            this.frameDrawTime = time - this.frameDrawStartTime;
        });


        this.anchorPoint.set(0, 0);

        //patch patch patch !
        this.patchSystemFn();
    }

    /**
     * patch system fn to draw debug information
     */
    patchSystemFn() {
        var _this = this;

        // patch renderable.js
        plugin.patch(Renderable, "postDraw", function (renderer) {

            // call the original Renderable.postDraw function
            this._patched.apply(this, arguments);

            // increment the sprites counter
            if (typeof this.image !== "undefined") {
                _this.counters.inc("sprites");
            }

            // increment the bound counter
            _this.counters.inc("bounds");

            // increment the children counter
            if (this instanceof Container) {
                _this.counters.inc("children");
            }

            // don't do anything else if the panel is hidden
            if (_this.visible) {

                // omit following object as they are patched later through different methods
                // XXX TODO: make this patched method more generic at Renderable level
                if (!(this instanceof Entity) && !(this.ancestor instanceof Entity) && !(this instanceof Text) &&
                    !(this instanceof BitmapText) && !(this instanceof Camera2d)
                    && !(this instanceof ImageLayer)) {

                    // draw the renderable bounding box
                    if (_this.checkbox.renderHitBox.selected && this.getBounds().isFinite()) {

                        if (typeof this.ancestor !== "undefined") {
                            var absolutePosition = this.ancestor.getAbsolutePosition();

                            renderer.save();

                            // if this object of this renderable parent is not the root container
                            if (!this.root && !this.ancestor.root && this.ancestor.floating) {
                                renderer.translate(
                                    -absolutePosition.x,
                                    -absolutePosition.y
                                );
                            }
                        }

                        renderer.setColor("green");
                        renderer.stroke(this.getBounds());

                        // the sprite mask if defined
                        if (typeof this.mask !== "undefined") {
                            renderer.setColor("orange");
                            renderer.stroke(this.mask);
                        }

                        if (typeof this.body !== "undefined") {
                            var bounds = this.getBounds();
                            renderer.translate(bounds.x, bounds.y);

                            renderer.setColor("orange");
                            renderer.stroke(this.body.getBounds());

                            // draw all defined shapes
                            renderer.setColor("red");
                            for (var i = this.body.shapes.length, shape; i--, (shape = this.body.shapes[i]);) {
                                renderer.stroke(shape);
                                _this.counters.inc("shapes");
                            }
                            renderer.translate(-bounds.x, -bounds.y);
                        }

                        if (typeof this.ancestor !== "undefined") {
                            renderer.restore();
                        }
                    }
                }
            }
        });

        plugin.patch(BitmapText, "draw", function (renderer) {
            // call the original Sprite.draw function
            this._patched.apply(this, arguments);

            // draw the font rectangle
            if (_this.visible && _this.checkbox.renderHitBox.selected && this.name !== "debugPanelFont") {
                var bounds = this.getBounds();

                if (typeof this.ancestor !== "undefined") {
                    var ax = this.anchorPoint.x * bounds.width,
                        ay = this.anchorPoint.y * bounds.height;
                    // translate back as the bounds position
                    // is already adjusted to the anchor Point
                    renderer.save();
                    renderer.translate(ax, ay);
                }

                renderer.setColor("green");
                renderer.stroke(bounds);

                if (typeof this.ancestor !== "undefined") {
                    renderer.restore();
                }
            }
        });

        // patch text.js
        plugin.patch(Text, "draw", function (renderer) {
            // call the original Text.draw function
            this._patched.apply(this, arguments);

            if (_this.visible && _this.checkbox.renderHitBox.selected) {
                var bounds = this.getBounds();

                if (typeof this.ancestor !== "undefined") {
                    var absolutePosition = this.ancestor.getAbsolutePosition();

                    renderer.save();

                    // if this object of this renderable parent is not the root container
                    if (!this.root && !this.ancestor.root && this.ancestor.floating) {
                        renderer.translate(
                            -absolutePosition.x,
                            -absolutePosition.y
                        );
                    }
                }

                renderer.setColor("green");
                renderer.stroke(bounds);
            }
        });

        // patch entities.js
        plugin.patch(Entity, "postDraw", function (renderer) {
            // don't do anything else if the panel is hidden
            if (_this.visible) {

                // check if debug mode is enabled
                if (_this.checkbox.renderHitBox.selected) {

                    renderer.save();


                    if (typeof this.ancestor !== "undefined") {
                        var absolutePosition = this.ancestor.getAbsolutePosition();

                        // if this object of this renderable parent is not the root container
                        if (!this.root && !this.ancestor.root && this.ancestor.floating) {
                            renderer.translate(
                                -absolutePosition.x,
                                -absolutePosition.y
                            );
                        }
                    }

                    if (this.renderable instanceof Renderable) {
                        renderer.setColor("green");
                        renderer.stroke(this.renderable.getBounds());
                    }

                    renderer.translate(
                        this.body.getBounds().x,
                        this.body.getBounds().y
                    );

                    renderer.translate(
                        -this.anchorPoint.x * this.body.getBounds().width,
                        -this.anchorPoint.y * this.body.getBounds().height
                    );

                    // draw the bounding rect shape
                    renderer.setColor("orange");
                    renderer.stroke(this.body.getBounds());

                    // draw all defined shapes
                    renderer.setColor("red");
                    for (var i = this.body.shapes.length, shape; i--, (shape = this.body.shapes[i]);) {
                        renderer.stroke(shape);
                        _this.counters.inc("shapes");
                    }

                    renderer.restore();

                }

                if (_this.checkbox.renderVelocity.selected && (this.body.vel.x || this.body.vel.y)) {
                    var bounds = this.body.getBounds();
                    var hWidth = bounds.width / 2;
                    var hHeight = bounds.height / 2;

                    renderer.save();
                    renderer.setLineWidth(1);

                    renderer.setColor("blue");
                    renderer.translate(0, -hHeight);
                    renderer.strokeLine(0, 0, ~~(this.body.vel.x * hWidth), ~~(this.body.vel.y * hHeight));
                    _this.counters.inc("velocity");

                    renderer.restore();
                }
            }
            // call the original Entity.postDraw function
            this._patched.apply(this, arguments);
        });
    }

    /**
     * show the debug panel
     */
    show() {
        if (!this.visible) {
            // add the debug panel to the game world
            game.world.addChild(this, Infinity);
            // register a mouse event for the checkboxes
            input.registerPointerEvent("pointerdown", this, this.onClick.bind(this));
            // mark it as visible
            this.visible = true;
            // force repaint
            game.repaint();
        }
    }

    /**
     * hide the debug panel
     */
    hide() {
        if (this.visible) {
            // release the mouse event for the checkboxes
            input.releasePointerEvent("pointerdown", this);
            // remove the debug panel from the game world
            game.world.removeChild(this, true);
            // mark it as invisible
            this.visible = false;
            // force repaint
            game.repaint();
        }
    }

    update() {
        // update the FPS counter
        timer.countFPS();

        return this.visible;
    }

    onClick(e)  {
        // check the clickable areas
        if (this.checkbox.renderHitBox.contains(e.gameX, e.gameY)) {
            this.checkbox.renderHitBox.selected = !this.checkbox.renderHitBox.selected;
        } else if (this.checkbox.renderVelocity.contains(e.gameX, e.gameY)) {
            // does nothing for now, since velocity is
            // rendered together with hitboxes (is a global debug flag required?)
            this.checkbox.renderVelocity.selected = !this.checkbox.renderVelocity.selected;
        } else if (this.checkbox.renderQuadTree.contains(e.gameX, e.gameY)) {
            this.checkbox.renderQuadTree.selected = !this.checkbox.renderQuadTree.selected;
        }
        // force repaint
        game.repaint();
    }

    drawQuadTreeNode(renderer, node) {
        var bounds = node.bounds;

        // draw the current bounds
        if (node.nodes.length === 0) {
            // cap the alpha value to 0.4 maximum
            var _alpha = (node.objects.length * 0.4) / collision.maxChildren;
            if (_alpha > 0.0) {
                renderer.save();
                renderer.setColor("rgba(255,0,0," + _alpha + ")");
                renderer.fillRect(bounds.left, bounds.top, bounds.width, bounds.height);
                renderer.restore();
            }
        } else {
            //has subnodes? drawQuadtree them!
            for (var i = 0; i < node.nodes.length; i++) {
                this.drawQuadTreeNode(renderer, node.nodes[i]);
            }
        }
    }

    drawQuadTree(renderer) {
        var x = game.viewport.pos.x;
        var y = game.viewport.pos.y;

        renderer.translate(-x, -y);

        this.drawQuadTreeNode(renderer, game.world.broadphase);

        renderer.translate(x, y);
    }

    /** @private */
    drawMemoryGraph(renderer, endX) {
        if (window && window.performance && window.performance.memory) {
            var usedHeap  =  Math.round(window.performance.memory.usedJSHeapSize / 1048576, 2);
            var totalHeap =  Math.round(window.performance.memory.totalJSHeapSize / 1048576, 2);
            var maxLen = ~~(endX - this.memoryPositionX - 5);
            var len = maxLen * (usedHeap / totalHeap);

            renderer.setColor("#0065AD");
            renderer.fillRect(this.memoryPositionX, 0, maxLen, 20);
            renderer.setColor("#3AA4F0");
            renderer.fillRect(this.memoryPositionX + 1, 1, len - 1, 17);

            this.font.draw(renderer, "Heap : " + usedHeap + "/" + totalHeap + " MB", this.memoryPositionX + 5, 2 * this.mod);
        } else {
            // Heap Memory information not available
            this.font.draw(renderer, "Heap : ??/?? MB", this.memoryPositionX, 2 * this.mod);
        }
        this.font.draw(renderer, "Pool : " + pool.getInstanceCount(), this.memoryPositionX, 10 * this.mod);
    }

    draw(renderer) {
        renderer.save();

        // draw the QuadTree (before the panel)
        if (this.checkbox.renderQuadTree.selected === true) {
            this.drawQuadTree(renderer);
        }

        // draw the panel
        renderer.setGlobalAlpha(0.5);
        renderer.setColor("black");
        renderer.fillRect(
            this.left,  this.top,
            this.width, this.height
        );
        renderer.setGlobalAlpha(1.0);
        renderer.setColor("white");

        this.font.textAlign = "left";

        this.font.draw(renderer, "#objects : " + game.world.children.length, 5 * this.mod, 2 * this.mod);
        this.font.draw(renderer, "#draws   : " + game.world.drawCount, 5 * this.mod, 10 * this.mod);

        // debug checkboxes
        this.font.draw(renderer, "?hitbox   [" + (this.checkbox.renderHitBox.selected ? "x" : " ") + "]",   75 * this.mod, 2 * this.mod);
        this.font.draw(renderer, "?velocity [" + (this.checkbox.renderVelocity.selected ? "x" : " ") + "]", 75 * this.mod, 10 * this.mod);

        this.font.draw(renderer, "?QuadTree [" + (this.checkbox.renderQuadTree.selected ? "x" : " ") + "]", 150 * this.mod, 2 * this.mod);

        // draw the update duration
        this.font.draw(renderer, "Update : " + this.frameUpdateTime.toFixed(2) + " ms", 225 * this.mod, 2 * this.mod);
        // draw the draw duration
        this.font.draw(renderer, "Draw   : " + this.frameDrawTime.toFixed(2) + " ms", 225 * this.mod, 10 * this.mod);


        // Draw color code hints (not supported with bitmapfont)
        //this.font.fillStyle.copy("red");
        this.font.draw(renderer, "Shapes   : " + this.counters.get("shapes"), 5 * this.mod, 17 * this.mod);

        //this.font.fillStyle.copy("green");
        this.font.draw(renderer, "Sprites   : " + this.counters.get("sprites"), 75 * this.mod, 17 * this.mod);

        //this.font.fillStyle.copy("blue");
        this.font.draw(renderer, "Velocity  : " + this.counters.get("velocity"), 150 * this.mod, 17 * this.mod);

        //this.font.fillStyle.copy("orange");
        this.font.draw(renderer, "Bounds : " + this.counters.get("bounds"), 225 * this.mod, 17 * this.mod);

        //this.font.fillStyle.copy("purple");
        this.font.draw(renderer, "Children : " + this.counters.get("children"), 325 * this.mod, 17 * this.mod);

        // Reset font style
        //this.font.setFont("courier", this.font_size, "white");

        // draw the memory heap usage
        var endX = this.width - 5;
        this.drawMemoryGraph(renderer, endX - this.help_str_len);

        this.font.textAlign = "right";

        // some help string
        this.font.draw(renderer, this.help_str, endX, 17 * this.mod);

        //fps counter
        var fps_str = timer.fps + "/" + timer.maxfps + " fps";
        this.font.draw(renderer, fps_str, endX, 2 * this.mod);

        renderer.restore();
    }

    onDestroyEvent() {
        // hide the panel
        this.hide();
        // unbind keys event
        input.unbindKey(this.toggleKey);
    }
}

export default DebugPanel;

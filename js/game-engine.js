const GameEngine = {
    canvas: null,
    ctx: null,
    container: null,
    game: null,
    animId: null,
    running: false,
    lastTime: 0,
    domLayer: null,
    width: 0,
    height: 0,
    touches: [],
    mouse: { x: 0, y: 0, down: false },
    keys: new Set(),

    init(canvas, container, game) {
        this.canvas = canvas;
        this.container = container;
        this.game = game;
        this.running = false;

        if (this.domLayer) { this.domLayer.remove(); this.domLayer = null; }

        if (game.useDom) {
            canvas.style.display = 'none';
            this.domLayer = document.createElement('div');
            this.domLayer.className = 'dom-game';
            container.appendChild(this.domLayer);
        } else {
            canvas.style.display = 'block';
            this.resizeCanvas();
        }

        this.bindInputs();
    },

    resizeCanvas() {
        const c = this.container;
        const size = Math.min(c.clientWidth - 16, c.clientHeight - 16, 460);
        const w = this.game.aspectRatio ? size : size;
        const h = this.game.aspectRatio ? size / this.game.aspectRatio : size;
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = w * dpr;
        this.canvas.height = h * dpr;
        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';
        this.width = w * dpr;
        this.height = h * dpr;
        this.ctx = this.canvas.getContext('2d');
        this.ctx.scale(dpr, dpr);
        this.logicalWidth = w;
        this.logicalHeight = h;
    },

    bindInputs() {
        this.canvas.onpointerdown = (e) => this.handlePointer('down', e);
        this.canvas.onpointermove = (e) => this.handlePointer('move', e);
        this.canvas.onpointerup = (e) => this.handlePointer('up', e);
        this.canvas.onpointerleave = (e) => this.handlePointer('up', e);

        this._keydown = (e) => {
            this.keys.add(e.key);
            if (this.game && this.game.onKey) this.game.onKey(e.key, true, this);
        };
        this._keyup = (e) => {
            this.keys.delete(e.key);
            if (this.game && this.game.onKey) this.game.onKey(e.key, false, this);
        };
        document.addEventListener('keydown', this._keydown);
        document.addEventListener('keyup', this._keyup);
    },

    handlePointer(type, e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.mouse = { x, y, down: type !== 'up' };
        if (this.game) {
            if (type === 'down' && this.game.onPointerDown) this.game.onPointerDown(x, y, this);
            if (type === 'move' && this.game.onPointerMove) this.game.onPointerMove(x, y, this);
            if (type === 'up' && this.game.onPointerUp) this.game.onPointerUp(x, y, this);
        }
    },

    startLoop() {
        this.running = true;
        this.lastTime = performance.now();
        const loop = (time) => {
            if (!this.running) return;
            const dt = Math.min((time - this.lastTime) / 1000, 0.1);
            this.lastTime = time;
            if (this.game && this.game.update) this.game.update(dt, this);
            if (this.game && this.game.render) {
                this.ctx.clearRect(0, 0, this.logicalWidth, this.logicalHeight);
                this.game.render(this.ctx, this);
            }
            this.animId = requestAnimationFrame(loop);
        };
        this.animId = requestAnimationFrame(loop);
    },

    stop() {
        this.running = false;
        if (this.animId) cancelAnimationFrame(this.animId);
        this.animId = null;
        document.removeEventListener('keydown', this._keydown);
        document.removeEventListener('keyup', this._keyup);
        if (this.game && this.game.cleanup) this.game.cleanup(this);
        if (this.domLayer) { this.domLayer.remove(); this.domLayer = null; }
        this.canvas.onpointerdown = null;
        this.canvas.onpointermove = null;
        this.canvas.onpointerup = null;
        this.canvas.onpointerleave = null;
    },

    drawRoundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
};

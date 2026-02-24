// Puzzle Games (10)
(function() {

// 1. 一筆書き (One Stroke)
App.registerGame({
    id: 'one-stroke', name: '一筆書き', nameEn: 'One Stroke', icon: '✏️',
    category: 'puzzle', desc: '全ての辺を一度だけ通ってなぞろう',
    levels: null, currentLevel: 0, nodes: [], edges: [], visited: [], path: [], dragging: false,
    start(engine) {
        this.currentLevel = 0;
        this.generateLevel();
        engine.startLoop();
    },
    generateLevel() {
        const lvl = this.currentLevel;
        const patterns = [
            { n: [[.5,.2],[.2,.8],[.8,.8]], e: [[0,1],[1,2],[2,0]] },
            { n: [[.2,.2],[.8,.2],[.8,.8],[.2,.8]], e: [[0,1],[1,2],[2,3],[3,0],[0,2]] },
            { n: [[.5,.1],[.2,.4],[.8,.4],[.2,.8],[.8,.8]], e: [[0,1],[0,2],[1,2],[1,3],[2,4],[3,4]] },
            { n: [[.2,.2],[.5,.2],[.8,.2],[.2,.5],[.5,.5],[.8,.5],[.2,.8],[.5,.8],[.8,.8]], e: [[0,1],[1,2],[3,4],[4,5],[6,7],[7,8],[0,3],[1,4],[2,5],[3,6],[4,7],[5,8]] },
            { n: [[.5,.1],[.15,.35],[.85,.35],[.25,.7],[.75,.7],[.5,.95]], e: [[0,1],[0,2],[1,2],[1,3],[2,4],[3,4],[3,5],[4,5],[1,4],[2,3]] },
            { n: [[.3,.15],[.7,.15],[.15,.45],[.5,.45],[.85,.45],[.3,.75],[.7,.75],[.5,.95]], e: [[0,1],[0,2],[0,3],[1,3],[1,4],[2,3],[3,4],[2,5],[3,5],[3,6],[4,6],[5,6],[5,7],[6,7]] },
        ];
        const p = patterns[lvl % patterns.length];
        const s = GameEngine.logicalWidth || 400;
        this.nodes = p.n.map(n => ({ x: n[0] * s, y: n[1] * s }));
        this.edges = p.e.map(e => ({ a: e[0], b: e[1] }));
        this.visited = new Array(this.edges.length).fill(false);
        this.path = [];
        this.dragging = false;
    },
    getNodeAt(x, y) {
        for (let i = 0; i < this.nodes.length; i++) {
            const n = this.nodes[i];
            if (Math.hypot(x - n.x, y - n.y) < 25) return i;
        }
        return -1;
    },
    getEdge(a, b) {
        for (let i = 0; i < this.edges.length; i++) {
            const e = this.edges[i];
            if ((e.a === a && e.b === b) || (e.a === b && e.b === a)) return i;
        }
        return -1;
    },
    onPointerDown(x, y, engine) {
        const n = this.getNodeAt(x, y);
        if (n >= 0) {
            this.path = [n];
            this.visited = new Array(this.edges.length).fill(false);
            this.dragging = true;
        }
    },
    onPointerMove(x, y, engine) {
        if (!this.dragging) return;
        const n = this.getNodeAt(x, y);
        if (n >= 0 && n !== this.path[this.path.length - 1]) {
            const last = this.path[this.path.length - 1];
            const ei = this.getEdge(last, n);
            if (ei >= 0 && !this.visited[ei]) {
                this.visited[ei] = true;
                this.path.push(n);
                if (this.visited.every(v => v)) {
                    this.dragging = false;
                    this.currentLevel++;
                    App.setScore(this.currentLevel);
                    App.saveBestScore(this.id, this.currentLevel);
                    setTimeout(() => this.generateLevel(), 600);
                }
            }
        }
    },
    onPointerUp() { this.dragging = false; },
    update(dt, engine) {},
    render(ctx, engine) {
        const w = engine.logicalWidth, h = engine.logicalHeight;
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, w, h);
        // edges
        for (let i = 0; i < this.edges.length; i++) {
            const e = this.edges[i];
            const a = this.nodes[e.a], b = this.nodes[e.b];
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = this.visited[i] ? '#4ecdc4' : 'rgba(255,255,255,0.2)';
            ctx.lineWidth = this.visited[i] ? 4 : 2;
            ctx.stroke();
        }
        // nodes
        for (let i = 0; i < this.nodes.length; i++) {
            const n = this.nodes[i];
            const inPath = this.path.includes(i);
            ctx.beginPath();
            ctx.arc(n.x, n.y, inPath ? 14 : 10, 0, Math.PI * 2);
            ctx.fillStyle = inPath ? '#6c63ff' : '#444';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        // level text
        ctx.fillStyle = '#8888a0';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`レベル ${this.currentLevel + 1}`, w / 2, h - 15);
    },
    cleanup() { this.dragging = false; }
});

// 2. 15パズル (Sliding Puzzle)
App.registerGame({
    id: 'slide-puzzle', name: '15パズル', nameEn: 'Sliding Puzzle', icon: '🔢',
    category: 'puzzle', desc: '数字を順番に並べ替えよう',
    tiles: [], emptyIdx: 15, moves: 0, size: 4, won: false,
    start(engine) {
        this.size = 4;
        this.moves = 0;
        this.won = false;
        this.tiles = Array.from({ length: 16 }, (_, i) => i);
        for (let i = 200; i > 0; i--) {
            const neighbors = this.getNeighbors(this.tiles.indexOf(0));
            const pick = neighbors[Math.floor(Math.random() * neighbors.length)];
            const zi = this.tiles.indexOf(0);
            [this.tiles[zi], this.tiles[pick]] = [this.tiles[pick], this.tiles[zi]];
        }
        engine.startLoop();
    },
    getNeighbors(idx) {
        const r = Math.floor(idx / 4), c = idx % 4, n = [];
        if (r > 0) n.push(idx - 4);
        if (r < 3) n.push(idx + 4);
        if (c > 0) n.push(idx - 1);
        if (c < 3) n.push(idx + 1);
        return n;
    },
    onPointerDown(x, y, engine) {
        if (this.won) return;
        const s = engine.logicalWidth;
        const ts = s / 4;
        const c = Math.floor(x / ts), r = Math.floor(y / ts);
        if (c < 0 || c > 3 || r < 0 || r > 3) return;
        const idx = r * 4 + c;
        const zi = this.tiles.indexOf(0);
        if (this.getNeighbors(zi).includes(idx)) {
            [this.tiles[zi], this.tiles[idx]] = [this.tiles[idx], this.tiles[zi]];
            this.moves++;
            App.setScore(this.moves);
            if (this.tiles.every((v, i) => v === (i + 1) % 16)) {
                this.won = true;
                App.saveBestScore(this.id, this.moves, false);
                App.showOverlay('🎉 クリア！', `${this.moves}手でクリア！`, [
                    { text: 'もう一度', onClick: () => { App.el.overlay.classList.add('hidden'); this.start(GameEngine); } }
                ]);
            }
        }
    },
    update() {},
    render(ctx, engine) {
        const w = engine.logicalWidth, h = engine.logicalHeight;
        const ts = w / 4;
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 16; i++) {
            const v = this.tiles[i];
            if (v === 0) continue;
            const r = Math.floor(i / 4), c = i % 4;
            const x = c * ts + 2, y = r * ts + 2;
            ctx.fillStyle = '#6c63ff';
            GameEngine.drawRoundRect(ctx, x, y, ts - 4, ts - 4, 8);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${ts * 0.35}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(v, c * ts + ts / 2, r * ts + ts / 2);
        }
    }
});

// 3. ライツアウト (Lights Out)
App.registerGame({
    id: 'lights-out', name: 'ライツアウト', nameEn: 'Lights Out', icon: '💡',
    category: 'puzzle', desc: '全てのライトを消そう',
    grid: [], size: 5, moves: 0, won: false,
    start(engine) {
        this.size = 5;
        this.moves = 0;
        this.won = false;
        this.grid = Array.from({ length: 25 }, () => false);
        for (let i = 0; i < 8; i++) {
            this.toggle(Math.floor(Math.random() * 25));
        }
        if (this.grid.every(v => !v)) this.grid[12] = true;
        engine.startLoop();
    },
    toggle(idx) {
        const r = Math.floor(idx / 5), c = idx % 5;
        const flip = (rr, cc) => { if (rr >= 0 && rr < 5 && cc >= 0 && cc < 5) this.grid[rr * 5 + cc] = !this.grid[rr * 5 + cc]; };
        flip(r, c); flip(r - 1, c); flip(r + 1, c); flip(r, c - 1); flip(r, c + 1);
    },
    onPointerDown(x, y, engine) {
        if (this.won) return;
        const s = engine.logicalWidth;
        const ts = s / 5;
        const c = Math.floor(x / ts), r = Math.floor(y / ts);
        if (c < 0 || c >= 5 || r < 0 || r >= 5) return;
        this.toggle(r * 5 + c);
        this.moves++;
        App.setScore(this.moves);
        if (this.grid.every(v => !v)) {
            this.won = true;
            App.saveBestScore(this.id, this.moves, false);
            App.showOverlay('🎉 クリア！', `${this.moves}手でクリア！`, [
                { text: 'もう一度', onClick: () => { App.el.overlay.classList.add('hidden'); this.start(GameEngine); } }
            ]);
        }
    },
    update() {},
    render(ctx, engine) {
        const w = engine.logicalWidth, h = engine.logicalHeight;
        const ts = w / 5;
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 25; i++) {
            const r = Math.floor(i / 5), c = i % 5;
            ctx.fillStyle = this.grid[i] ? '#ffe66d' : '#2a2a4a';
            GameEngine.drawRoundRect(ctx, c * ts + 3, r * ts + 3, ts - 6, ts - 6, 8);
            ctx.fill();
            if (this.grid[i]) {
                ctx.shadowColor = '#ffe66d';
                ctx.shadowBlur = 15;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
    }
});

// 4. カラーフラッド (Color Flood)
App.registerGame({
    id: 'color-flood', name: 'カラーフラッド', nameEn: 'Color Flood', icon: '🎨',
    category: 'puzzle', desc: '25手以内に全て同じ色にしよう',
    grid: [], size: 14, moves: 0, maxMoves: 25, won: false,
    colors: ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22'],
    start(engine) {
        this.size = 14;
        this.moves = 0;
        this.won = false;
        this.grid = Array.from({ length: this.size * this.size }, () => Math.floor(Math.random() * 6));
        engine.startLoop();
    },
    flood(newColor) {
        const oldColor = this.grid[0];
        if (oldColor === newColor) return;
        const visited = new Set();
        const stack = [0];
        while (stack.length) {
            const idx = stack.pop();
            if (visited.has(idx)) continue;
            if (this.grid[idx] !== oldColor) continue;
            visited.add(idx);
            this.grid[idx] = newColor;
            const r = Math.floor(idx / this.size), c = idx % this.size;
            if (r > 0) stack.push(idx - this.size);
            if (r < this.size - 1) stack.push(idx + this.size);
            if (c > 0) stack.push(idx - 1);
            if (c < this.size - 1) stack.push(idx + 1);
        }
        this.moves++;
        App.setScore(`${this.moves}/${this.maxMoves}`);
        if (this.grid.every(v => v === newColor)) {
            this.won = true;
            App.saveBestScore(this.id, this.moves, false);
            App.showOverlay('🎉 クリア！', `${this.moves}手でクリア！`, [
                { text: 'もう一度', onClick: () => { App.el.overlay.classList.add('hidden'); this.start(GameEngine); } }
            ]);
        } else if (this.moves >= this.maxMoves) {
            App.showOverlay('😅 ゲームオーバー', `${this.maxMoves}手を超えました`, [
                { text: 'リトライ', onClick: () => { App.el.overlay.classList.add('hidden'); this.start(GameEngine); } }
            ]);
        }
    },
    onPointerDown(x, y, engine) {
        if (this.won) return;
        const w = engine.logicalWidth;
        const btnH = 40;
        const btnY = w + 10;
        const btnW = w / 6;
        if (y >= btnY && y <= btnY + btnH) {
            const ci = Math.floor(x / btnW);
            if (ci >= 0 && ci < 6) this.flood(ci);
        }
    },
    update() {},
    render(ctx, engine) {
        const w = engine.logicalWidth, h = engine.logicalHeight;
        const gridSize = Math.min(w, h - 60);
        const ts = gridSize / this.size;
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < this.size * this.size; i++) {
            const r = Math.floor(i / this.size), c = i % this.size;
            ctx.fillStyle = this.colors[this.grid[i]];
            ctx.fillRect(c * ts, r * ts, ts + 0.5, ts + 0.5);
        }
        const btnY = gridSize + 10;
        const btnW = w / 6;
        for (let i = 0; i < 6; i++) {
            ctx.fillStyle = this.colors[i];
            GameEngine.drawRoundRect(ctx, i * btnW + 3, btnY, btnW - 6, 36, 8);
            ctx.fill();
        }
    }
});

// 5. 数独 (Sudoku)
App.registerGame({
    id: 'sudoku', name: '数独', nameEn: 'Sudoku', icon: '🔟',
    category: 'puzzle', desc: '数字を埋めてパズルを完成させよう',
    useDom: true,
    board: [], solution: [], fixed: [], selected: -1,
    start(engine) {
        this.selected = -1;
        this.generatePuzzle();
        this.renderDOM(engine);
    },
    generatePuzzle() {
        const base = [
            [5,3,4,6,7,8,9,1,2],[6,7,2,1,9,5,3,4,8],[1,9,8,3,4,2,5,6,7],
            [8,5,9,7,6,1,4,2,3],[4,2,6,8,5,3,7,9,1],[7,1,3,9,2,4,8,5,6],
            [9,6,1,5,3,7,2,8,4],[2,8,7,4,1,9,6,3,5],[3,4,5,2,8,6,1,7,9]
        ];
        const perm = [1,2,3,4,5,6,7,8,9].sort(() => Math.random() - 0.5);
        this.solution = base.map(row => row.map(v => perm[v - 1]));
        this.board = this.solution.map(row => [...row]);
        this.fixed = Array.from({ length: 81 }, () => true);
        let remove = 45;
        while (remove > 0) {
            const idx = Math.floor(Math.random() * 81);
            if (!this.fixed[idx]) continue;
            const r = Math.floor(idx / 9), c = idx % 9;
            this.board[r][c] = 0;
            this.fixed[idx] = false;
            remove--;
        }
    },
    renderDOM(engine) {
        const dom = engine.domLayer;
        dom.innerHTML = '';
        const grid = document.createElement('div');
        grid.style.cssText = 'display:grid;grid-template-columns:repeat(9,1fr);gap:1px;width:min(95vw,380px);aspect-ratio:1;background:#333;border-radius:8px;overflow:hidden;';
        for (let i = 0; i < 81; i++) {
            const r = Math.floor(i / 9), c = i % 9;
            const cell = document.createElement('div');
            const val = this.board[r][c];
            cell.textContent = val || '';
            cell.style.cssText = `display:flex;align-items:center;justify-content:center;background:${this.fixed[i] ? '#2a2a4a' : '#1a1a2e'};font-size:clamp(14px,4vw,20px);font-weight:${this.fixed[i] ? '700' : '400'};color:${this.fixed[i] ? '#fff' : '#6c63ff'};cursor:pointer;border-right:${c % 3 === 2 && c < 8 ? '2px solid #555' : 'none'};border-bottom:${r % 3 === 2 && r < 8 ? '2px solid #555' : 'none'};`;
            if (i === this.selected) cell.style.background = '#3a3a6a';
            cell.addEventListener('click', () => {
                this.selected = i;
                this.renderDOM(engine);
            });
            grid.appendChild(cell);
        }
        dom.appendChild(grid);
        const numpad = document.createElement('div');
        numpad.style.cssText = 'display:flex;gap:4px;margin-top:12px;flex-wrap:wrap;justify-content:center;';
        for (let n = 1; n <= 9; n++) {
            const btn = document.createElement('button');
            btn.textContent = n;
            btn.className = 'game-btn btn-primary';
            btn.style.cssText = 'width:36px;height:36px;padding:0;font-size:16px;';
            btn.addEventListener('click', () => {
                if (this.selected < 0 || this.fixed[this.selected]) return;
                const r = Math.floor(this.selected / 9), c = this.selected % 9;
                this.board[r][c] = n;
                this.renderDOM(engine);
                if (this.board.every((row, ri) => row.every((v, ci) => v === this.solution[ri][ci]))) {
                    App.showOverlay('🎉 完成！', '数独をクリアしました！', [
                        { text: 'もう一度', onClick: () => { App.el.overlay.classList.add('hidden'); this.start(engine); } }
                    ]);
                }
            });
            numpad.appendChild(btn);
        }
        const clr = document.createElement('button');
        clr.textContent = '✕';
        clr.className = 'game-btn btn-secondary';
        clr.style.cssText = 'width:36px;height:36px;padding:0;font-size:16px;';
        clr.addEventListener('click', () => {
            if (this.selected >= 0 && !this.fixed[this.selected]) {
                const r = Math.floor(this.selected / 9), c = this.selected % 9;
                this.board[r][c] = 0;
                this.renderDOM(engine);
            }
        });
        numpad.appendChild(clr);
        dom.appendChild(numpad);
    }
});

// 6. パイプつなぎ (Pipe Connect)
App.registerGame({
    id: 'pipe-connect', name: 'パイプつなぎ', nameEn: 'Pipe Connect', icon: '🔧',
    category: 'puzzle', desc: 'パイプを回転させて全てつなげよう',
    grid: [], size: 5, moves: 0,
    DIRS: [0, 1, 2, 3],
    start(engine) {
        this.size = 5;
        this.moves = 0;
        this.generatePuzzle();
        engine.startLoop();
    },
    generatePuzzle() {
        const s = this.size;
        this.grid = [];
        for (let i = 0; i < s * s; i++) {
            const r = Math.floor(i / s), c = i % s;
            let connections = [false, false, false, false];
            if (r > 0 && Math.random() > 0.3) connections[0] = true;
            if (c < s - 1 && Math.random() > 0.3) connections[1] = true;
            if (r < s - 1 && Math.random() > 0.3) connections[2] = true;
            if (c > 0 && Math.random() > 0.3) connections[3] = true;
            if (!connections.some(v => v)) connections[Math.floor(Math.random() * 4)] = true;
            const rot = Math.floor(Math.random() * 4);
            for (let rr = 0; rr < rot; rr++) {
                connections = [connections[3], connections[0], connections[1], connections[2]];
            }
            this.grid.push({ conn: connections, rotation: 0 });
        }
        for (let i = 0; i < s * s; i++) {
            const rots = Math.floor(Math.random() * 3) + 1;
            for (let rr = 0; rr < rots; rr++) {
                const g = this.grid[i];
                g.conn = [g.conn[3], g.conn[0], g.conn[1], g.conn[2]];
            }
        }
    },
    isConnected() {
        const s = this.size;
        for (let i = 0; i < s * s; i++) {
            const r = Math.floor(i / s), c = i % s;
            const g = this.grid[i];
            if (g.conn[0] && r > 0 && !this.grid[i - s].conn[2]) return false;
            if (g.conn[1] && c < s - 1 && !this.grid[i + 1].conn[3]) return false;
            if (g.conn[2] && r < s - 1 && !this.grid[i + s].conn[0]) return false;
            if (g.conn[3] && c > 0 && !this.grid[i - 1].conn[1]) return false;
        }
        return true;
    },
    onPointerDown(x, y, engine) {
        const w = engine.logicalWidth;
        const ts = w / this.size;
        const c = Math.floor(x / ts), r = Math.floor(y / ts);
        if (c < 0 || c >= this.size || r < 0 || r >= this.size) return;
        const g = this.grid[r * this.size + c];
        g.conn = [g.conn[3], g.conn[0], g.conn[1], g.conn[2]];
        this.moves++;
        App.setScore(this.moves);
        if (this.isConnected()) {
            App.saveBestScore(this.id, this.moves, false);
            App.showOverlay('🎉 クリア！', `${this.moves}回でクリア！`, [
                { text: 'もう一度', onClick: () => { App.el.overlay.classList.add('hidden'); this.start(GameEngine); } }
            ]);
        }
    },
    update() {},
    render(ctx, engine) {
        const w = engine.logicalWidth, h = engine.logicalHeight;
        const ts = w / this.size;
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < this.size * this.size; i++) {
            const r = Math.floor(i / this.size), c = i % this.size;
            const g = this.grid[i];
            const cx = c * ts + ts / 2, cy = r * ts + ts / 2;
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.strokeRect(c * ts, r * ts, ts, ts);
            ctx.strokeStyle = '#6c63ff';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            const dirs = [[0, -ts / 2], [ts / 2, 0], [0, ts / 2], [-ts / 2, 0]];
            for (let d = 0; d < 4; d++) {
                if (g.conn[d]) {
                    ctx.beginPath();
                    ctx.moveTo(cx, cy);
                    ctx.lineTo(cx + dirs[d][0], cy + dirs[d][1]);
                    ctx.stroke();
                }
            }
            ctx.beginPath();
            ctx.arc(cx, cy, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#6c63ff';
            ctx.fill();
        }
    }
});

// 7. 迷路 (Maze)
App.registerGame({
    id: 'maze', name: '迷路', nameEn: 'Maze', icon: '🏁',
    category: 'puzzle', desc: 'スタートからゴールまでたどり着こう',
    maze: [], size: 15, playerX: 0, playerY: 0, goalX: 0, goalY: 0, moves: 0,
    start(engine) {
        this.size = 15;
        this.moves = 0;
        this.generateMaze();
        this.playerX = 0;
        this.playerY = 0;
        this.goalX = this.size - 1;
        this.goalY = this.size - 1;
        App.setScore(0);
        engine.startLoop();
    },
    generateMaze() {
        const s = this.size;
        this.maze = Array.from({ length: s }, () => Array.from({ length: s }, () => ({ walls: [true, true, true, true], visited: false })));
        const stack = [{ x: 0, y: 0 }];
        this.maze[0][0].visited = true;
        while (stack.length) {
            const cur = stack[stack.length - 1];
            const neighbors = [];
            const dirs = [[0, -1, 0, 2], [1, 0, 1, 3], [0, 1, 2, 0], [-1, 0, 3, 1]];
            for (const [dx, dy, w1, w2] of dirs) {
                const nx = cur.x + dx, ny = cur.y + dy;
                if (nx >= 0 && nx < s && ny >= 0 && ny < s && !this.maze[ny][nx].visited) {
                    neighbors.push({ x: nx, y: ny, w1, w2 });
                }
            }
            if (neighbors.length === 0) { stack.pop(); continue; }
            const next = neighbors[Math.floor(Math.random() * neighbors.length)];
            this.maze[cur.y][cur.x].walls[next.w1] = false;
            this.maze[next.y][next.x].walls[next.w2] = false;
            this.maze[next.y][next.x].visited = true;
            stack.push({ x: next.x, y: next.y });
        }
    },
    onKey(key, down, engine) {
        if (!down) return;
        let dx = 0, dy = 0, wall = -1;
        if (key === 'ArrowUp' || key === 'w') { dy = -1; wall = 0; }
        else if (key === 'ArrowRight' || key === 'd') { dx = 1; wall = 1; }
        else if (key === 'ArrowDown' || key === 's') { dy = 1; wall = 2; }
        else if (key === 'ArrowLeft' || key === 'a') { dx = -1; wall = 3; }
        else return;
        if (wall >= 0 && !this.maze[this.playerY][this.playerX].walls[wall]) {
            this.playerX += dx;
            this.playerY += dy;
            this.moves++;
            App.setScore(this.moves);
            if (this.playerX === this.goalX && this.playerY === this.goalY) {
                App.saveBestScore(this.id, this.moves, false);
                App.showOverlay('🎉 ゴール！', `${this.moves}歩でクリア！`, [
                    { text: 'もう一度', onClick: () => { App.el.overlay.classList.add('hidden'); this.start(GameEngine); } }
                ]);
            }
        }
    },
    onPointerDown(x, y, engine) {
        const w = engine.logicalWidth;
        const ts = w / this.size;
        const px = this.playerX * ts + ts / 2;
        const py = this.playerY * ts + ts / 2;
        const dx = x - px, dy = y - py;
        if (Math.abs(dx) > Math.abs(dy)) {
            this.onKey(dx > 0 ? 'ArrowRight' : 'ArrowLeft', true, engine);
        } else {
            this.onKey(dy > 0 ? 'ArrowDown' : 'ArrowUp', true, engine);
        }
    },
    update() {},
    render(ctx, engine) {
        const w = engine.logicalWidth, h = engine.logicalHeight;
        const ts = w / this.size;
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#4a4a6a';
        ctx.lineWidth = 2;
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const cell = this.maze[y][x];
                const cx = x * ts, cy = y * ts;
                if (cell.walls[0]) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + ts, cy); ctx.stroke(); }
                if (cell.walls[1]) { ctx.beginPath(); ctx.moveTo(cx + ts, cy); ctx.lineTo(cx + ts, cy + ts); ctx.stroke(); }
                if (cell.walls[2]) { ctx.beginPath(); ctx.moveTo(cx, cy + ts); ctx.lineTo(cx + ts, cy + ts); ctx.stroke(); }
                if (cell.walls[3]) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + ts); ctx.stroke(); }
            }
        }
        // goal
        ctx.fillStyle = '#4ecdc4';
        ctx.fillRect(this.goalX * ts + ts * 0.2, this.goalY * ts + ts * 0.2, ts * 0.6, ts * 0.6);
        // player
        ctx.fillStyle = '#ff6584';
        ctx.beginPath();
        ctx.arc(this.playerX * ts + ts / 2, this.playerY * ts + ts / 2, ts * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }
});

// 8. ハノイの塔 (Tower of Hanoi)
App.registerGame({
    id: 'hanoi', name: 'ハノイの塔', nameEn: 'Tower of Hanoi', icon: '🗼',
    category: 'puzzle', desc: '全ての円盤を右の柱に移動させよう',
    pegs: [[], [], []], discs: 5, moves: 0, selected: -1, won: false,
    start(engine) {
        this.discs = 5;
        this.moves = 0;
        this.selected = -1;
        this.won = false;
        this.pegs = [Array.from({ length: this.discs }, (_, i) => this.discs - i), [], []];
        App.setScore(0);
        engine.startLoop();
    },
    onPointerDown(x, y, engine) {
        if (this.won) return;
        const w = engine.logicalWidth;
        const pegW = w / 3;
        const pegIdx = Math.floor(x / pegW);
        if (pegIdx < 0 || pegIdx > 2) return;
        if (this.selected === -1) {
            if (this.pegs[pegIdx].length > 0) this.selected = pegIdx;
        } else {
            const from = this.pegs[this.selected];
            const to = this.pegs[pegIdx];
            if (pegIdx !== this.selected && (to.length === 0 || to[to.length - 1] > from[from.length - 1])) {
                to.push(from.pop());
                this.moves++;
                App.setScore(this.moves);
                if (this.pegs[2].length === this.discs) {
                    this.won = true;
                    App.saveBestScore(this.id, this.moves, false);
                    App.showOverlay('🎉 クリア！', `${this.moves}手でクリア！（最小: ${Math.pow(2, this.discs) - 1}手）`, [
                        { text: 'もう一度', onClick: () => { App.el.overlay.classList.add('hidden'); this.start(GameEngine); } }
                    ]);
                }
            }
            this.selected = -1;
        }
    },
    update() {},
    render(ctx, engine) {
        const w = engine.logicalWidth, h = engine.logicalHeight;
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, w, h);
        const pegW = w / 3;
        const baseY = h * 0.85;
        const maxDiscW = pegW * 0.8;
        const discH = Math.min(h * 0.08, 25);
        const colors = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db'];
        ctx.fillStyle = '#333';
        ctx.fillRect(10, baseY, w - 20, 6);
        for (let p = 0; p < 3; p++) {
            const cx = p * pegW + pegW / 2;
            ctx.fillStyle = p === this.selected ? '#6c63ff' : '#555';
            ctx.fillRect(cx - 3, baseY - h * 0.5, 6, h * 0.5);
            for (let d = 0; d < this.pegs[p].length; d++) {
                const disc = this.pegs[p][d];
                const dw = (disc / this.discs) * maxDiscW;
                ctx.fillStyle = colors[(disc - 1) % colors.length];
                GameEngine.drawRoundRect(ctx, cx - dw / 2, baseY - (d + 1) * discH - 2, dw, discH - 2, 4);
                ctx.fill();
            }
        }
        ctx.fillStyle = '#8888a0';
        ctx.font = '13px sans-serif';
        ctx.textAlign = 'center';
        for (let p = 0; p < 3; p++) {
            ctx.fillText(p === this.selected ? '▲' : (p === 0 ? 'A' : p === 1 ? 'B' : 'C'), p * pegW + pegW / 2, baseY + 24);
        }
    }
});

// 9. 2048
App.registerGame({
    id: 'game-2048', name: '2048', nameEn: '2048', icon: '🔲',
    category: 'puzzle', desc: 'タイルをスライドして2048を目指そう',
    grid: [], score: 0, gameOver: false, startX: 0, startY: 0,
    colors: { 0: '#2a2a4a', 2: '#eee4da', 4: '#ede0c8', 8: '#f2b179', 16: '#f59563', 32: '#f67c5f', 64: '#f65e3b', 128: '#edcf72', 256: '#edcc61', 512: '#edc850', 1024: '#edc53f', 2048: '#edc22e' },
    textColors: { 0: '#2a2a4a', 2: '#776e65', 4: '#776e65' },
    start(engine) {
        this.grid = Array(16).fill(0);
        this.score = 0;
        this.gameOver = false;
        this.addRandom();
        this.addRandom();
        App.setScore(0);
        engine.startLoop();
    },
    addRandom() {
        const empty = this.grid.map((v, i) => v === 0 ? i : -1).filter(i => i >= 0);
        if (empty.length === 0) return;
        this.grid[empty[Math.floor(Math.random() * empty.length)]] = Math.random() < 0.9 ? 2 : 4;
    },
    slide(dir) {
        let moved = false;
        const get = (r, c) => this.grid[r * 4 + c];
        const set = (r, c, v) => { this.grid[r * 4 + c] = v; };
        const process = (line) => {
            let filtered = line.filter(v => v !== 0);
            for (let i = 0; i < filtered.length - 1; i++) {
                if (filtered[i] === filtered[i + 1]) {
                    filtered[i] *= 2;
                    this.score += filtered[i];
                    filtered.splice(i + 1, 1);
                }
            }
            while (filtered.length < 4) filtered.push(0);
            return filtered;
        };
        for (let i = 0; i < 4; i++) {
            let line;
            if (dir === 0) line = [get(0, i), get(1, i), get(2, i), get(3, i)]; // up
            else if (dir === 1) line = [get(i, 3), get(i, 2), get(i, 1), get(i, 0)]; // right
            else if (dir === 2) line = [get(3, i), get(2, i), get(1, i), get(0, i)]; // down
            else line = [get(i, 0), get(i, 1), get(i, 2), get(i, 3)]; // left
            const newLine = process(line);
            if (line.some((v, j) => v !== newLine[j])) moved = true;
            for (let j = 0; j < 4; j++) {
                if (dir === 0) set(j, i, newLine[j]);
                else if (dir === 1) set(i, 3 - j, newLine[j]);
                else if (dir === 2) set(3 - j, i, newLine[j]);
                else set(i, j, newLine[j]);
            }
        }
        if (moved) {
            this.addRandom();
            App.setScore(this.score);
            App.saveBestScore(this.id, this.score);
            if (!this.canMove()) {
                this.gameOver = true;
                App.showOverlay('ゲームオーバー', `スコア: ${this.score}`, [
                    { text: 'リトライ', onClick: () => { App.el.overlay.classList.add('hidden'); this.start(GameEngine); } }
                ]);
            }
        }
    },
    canMove() {
        if (this.grid.includes(0)) return true;
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                const v = this.grid[r * 4 + c];
                if (c < 3 && v === this.grid[r * 4 + c + 1]) return true;
                if (r < 3 && v === this.grid[(r + 1) * 4 + c]) return true;
            }
        }
        return false;
    },
    onPointerDown(x, y) { this.startX = x; this.startY = y; },
    onPointerUp(x, y) {
        if (this.gameOver) return;
        const dx = x - this.startX, dy = y - this.startY;
        if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
        if (Math.abs(dx) > Math.abs(dy)) this.slide(dx > 0 ? 1 : 3);
        else this.slide(dy > 0 ? 2 : 0);
    },
    onKey(key, down) {
        if (!down || this.gameOver) return;
        if (key === 'ArrowUp') this.slide(0);
        else if (key === 'ArrowRight') this.slide(1);
        else if (key === 'ArrowDown') this.slide(2);
        else if (key === 'ArrowLeft') this.slide(3);
    },
    update() {},
    render(ctx, engine) {
        const w = engine.logicalWidth, h = engine.logicalHeight;
        const ts = w / 4;
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 16; i++) {
            const r = Math.floor(i / 4), c = i % 4;
            const v = this.grid[i];
            ctx.fillStyle = this.colors[v] || '#3c3a32';
            GameEngine.drawRoundRect(ctx, c * ts + 3, r * ts + 3, ts - 6, ts - 6, 8);
            ctx.fill();
            if (v > 0) {
                ctx.fillStyle = this.textColors[v] || '#f9f6f2';
                ctx.font = `bold ${v >= 1024 ? ts * 0.22 : v >= 100 ? ts * 0.28 : ts * 0.35}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(v, c * ts + ts / 2, r * ts + ts / 2);
            }
        }
    }
});

// 10. ブロック配置 (Block Fit)
App.registerGame({
    id: 'block-fit', name: 'ブロック配置', nameEn: 'Block Fit', icon: '🧱',
    category: 'puzzle', desc: '行を揃えて消そう',
    grid: [], gridSize: 8, pieces: [], selectedPiece: -1, score: 0, gameOver: false,
    shapes: [
        [[1]], [[1,1]], [[1],[1]], [[1,1],[1,1]], [[1,1,1]], [[1],[1],[1]],
        [[1,1],[1,0]], [[1,1],[0,1]], [[0,1],[1,1]], [[1,0],[1,1]],
        [[1,1,1],[1,0,0]], [[1,1,1],[0,0,1]], [[1,0,0],[1,1,1]], [[0,0,1],[1,1,1]],
    ],
    start(engine) {
        this.gridSize = 8;
        this.grid = Array(64).fill(0);
        this.score = 0;
        this.gameOver = false;
        this.selectedPiece = -1;
        this.generatePieces();
        App.setScore(0);
        engine.startLoop();
    },
    generatePieces() {
        this.pieces = [];
        for (let i = 0; i < 3; i++) {
            this.pieces.push(this.shapes[Math.floor(Math.random() * this.shapes.length)]);
        }
    },
    canPlace(piece, gr, gc) {
        for (let r = 0; r < piece.length; r++) {
            for (let c = 0; c < piece[r].length; c++) {
                if (!piece[r][c]) continue;
                const nr = gr + r, nc = gc + c;
                if (nr < 0 || nr >= this.gridSize || nc < 0 || nc >= this.gridSize) return false;
                if (this.grid[nr * this.gridSize + nc]) return false;
            }
        }
        return true;
    },
    place(piece, gr, gc) {
        for (let r = 0; r < piece.length; r++) {
            for (let c = 0; c < piece[r].length; c++) {
                if (piece[r][c]) this.grid[(gr + r) * this.gridSize + gc + c] = 1;
            }
        }
    },
    clearLines() {
        let cleared = 0;
        for (let r = 0; r < this.gridSize; r++) {
            if (Array.from({ length: this.gridSize }, (_, c) => this.grid[r * this.gridSize + c]).every(v => v)) {
                for (let c = 0; c < this.gridSize; c++) this.grid[r * this.gridSize + c] = 0;
                cleared++;
            }
        }
        for (let c = 0; c < this.gridSize; c++) {
            if (Array.from({ length: this.gridSize }, (_, r) => this.grid[r * this.gridSize + c]).every(v => v)) {
                for (let r = 0; r < this.gridSize; r++) this.grid[r * this.gridSize + c] = 0;
                cleared++;
            }
        }
        return cleared;
    },
    onPointerDown(x, y, engine) {
        if (this.gameOver) return;
        const w = engine.logicalWidth;
        const ts = w / this.gridSize;
        const gc = Math.floor(x / ts), gr = Math.floor(y / ts);
        if (this.selectedPiece >= 0 && this.selectedPiece < this.pieces.length) {
            const piece = this.pieces[this.selectedPiece];
            if (this.canPlace(piece, gr, gc)) {
                this.place(piece, gr, gc);
                const cleared = this.clearLines();
                this.score += piece.flat().filter(v => v).length + cleared * 10;
                App.setScore(this.score);
                App.saveBestScore(this.id, this.score);
                this.pieces[this.selectedPiece] = null;
                this.selectedPiece = -1;
                if (this.pieces.every(p => p === null)) this.generatePieces();
                let anyPlaceable = false;
                for (const p of this.pieces) {
                    if (!p) continue;
                    for (let r = 0; r < this.gridSize; r++) {
                        for (let c = 0; c < this.gridSize; c++) {
                            if (this.canPlace(p, r, c)) { anyPlaceable = true; break; }
                        }
                        if (anyPlaceable) break;
                    }
                    if (anyPlaceable) break;
                }
                if (!anyPlaceable) {
                    this.gameOver = true;
                    App.showOverlay('ゲームオーバー', `スコア: ${this.score}`, [
                        { text: 'リトライ', onClick: () => { App.el.overlay.classList.add('hidden'); this.start(GameEngine); } }
                    ]);
                }
            }
        } else {
            const pieceY = w + 20;
            if (y > pieceY) {
                const pw = w / 3;
                const pi = Math.floor(x / pw);
                if (pi >= 0 && pi < 3 && this.pieces[pi]) this.selectedPiece = pi;
            }
        }
    },
    update() {},
    render(ctx, engine) {
        const w = engine.logicalWidth, h = engine.logicalHeight;
        const ts = w / this.gridSize;
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 64; i++) {
            const r = Math.floor(i / this.gridSize), c = i % this.gridSize;
            ctx.fillStyle = this.grid[i] ? '#6c63ff' : '#222240';
            GameEngine.drawRoundRect(ctx, c * ts + 1, r * ts + 1, ts - 2, ts - 2, 4);
            ctx.fill();
        }
        const pieceY = w + 20;
        const pw = w / 3;
        const miniTs = 16;
        for (let pi = 0; pi < 3; pi++) {
            if (!this.pieces[pi]) continue;
            const piece = this.pieces[pi];
            const ox = pi * pw + pw / 2 - (piece[0].length * miniTs) / 2;
            const oy = pieceY;
            ctx.fillStyle = pi === this.selectedPiece ? '#ff6584' : '#4ecdc4';
            for (let r = 0; r < piece.length; r++) {
                for (let c = 0; c < piece[r].length; c++) {
                    if (piece[r][c]) {
                        GameEngine.drawRoundRect(ctx, ox + c * miniTs + 1, oy + r * miniTs + 1, miniTs - 2, miniTs - 2, 3);
                        ctx.fill();
                    }
                }
            }
        }
    }
});

})();

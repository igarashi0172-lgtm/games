// Arcade Games (10)
(function() {

// 11. スネーク (Snake)
App.registerGame({
    id: 'snake', name: 'スネーク', nameEn: 'Snake', icon: '🐍',
    category: 'arcade', desc: 'エサを食べて長くなろう',
    snake: [], dir: { x: 1, y: 0 }, nextDir: { x: 1, y: 0 }, food: { x: 0, y: 0 }, gridSize: 20, timer: 0, speed: 0.12, score: 0, gameOver: false,
    start(engine) {
        this.gridSize = 20;
        this.snake = [{ x: 5, y: 10 }, { x: 4, y: 10 }, { x: 3, y: 10 }];
        this.dir = { x: 1, y: 0 };
        this.nextDir = { x: 1, y: 0 };
        this.score = 0;
        this.timer = 0;
        this.speed = 0.12;
        this.gameOver = false;
        this.placeFood();
        App.setScore(0);
        engine.startLoop();
    },
    placeFood() {
        let pos;
        do {
            pos = { x: Math.floor(Math.random() * this.gridSize), y: Math.floor(Math.random() * this.gridSize) };
        } while (this.snake.some(s => s.x === pos.x && s.y === pos.y));
        this.food = pos;
    },
    onKey(key, down) {
        if (!down) return;
        if ((key === 'ArrowUp' || key === 'w') && this.dir.y !== 1) this.nextDir = { x: 0, y: -1 };
        if ((key === 'ArrowDown' || key === 's') && this.dir.y !== -1) this.nextDir = { x: 0, y: 1 };
        if ((key === 'ArrowLeft' || key === 'a') && this.dir.x !== 1) this.nextDir = { x: -1, y: 0 };
        if ((key === 'ArrowRight' || key === 'd') && this.dir.x !== -1) this.nextDir = { x: 1, y: 0 };
    },
    onPointerDown(x, y, engine) {
        this._swipeStart = { x, y };
    },
    onPointerUp(x, y) {
        if (!this._swipeStart) return;
        const dx = x - this._swipeStart.x, dy = y - this._swipeStart.y;
        if (Math.abs(dx) < 15 && Math.abs(dy) < 15) return;
        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0 && this.dir.x !== -1) this.nextDir = { x: 1, y: 0 };
            else if (dx < 0 && this.dir.x !== 1) this.nextDir = { x: -1, y: 0 };
        } else {
            if (dy > 0 && this.dir.y !== -1) this.nextDir = { x: 0, y: 1 };
            else if (dy < 0 && this.dir.y !== 1) this.nextDir = { x: 0, y: -1 };
        }
    },
    update(dt) {
        if (this.gameOver) return;
        this.timer += dt;
        if (this.timer < this.speed) return;
        this.timer = 0;
        this.dir = { ...this.nextDir };
        const head = { x: this.snake[0].x + this.dir.x, y: this.snake[0].y + this.dir.y };
        if (head.x < 0 || head.x >= this.gridSize || head.y < 0 || head.y >= this.gridSize ||
            this.snake.some(s => s.x === head.x && s.y === head.y)) {
            this.gameOver = true;
            App.saveBestScore(this.id, this.score);
            App.showOverlay('ゲームオーバー', `スコア: ${this.score}`, [
                { text: 'リトライ', onClick: () => { App.el.overlay.classList.add('hidden'); this.start(GameEngine); } }
            ]);
            return;
        }
        this.snake.unshift(head);
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            App.setScore(this.score);
            this.placeFood();
            if (this.speed > 0.06) this.speed -= 0.002;
        } else {
            this.snake.pop();
        }
    },
    render(ctx, engine) {
        const w = engine.logicalWidth, h = engine.logicalHeight;
        const ts = w / this.gridSize;
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, w, h);
        // grid
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        for (let i = 0; i <= this.gridSize; i++) {
            ctx.beginPath(); ctx.moveTo(i * ts, 0); ctx.lineTo(i * ts, w); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i * ts); ctx.lineTo(w, i * ts); ctx.stroke();
        }
        // food
        ctx.fillStyle = '#ff6584';
        ctx.beginPath();
        ctx.arc(this.food.x * ts + ts / 2, this.food.y * ts + ts / 2, ts * 0.4, 0, Math.PI * 2);
        ctx.fill();
        // snake
        this.snake.forEach((s, i) => {
            ctx.fillStyle = i === 0 ? '#4ecdc4' : '#6c63ff';
            GameEngine.drawRoundRect(ctx, s.x * ts + 1, s.y * ts + 1, ts - 2, ts - 2, 4);
            ctx.fill();
        });
    }
});

// 12. ブロック崩し (Breakout)
App.registerGame({
    id: 'breakout', name: 'ブロック崩し', nameEn: 'Breakout', icon: '🧱',
    category: 'arcade', desc: 'ボールでブロックを全て壊そう',
    paddle: { x: 0, w: 70, h: 12 }, ball: { x: 0, y: 0, vx: 0, vy: 0, r: 6 },
    bricks: [], score: 0, lives: 3, running: false,
    start(engine) {
        const w = engine.logicalWidth, h = engine.logicalHeight;
        this.paddle = { x: w / 2 - 35, w: 70, h: 12 };
        this.score = 0;
        this.lives = 3;
        this.bricks = [];
        const cols = 8, rows = 5;
        const bw = (w - 20) / cols;
        const colors = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db'];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                this.bricks.push({ x: 10 + c * bw, y: 40 + r * 22, w: bw - 4, h: 18, alive: true, color: colors[r] });
            }
        }
        this.resetBall(engine);
        this.running = true;
        App.setScore(0);
        engine.startLoop();
    },
    resetBall(engine) {
        const w = engine.logicalWidth, h = engine.logicalHeight;
        this.ball = { x: w / 2, y: h - 50, vx: 150 * (Math.random() > 0.5 ? 1 : -1), vy: -200, r: 6 };
    },
    onPointerMove(x, y, engine) {
        this.paddle.x = Math.max(0, Math.min(engine.logicalWidth - this.paddle.w, x - this.paddle.w / 2));
    },
    update(dt, engine) {
        if (!this.running) return;
        const w = engine.logicalWidth, h = engine.logicalHeight;
        const b = this.ball;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.x - b.r < 0) { b.x = b.r; b.vx = Math.abs(b.vx); }
        if (b.x + b.r > w) { b.x = w - b.r; b.vx = -Math.abs(b.vx); }
        if (b.y - b.r < 0) { b.y = b.r; b.vy = Math.abs(b.vy); }
        if (b.y + b.r > h) {
            this.lives--;
            if (this.lives <= 0) {
                this.running = false;
                App.saveBestScore(this.id, this.score);
                App.showOverlay('ゲームオーバー', `スコア: ${this.score}`, [
                    { text: 'リトライ', onClick: () => { App.el.overlay.classList.add('hidden'); this.start(GameEngine); } }
                ]);
            } else {
                this.resetBall(engine);
            }
            return;
        }
        // paddle collision
        const p = this.paddle;
        const py = h - 30;
        if (b.vy > 0 && b.y + b.r >= py && b.y + b.r <= py + p.h && b.x >= p.x && b.x <= p.x + p.w) {
            b.vy = -Math.abs(b.vy);
            const rel = (b.x - (p.x + p.w / 2)) / (p.w / 2);
            b.vx = rel * 200;
            b.y = py - b.r;
        }
        // brick collision
        for (const br of this.bricks) {
            if (!br.alive) continue;
            if (b.x + b.r > br.x && b.x - b.r < br.x + br.w && b.y + b.r > br.y && b.y - b.r < br.y + br.h) {
                br.alive = false;
                b.vy = -b.vy;
                this.score += 10;
                App.setScore(this.score);
                if (this.bricks.every(bb => !bb.alive)) {
                    this.running = false;
                    App.saveBestScore(this.id, this.score);
                    App.showOverlay('🎉 クリア！', `スコア: ${this.score}`, [
                        { text: 'もう一度', onClick: () => { App.el.overlay.classList.add('hidden'); this.start(GameEngine); } }
                    ]);
                }
                break;
            }
        }
    },
    render(ctx, engine) {
        const w = engine.logicalWidth, h = engine.logicalHeight;
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, w, h);
        // bricks
        for (const br of this.bricks) {
            if (!br.alive) continue;
            ctx.fillStyle = br.color;
            GameEngine.drawRoundRect(ctx, br.x, br.y, br.w, br.h, 4);
            ctx.fill();
        }
        // paddle
        ctx.fillStyle = '#6c63ff';
        GameEngine.drawRoundRect(ctx, this.paddle.x, h - 30, this.paddle.w, this.paddle.h, 6);
        ctx.fill();
        // ball
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2);
        ctx.fill();
        // lives
        ctx.fillStyle = '#ff6584';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('♥'.repeat(this.lives), 10, 20);
    }
});

// 13. テトリス (Tetris)
App.registerGame({
    id: 'tetris', name: 'テトリス', nameEn: 'Tetris', icon: '🟦',
    category: 'arcade', desc: '行を揃えて消していこう',
    board: [], cols: 10, rows: 20, piece: null, nextPiece: null, score: 0, timer: 0, speed: 0.5, gameOver: false,
    pieces: [
        { shape: [[1,1,1,1]], color: '#00bcd4' },
        { shape: [[1,1],[1,1]], color: '#ffc107' },
        { shape: [[0,1,0],[1,1,1]], color: '#9c27b0' },
        { shape: [[1,0],[1,0],[1,1]], color: '#ff9800' },
        { shape: [[0,1],[0,1],[1,1]], color: '#2196f3' },
        { shape: [[1,1,0],[0,1,1]], color: '#4caf50' },
        { shape: [[0,1,1],[1,1,0]], color: '#f44336' },
    ],
    start(engine) {
        this.board = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
        this.score = 0;
        this.timer = 0;
        this.speed = 0.5;
        this.gameOver = false;
        this.nextPiece = this.randomPiece();
        this.spawnPiece();
        App.setScore(0);
        engine.startLoop();
    },
    randomPiece() {
        const p = this.pieces[Math.floor(Math.random() * this.pieces.length)];
        return { shape: p.shape.map(r => [...r]), color: p.color, x: 3, y: 0 };
    },
    spawnPiece() {
        this.piece = this.nextPiece;
        this.piece.x = Math.floor((this.cols - this.piece.shape[0].length) / 2);
        this.piece.y = 0;
        this.nextPiece = this.randomPiece();
        if (!this.isValid(this.piece.shape, this.piece.x, this.piece.y)) {
            this.gameOver = true;
            App.saveBestScore(this.id, this.score);
            App.showOverlay('ゲームオーバー', `スコア: ${this.score}`, [
                { text: 'リトライ', onClick: () => { App.el.overlay.classList.add('hidden'); this.start(GameEngine); } }
            ]);
        }
    },
    isValid(shape, px, py) {
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (!shape[r][c]) continue;
                const nx = px + c, ny = py + r;
                if (nx < 0 || nx >= this.cols || ny >= this.rows) return false;
                if (ny >= 0 && this.board[ny][nx]) return false;
            }
        }
        return true;
    },
    rotate() {
        const s = this.piece.shape;
        const rotated = s[0].map((_, i) => s.map(r => r[i]).reverse());
        if (this.isValid(rotated, this.piece.x, this.piece.y)) this.piece.shape = rotated;
    },
    lock() {
        const s = this.piece.shape;
        for (let r = 0; r < s.length; r++) {
            for (let c = 0; c < s[r].length; c++) {
                if (s[r][c] && this.piece.y + r >= 0) {
                    this.board[this.piece.y + r][this.piece.x + c] = this.piece.color;
                }
            }
        }
        let lines = 0;
        for (let r = this.rows - 1; r >= 0; r--) {
            if (this.board[r].every(v => v)) {
                this.board.splice(r, 1);
                this.board.unshift(Array(this.cols).fill(0));
                lines++;
                r++;
            }
        }
        this.score += [0, 100, 300, 500, 800][lines] || 0;
        App.setScore(this.score);
        this.spawnPiece();
    },
    onKey(key, down) {
        if (!down || this.gameOver) return;
        if (key === 'ArrowLeft' || key === 'a') {
            if (this.isValid(this.piece.shape, this.piece.x - 1, this.piece.y)) this.piece.x--;
        } else if (key === 'ArrowRight' || key === 'd') {
            if (this.isValid(this.piece.shape, this.piece.x + 1, this.piece.y)) this.piece.x++;
        } else if (key === 'ArrowDown' || key === 's') {
            if (this.isValid(this.piece.shape, this.piece.x, this.piece.y + 1)) this.piece.y++;
            else this.lock();
        } else if (key === 'ArrowUp' || key === 'w') {
            this.rotate();
        } else if (key === ' ') {
            while (this.isValid(this.piece.shape, this.piece.x, this.piece.y + 1)) this.piece.y++;
            this.lock();
        }
    },
    onPointerDown(x, y, engine) {
        this._tx = x; this._ty = y;
    },
    onPointerUp(x, y) {
        if (this.gameOver) return;
        const dx = x - this._tx, dy = y - this._ty;
        if (Math.abs(dx) < 15 && Math.abs(dy) < 15) { this.rotate(); return; }
        if (Math.abs(dx) > Math.abs(dy)) {
            this.onKey(dx > 0 ? 'ArrowRight' : 'ArrowLeft', true);
        } else {
            if (dy > 30) {
                while (this.isValid(this.piece.shape, this.piece.x, this.piece.y + 1)) this.piece.y++;
                this.lock();
            } else {
                this.onKey('ArrowDown', true);
            }
        }
    },
    update(dt) {
        if (this.gameOver) return;
        this.timer += dt;
        if (this.timer >= this.speed) {
            this.timer = 0;
            if (this.isValid(this.piece.shape, this.piece.x, this.piece.y + 1)) this.piece.y++;
            else this.lock();
        }
    },
    render(ctx, engine) {
        const w = engine.logicalWidth, h = engine.logicalHeight;
        const ts = Math.min(w / this.cols, h / this.rows);
        const ox = (w - ts * this.cols) / 2;
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#151528';
        ctx.fillRect(ox, 0, ts * this.cols, ts * this.rows);
        // board
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.board[r][c]) {
                    ctx.fillStyle = this.board[r][c];
                    GameEngine.drawRoundRect(ctx, ox + c * ts + 1, r * ts + 1, ts - 2, ts - 2, 3);
                    ctx.fill();
                }
            }
        }
        // piece
        if (this.piece) {
            ctx.fillStyle = this.piece.color;
            for (let r = 0; r < this.piece.shape.length; r++) {
                for (let c = 0; c < this.piece.shape[r].length; c++) {
                    if (this.piece.shape[r][c]) {
                        GameEngine.drawRoundRect(ctx, ox + (this.piece.x + c) * ts + 1, (this.piece.y + r) * ts + 1, ts - 2, ts - 2, 3);
                        ctx.fill();
                    }
                }
            }
        }
        // grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        for (let c = 0; c <= this.cols; c++) { ctx.beginPath(); ctx.moveTo(ox + c * ts, 0); ctx.lineTo(ox + c * ts, ts * this.rows); ctx.stroke(); }
        for (let r = 0; r <= this.rows; r++) { ctx.beginPath(); ctx.moveTo(ox, r * ts); ctx.lineTo(ox + ts * this.cols, r * ts); ctx.stroke(); }
    }
});

// 14. ピンポン (Pong)
App.registerGame({
    id: 'pong', name: 'ピンポン', nameEn: 'Pong', icon: '🏓',
    category: 'arcade', desc: 'AIに勝てるか挑戦しよう',
    player: { y: 0, h: 60 }, ai: { y: 0, h: 60 }, ball: { x: 0, y: 0, vx: 0, vy: 0 },
    paddleW: 10, playerScore: 0, aiScore: 0, maxScore: 5,
    start(engine) {
        const h = engine.logicalHeight;
        this.player = { y: h / 2 - 30, h: 60 };
        this.ai = { y: h / 2 - 30, h: 60 };
        this.playerScore = 0;
        this.aiScore = 0;
        this.resetBall(engine);
        App.setScore('0 - 0');
        engine.startLoop();
    },
    resetBall(engine) {
        const w = engine.logicalWidth, h = engine.logicalHeight;
        this.ball = { x: w / 2, y: h / 2, vx: 200 * (Math.random() > 0.5 ? 1 : -1), vy: 100 * (Math.random() - 0.5) };
    },
    onPointerMove(x, y) {
        this.player.y = y - this.player.h / 2;
    },
    update(dt, engine) {
        const w = engine.logicalWidth, h = engine.logicalHeight;
        const b = this.ball;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.y < 5) { b.y = 5; b.vy = Math.abs(b.vy); }
        if (b.y > h - 5) { b.y = h - 5; b.vy = -Math.abs(b.vy); }
        // AI
        const aiTarget = b.y - this.ai.h / 2;
        this.ai.y += (aiTarget - this.ai.y) * 3 * dt;
        // player paddle
        if (b.vx < 0 && b.x - 5 <= this.paddleW + 10 && b.y >= this.player.y && b.y <= this.player.y + this.player.h) {
            b.vx = Math.abs(b.vx) * 1.05;
            b.vy += (b.y - (this.player.y + this.player.h / 2)) * 2;
        }
        // ai paddle
        if (b.vx > 0 && b.x + 5 >= w - this.paddleW - 10 && b.y >= this.ai.y && b.y <= this.ai.y + this.ai.h) {
            b.vx = -Math.abs(b.vx) * 1.05;
            b.vy += (b.y - (this.ai.y + this.ai.h / 2)) * 2;
        }
        if (b.x < 0) { this.aiScore++; this.checkScore(engine); this.resetBall(engine); }
        if (b.x > w) { this.playerScore++; this.checkScore(engine); this.resetBall(engine); }
        App.setScore(`${this.playerScore} - ${this.aiScore}`);
    },
    checkScore(engine) {
        if (this.playerScore >= this.maxScore) {
            App.showOverlay('🎉 勝利！', `${this.playerScore} - ${this.aiScore}`, [
                { text: 'もう一度', onClick: () => { App.el.overlay.classList.add('hidden'); this.start(GameEngine); } }
            ]);
        } else if (this.aiScore >= this.maxScore) {
            App.showOverlay('😅 敗北', `${this.playerScore} - ${this.aiScore}`, [
                { text: 'リトライ', onClick: () => { App.el.overlay.classList.add('hidden'); this.start(GameEngine); } }
            ]);
        }
    },
    render(ctx, engine) {
        const w = engine.logicalWidth, h = engine.logicalHeight;
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, w, h);
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#6c63ff';
        GameEngine.drawRoundRect(ctx, 10, this.player.y, this.paddleW, this.player.h, 5);
        ctx.fill();
        ctx.fillStyle = '#ff6584';
        GameEngine.drawRoundRect(ctx, w - 10 - this.paddleW, this.ai.y, this.paddleW, this.ai.h, 5);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.ball.x, this.ball.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }
});

// 15. フラッピー (Flappy)
App.registerGame({
    id: 'flappy', name: 'フラッピー', nameEn: 'Flappy', icon: '🐦',
    category: 'arcade', desc: 'タップで飛んで障害物を避けよう',
    bird: { y: 0, vy: 0 }, pipes: [], timer: 0, score: 0, gameOver: false, started: false,
    start(engine) {
        this.bird = { y: engine.logicalHeight / 2, vy: 0 };
        this.pipes = [];
        this.timer = 0;
        this.score = 0;
        this.gameOver = false;
        this.started = false;
        App.setScore(0);
        engine.startLoop();
    },
    flap() {
        if (this.gameOver) return;
        this.started = true;
        this.bird.vy = -250;
    },
    onPointerDown() { this.flap(); },
    onKey(key, down) { if (down && key === ' ') this.flap(); },
    update(dt, engine) {
        if (!this.started || this.gameOver) return;
        const h = engine.logicalHeight, w = engine.logicalWidth;
        this.bird.vy += 600 * dt;
        this.bird.y += this.bird.vy * dt;
        this.timer += dt;
        if (this.timer > 1.5) {
            this.timer = 0;
            const gap = 120;
            const gapY = 60 + Math.random() * (h - 120 - gap);
            this.pipes.push({ x: w, gapY, gap, scored: false });
        }
        for (const p of this.pipes) {
            p.x -= 120 * dt;
            const bx = 50, by = this.bird.y, br = 12;
            const pw = 40;
            if (bx + br > p.x && bx - br < p.x + pw) {
                if (by - br < p.gapY || by + br > p.gapY + p.gap) {
                    this.die();
                    return;
                }
            }
            if (!p.scored && p.x + pw < bx) {
                p.scored = true;
                this.score++;
                App.setScore(this.score);
            }
        }
        this.pipes = this.pipes.filter(p => p.x > -50);
        if (this.bird.y > h || this.bird.y < 0) this.die();
    },
    die() {
        this.gameOver = true;
        App.saveBestScore(this.id, this.score);
        App.showOverlay('ゲームオーバー', `スコア: ${this.score}`, [
            { text: 'リトライ', onClick: () => { App.el.overlay.classList.add('hidden'); this.start(GameEngine); } }
        ]);
    },
    render(ctx, engine) {
        const w = engine.logicalWidth, h = engine.logicalHeight;
        ctx.fillStyle = '#0a1628';
        ctx.fillRect(0, 0, w, h);
        for (const p of this.pipes) {
            ctx.fillStyle = '#2ecc71';
            GameEngine.drawRoundRect(ctx, p.x, 0, 40, p.gapY, 4);
            ctx.fill();
            GameEngine.drawRoundRect(ctx, p.x, p.gapY + p.gap, 40, h - p.gapY - p.gap, 4);
            ctx.fill();
        }
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(50, this.bird.y, 12, 0, Math.PI * 2);
        ctx.fill();
        if (!this.started) {
            ctx.fillStyle = '#fff';
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('タップで開始', w / 2, h / 2 + 50);
        }
    }
});

// 16. ジャンプゲーム (Dino Jump)
App.registerGame({
    id: 'dino-jump', name: 'ジャンプ', nameEn: 'Dino Jump', icon: '🦕',
    category: 'arcade', desc: '障害物をジャンプで避けよう',
    player: { y: 0, vy: 0, jumping: false }, obstacles: [], timer: 0, score: 0, speed: 200, gameOver: false, groundY: 0,
    start(engine) {
        this.groundY = engine.logicalHeight - 60;
        this.player = { y: this.groundY, vy: 0, jumping: false };
        this.obstacles = [];
        this.timer = 0;
        this.score = 0;
        this.speed = 200;
        this.gameOver = false;
        App.setScore(0);
        engine.startLoop();
    },
    jump() {
        if (!this.player.jumping && !this.gameOver) {
            this.player.vy = -450;
            this.player.jumping = true;
        }
    },
    onPointerDown() { this.jump(); },
    onKey(key, down) { if (down && (key === ' ' || key === 'ArrowUp')) this.jump(); },
    update(dt, engine) {
        if (this.gameOver) return;
        const w = engine.logicalWidth;
        this.score += dt * 10;
        App.setScore(Math.floor(this.score));
        this.speed += dt * 5;
        this.player.vy += 1200 * dt;
        this.player.y += this.player.vy * dt;
        if (this.player.y >= this.groundY) {
            this.player.y = this.groundY;
            this.player.vy = 0;
            this.player.jumping = false;
        }
        this.timer += dt;
        if (this.timer > 1 + Math.random() * 0.5) {
            this.timer = 0;
            const h = 20 + Math.random() * 25;
            this.obstacles.push({ x: w + 10, w: 20, h });
        }
        for (const o of this.obstacles) {
            o.x -= this.speed * dt;
            if (50 + 15 > o.x && 50 - 15 < o.x + o.w && this.player.y + 20 > this.groundY + 20 - o.h) {
                this.gameOver = true;
                App.saveBestScore(this.id, Math.floor(this.score));
                App.showOverlay('ゲームオーバー', `スコア: ${Math.floor(this.score)}`, [
                    { text: 'リトライ', onClick: () => { App.el.overlay.classList.add('hidden'); this.start(GameEngine); } }
                ]);
            }
        }
        this.obstacles = this.obstacles.filter(o => o.x > -30);
    },
    render(ctx, engine) {
        const w = engine.logicalWidth, h = engine.logicalHeight;
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#333';
        ctx.fillRect(0, this.groundY + 20, w, 2);
        // player
        ctx.fillStyle = '#4ecdc4';
        GameEngine.drawRoundRect(ctx, 35, this.player.y - 5, 30, 25, 6);
        ctx.fill();
        // obstacles
        ctx.fillStyle = '#ff6584';
        for (const o of this.obstacles) {
            GameEngine.drawRoundRect(ctx, o.x, this.groundY + 20 - o.h, o.w, o.h, 3);
            ctx.fill();
        }
    }
});

// 17. シューティング (Space Shooter)
App.registerGame({
    id: 'space-shooter', name: 'シューティング', nameEn: 'Space Shooter', icon: '🚀',
    category: 'arcade', desc: '敵を撃って生き残ろう',
    player: { x: 0 }, bullets: [], enemies: [], score: 0, timer: 0, gameOver: false,
    start(engine) {
        this.player = { x: engine.logicalWidth / 2 };
        this.bullets = [];
        this.enemies = [];
        this.score = 0;
        this.timer = 0;
        this.gameOver = false;
        this.shootTimer = 0;
        App.setScore(0);
        engine.startLoop();
    },
    onPointerMove(x) { this.player.x = x; },
    onPointerDown(x, y, engine) {
        this.player.x = x;
        this.shoot(engine);
    },
    shoot(engine) {
        this.bullets.push({ x: this.player.x, y: engine.logicalHeight - 50 });
    },
    update(dt, engine) {
        if (this.gameOver) return;
        const w = engine.logicalWidth, h = engine.logicalHeight;
        this.shootTimer += dt;
        if (this.shootTimer > 0.25) { this.shootTimer = 0; this.shoot(engine); }
        this.timer += dt;
        if (this.timer > 0.6) {
            this.timer = 0;
            this.enemies.push({ x: 20 + Math.random() * (w - 40), y: -20, speed: 80 + Math.random() * 60 });
        }
        for (const b of this.bullets) b.y -= 400 * dt;
        for (const e of this.enemies) e.y += e.speed * dt;
        // collision
        for (const e of this.enemies) {
            for (const b of this.bullets) {
                if (Math.abs(b.x - e.x) < 15 && Math.abs(b.y - e.y) < 15) {
                    e.dead = true;
                    b.dead = true;
                    this.score += 10;
                    App.setScore(this.score);
                }
            }
            if (!e.dead && e.y > h - 60 && Math.abs(e.x - this.player.x) < 20) {
                this.gameOver = true;
                App.saveBestScore(this.id, this.score);
                App.showOverlay('ゲームオーバー', `スコア: ${this.score}`, [
                    { text: 'リトライ', onClick: () => { App.el.overlay.classList.add('hidden'); this.start(GameEngine); } }
                ]);
                return;
            }
            if (e.y > h + 20) e.dead = true;
        }
        this.bullets = this.bullets.filter(b => !b.dead && b.y > -10);
        this.enemies = this.enemies.filter(e => !e.dead);
    },
    render(ctx, engine) {
        const w = engine.logicalWidth, h = engine.logicalHeight;
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, w, h);
        // stars
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        for (let i = 0; i < 30; i++) {
            const sx = ((i * 137) % w), sy = ((i * 97 + performance.now() * 0.02) % h);
            ctx.fillRect(sx, sy, 1, 1);
        }
        // player
        ctx.fillStyle = '#6c63ff';
        ctx.beginPath();
        ctx.moveTo(this.player.x, h - 50);
        ctx.lineTo(this.player.x - 12, h - 30);
        ctx.lineTo(this.player.x + 12, h - 30);
        ctx.closePath();
        ctx.fill();
        // bullets
        ctx.fillStyle = '#4ecdc4';
        for (const b of this.bullets) { ctx.fillRect(b.x - 2, b.y - 6, 4, 12); }
        // enemies
        ctx.fillStyle = '#ff6584';
        for (const e of this.enemies) {
            ctx.beginPath();
            ctx.arc(e.x, e.y, 10, 0, Math.PI * 2);
            ctx.fill();
        }
    }
});

// 18. バブルシューター (Bubble Shooter)
App.registerGame({
    id: 'bubble-shooter', name: 'バブルシューター', nameEn: 'Bubble Shooter', icon: '🫧',
    category: 'arcade', desc: '3つ以上同じ色を揃えて消そう',
    bubbles: [], shootBubble: null, aimAngle: Math.PI / 2, score: 0, gameOver: false,
    colors: ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6'],
    radius: 15, cols: 10,
    start(engine) {
        this.score = 0;
        this.gameOver = false;
        this.bubbles = [];
        this.aimAngle = Math.PI / 2;
        const w = engine.logicalWidth;
        this.radius = w / (this.cols * 2);
        for (let r = 0; r < 6; r++) {
            for (let c = 0; c < this.cols - (r % 2); c++) {
                const x = this.radius + c * this.radius * 2 + (r % 2 ? this.radius : 0);
                const y = this.radius + r * this.radius * 1.73;
                this.bubbles.push({ x, y, color: this.colors[Math.floor(Math.random() * 5)], alive: true });
            }
        }
        this.newShootBubble(engine);
        App.setScore(0);
        engine.startLoop();
    },
    newShootBubble(engine) {
        const w = engine.logicalWidth, h = engine.logicalHeight;
        this.shootBubble = { x: w / 2, y: h - 40, color: this.colors[Math.floor(Math.random() * 5)], vx: 0, vy: 0, moving: false };
    },
    onPointerMove(x, y, engine) {
        const w = engine.logicalWidth, h = engine.logicalHeight;
        this.aimAngle = Math.atan2(h - 40 - y, x - w / 2);
        if (this.aimAngle < 0.2) this.aimAngle = 0.2;
        if (this.aimAngle > Math.PI - 0.2) this.aimAngle = Math.PI - 0.2;
    },
    onPointerDown(x, y, engine) {
        if (this.shootBubble && !this.shootBubble.moving) {
            const speed = 400;
            this.shootBubble.vx = Math.cos(this.aimAngle) * -speed;
            this.shootBubble.vy = -Math.sin(this.aimAngle) * speed;
            this.shootBubble.moving = true;
        }
    },
    update(dt, engine) {
        if (this.gameOver || !this.shootBubble) return;
        const w = engine.logicalWidth, h = engine.logicalHeight;
        const sb = this.shootBubble;
        if (!sb.moving) return;
        sb.x += sb.vx * dt;
        sb.y += sb.vy * dt;
        if (sb.x < this.radius) { sb.x = this.radius; sb.vx = Math.abs(sb.vx); }
        if (sb.x > w - this.radius) { sb.x = w - this.radius; sb.vx = -Math.abs(sb.vx); }
        let stuck = sb.y < this.radius;
        if (!stuck) {
            for (const b of this.bubbles) {
                if (!b.alive) continue;
                if (Math.hypot(sb.x - b.x, sb.y - b.y) < this.radius * 1.8) { stuck = true; break; }
            }
        }
        if (stuck) {
            this.bubbles.push({ x: sb.x, y: sb.y, color: sb.color, alive: true });
            this.checkMatches(this.bubbles.length - 1);
            this.newShootBubble(engine);
        }
    },
    checkMatches(idx) {
        const color = this.bubbles[idx].color;
        const visited = new Set();
        const stack = [idx];
        const group = [];
        while (stack.length) {
            const i = stack.pop();
            if (visited.has(i)) continue;
            visited.add(i);
            const b = this.bubbles[i];
            if (!b.alive || b.color !== color) continue;
            group.push(i);
            for (let j = 0; j < this.bubbles.length; j++) {
                if (visited.has(j) || !this.bubbles[j].alive) continue;
                if (Math.hypot(b.x - this.bubbles[j].x, b.y - this.bubbles[j].y) < this.radius * 2.2) {
                    stack.push(j);
                }
            }
        }
        if (group.length >= 3) {
            for (const i of group) this.bubbles[i].alive = false;
            this.score += group.length * 10;
            App.setScore(this.score);
            App.saveBestScore(this.id, this.score);
        }
    },
    render(ctx, engine) {
        const w = engine.logicalWidth, h = engine.logicalHeight;
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, w, h);
        for (const b of this.bubbles) {
            if (!b.alive) continue;
            ctx.fillStyle = b.color;
            ctx.beginPath();
            ctx.arc(b.x, b.y, this.radius - 1, 0, Math.PI * 2);
            ctx.fill();
        }
        if (this.shootBubble) {
            ctx.fillStyle = this.shootBubble.color;
            ctx.beginPath();
            ctx.arc(this.shootBubble.x, this.shootBubble.y, this.radius - 1, 0, Math.PI * 2);
            ctx.fill();
            if (!this.shootBubble.moving) {
                ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(w / 2, h - 40);
                ctx.lineTo(w / 2 - Math.cos(this.aimAngle) * 80, h - 40 - Math.sin(this.aimAngle) * 80);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }
    }
});

// 19. 落ちゲー (Drop Match)
App.registerGame({
    id: 'drop-match', name: '落ちゲー', nameEn: 'Drop Match', icon: '💎',
    category: 'arcade', desc: '同じ色を3つ並べて消そう',
    grid: [], cols: 6, rows: 12, score: 0, timer: 0, speed: 1.0, gameOver: false,
    current: null,
    colors: ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f'],
    start(engine) {
        this.grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
        this.score = 0;
        this.timer = 0;
        this.speed = 1.0;
        this.gameOver = false;
        this.spawnPiece();
        App.setScore(0);
        engine.startLoop();
    },
    spawnPiece() {
        this.current = {
            x: Math.floor(this.cols / 2),
            y: 0,
            c1: this.colors[Math.floor(Math.random() * 4)],
            c2: this.colors[Math.floor(Math.random() * 4)]
        };
    },
    drop() {
        const c = this.current;
        if (c.y + 1 < this.rows && !this.grid[c.y + 1][c.x]) {
            c.y++;
        } else {
            this.grid[c.y][c.x] = c.c1;
            if (c.y > 0) this.grid[c.y - 1][c.x] = c.c2;
            this.clearMatches();
            this.spawnPiece();
            if (this.grid[0].some(v => v)) {
                this.gameOver = true;
                App.saveBestScore(this.id, this.score);
                App.showOverlay('ゲームオーバー', `スコア: ${this.score}`, [
                    { text: 'リトライ', onClick: () => { App.el.overlay.classList.add('hidden'); this.start(GameEngine); } }
                ]);
            }
        }
    },
    clearMatches() {
        let cleared = false;
        const check = (r, c, dr, dc) => {
            const color = this.grid[r][c];
            if (!color) return [];
            const cells = [[r, c]];
            let nr = r + dr, nc = c + dc;
            while (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && this.grid[nr][nc] === color) {
                cells.push([nr, nc]);
                nr += dr; nc += dc;
            }
            return cells.length >= 3 ? cells : [];
        };
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
                    const cells = check(r, c, dr, dc);
                    if (cells.length) {
                        cells.forEach(([cr, cc]) => this.grid[cr][cc] = 0);
                        this.score += cells.length * 10;
                        cleared = true;
                    }
                }
            }
        }
        if (cleared) {
            this.applyGravity();
            App.setScore(this.score);
        }
    },
    applyGravity() {
        for (let c = 0; c < this.cols; c++) {
            const col = [];
            for (let r = this.rows - 1; r >= 0; r--) {
                if (this.grid[r][c]) col.push(this.grid[r][c]);
            }
            for (let r = this.rows - 1; r >= 0; r--) {
                this.grid[r][c] = col[this.rows - 1 - r] || 0;
            }
        }
    },
    onKey(key, down) {
        if (!down || this.gameOver) return;
        if (key === 'ArrowLeft' && this.current.x > 0 && !this.grid[this.current.y][this.current.x - 1]) this.current.x--;
        if (key === 'ArrowRight' && this.current.x < this.cols - 1 && !this.grid[this.current.y][this.current.x + 1]) this.current.x++;
        if (key === 'ArrowDown') this.drop();
        if (key === 'ArrowUp') { const tmp = this.current.c1; this.current.c1 = this.current.c2; this.current.c2 = tmp; }
    },
    onPointerDown(x, y, engine) {
        this._tx = x;
    },
    onPointerUp(x) {
        if (this.gameOver) return;
        const dx = x - this._tx;
        if (Math.abs(dx) < 20) {
            const tmp = this.current.c1; this.current.c1 = this.current.c2; this.current.c2 = tmp;
        } else {
            this.onKey(dx > 0 ? 'ArrowRight' : 'ArrowLeft', true);
        }
    },
    update(dt) {
        if (this.gameOver) return;
        this.timer += dt;
        if (this.timer >= this.speed) {
            this.timer = 0;
            this.drop();
        }
    },
    render(ctx, engine) {
        const w = engine.logicalWidth, h = engine.logicalHeight;
        const ts = Math.min(w / this.cols, h / this.rows);
        const ox = (w - ts * this.cols) / 2;
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#151528';
        ctx.fillRect(ox, 0, ts * this.cols, ts * this.rows);
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.grid[r][c]) {
                    ctx.fillStyle = this.grid[r][c];
                    GameEngine.drawRoundRect(ctx, ox + c * ts + 1, r * ts + 1, ts - 2, ts - 2, 4);
                    ctx.fill();
                }
            }
        }
        if (this.current) {
            ctx.fillStyle = this.current.c1;
            GameEngine.drawRoundRect(ctx, ox + this.current.x * ts + 1, this.current.y * ts + 1, ts - 2, ts - 2, 4);
            ctx.fill();
            if (this.current.y > 0) {
                ctx.fillStyle = this.current.c2;
                GameEngine.drawRoundRect(ctx, ox + this.current.x * ts + 1, (this.current.y - 1) * ts + 1, ts - 2, ts - 2, 4);
                ctx.fill();
            }
        }
    }
});

// 20. アステロイド (Asteroids)
App.registerGame({
    id: 'asteroids', name: 'アステロイド', nameEn: 'Asteroids', icon: '☄️',
    category: 'arcade', desc: '隕石を破壊しよう',
    ship: { x: 0, y: 0, angle: 0, vx: 0, vy: 0 }, bullets: [], rocks: [], score: 0, gameOver: false, timer: 0,
    start(engine) {
        const w = engine.logicalWidth, h = engine.logicalHeight;
        this.ship = { x: w / 2, y: h / 2, angle: -Math.PI / 2, vx: 0, vy: 0 };
        this.bullets = [];
        this.rocks = [];
        this.score = 0;
        this.gameOver = false;
        this.timer = 0;
        for (let i = 0; i < 5; i++) {
            this.rocks.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 60, vy: (Math.random() - 0.5) * 60, r: 25 + Math.random() * 15 });
        }
        App.setScore(0);
        engine.startLoop();
    },
    onPointerDown(x, y, engine) {
        const w = engine.logicalWidth, h = engine.logicalHeight;
        const dx = x - this.ship.x, dy = y - this.ship.y;
        this.ship.angle = Math.atan2(dy, dx);
        this.bullets.push({ x: this.ship.x, y: this.ship.y, vx: Math.cos(this.ship.angle) * 300, vy: Math.sin(this.ship.angle) * 300, life: 1.5 });
    },
    onKey(key, down, engine) {
        if (!down || this.gameOver) return;
        if (key === 'ArrowLeft') this.ship.angle -= 0.3;
        if (key === 'ArrowRight') this.ship.angle += 0.3;
        if (key === 'ArrowUp') {
            this.ship.vx += Math.cos(this.ship.angle) * 30;
            this.ship.vy += Math.sin(this.ship.angle) * 30;
        }
        if (key === ' ') {
            this.bullets.push({ x: this.ship.x, y: this.ship.y, vx: Math.cos(this.ship.angle) * 300, vy: Math.sin(this.ship.angle) * 300, life: 1.5 });
        }
    },
    update(dt, engine) {
        if (this.gameOver) return;
        const w = engine.logicalWidth, h = engine.logicalHeight;
        this.ship.x += this.ship.vx * dt;
        this.ship.y += this.ship.vy * dt;
        this.ship.vx *= 0.99;
        this.ship.vy *= 0.99;
        if (this.ship.x < 0) this.ship.x = w;
        if (this.ship.x > w) this.ship.x = 0;
        if (this.ship.y < 0) this.ship.y = h;
        if (this.ship.y > h) this.ship.y = 0;
        for (const b of this.bullets) {
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            b.life -= dt;
        }
        this.bullets = this.bullets.filter(b => b.life > 0);
        this.timer += dt;
        if (this.timer > 3 && this.rocks.length < 10) {
            this.timer = 0;
            this.rocks.push({ x: Math.random() * w, y: 0, vx: (Math.random() - 0.5) * 80, vy: 30 + Math.random() * 40, r: 20 + Math.random() * 15 });
        }
        const newRocks = [];
        for (const r of this.rocks) {
            r.x += r.vx * dt;
            r.y += r.vy * dt;
            if (r.x < -50) r.x = w + 50;
            if (r.x > w + 50) r.x = -50;
            if (r.y < -50) r.y = h + 50;
            if (r.y > h + 50) r.y = -50;
            let hit = false;
            for (const b of this.bullets) {
                if (Math.hypot(b.x - r.x, b.y - r.y) < r.r) {
                    hit = true;
                    b.life = 0;
                    this.score += 10;
                    App.setScore(this.score);
                    if (r.r > 15) {
                        newRocks.push({ x: r.x, y: r.y, vx: r.vx + 30, vy: r.vy - 30, r: r.r * 0.6 });
                        newRocks.push({ x: r.x, y: r.y, vx: r.vx - 30, vy: r.vy + 30, r: r.r * 0.6 });
                    }
                    break;
                }
            }
            if (!hit) {
                newRocks.push(r);
                if (Math.hypot(this.ship.x - r.x, this.ship.y - r.y) < r.r + 8) {
                    this.gameOver = true;
                    App.saveBestScore(this.id, this.score);
                    App.showOverlay('ゲームオーバー', `スコア: ${this.score}`, [
                        { text: 'リトライ', onClick: () => { App.el.overlay.classList.add('hidden'); this.start(GameEngine); } }
                    ]);
                }
            }
        }
        this.rocks = newRocks;
    },
    render(ctx, engine) {
        const w = engine.logicalWidth, h = engine.logicalHeight;
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, w, h);
        // ship
        ctx.save();
        ctx.translate(this.ship.x, this.ship.y);
        ctx.rotate(this.ship.angle);
        ctx.fillStyle = '#6c63ff';
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(-10, -8);
        ctx.lineTo(-10, 8);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        // bullets
        ctx.fillStyle = '#4ecdc4';
        for (const b of this.bullets) {
            ctx.beginPath();
            ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        // rocks
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 2;
        for (const r of this.rocks) {
            ctx.beginPath();
            ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
});

})();

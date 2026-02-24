const App = {
    games: [],
    currentGame: null,
    currentCategory: 'all',

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.renderCategories();
        this.renderGames();
    },

    cacheDOM() {
        this.el = {
            backBtn: document.getElementById('back-btn'),
            menuBtn: document.getElementById('menu-btn'),
            headerTitle: document.getElementById('header-title'),
            homeScreen: document.getElementById('home-screen'),
            gameScreen: document.getElementById('game-screen'),
            gamesGrid: document.getElementById('games-grid'),
            categoryTabs: document.getElementById('category-tabs'),
            searchInput: document.getElementById('search-input'),
            gameTitle: document.getElementById('game-title'),
            gameDesc: document.getElementById('game-desc'),
            gameContainer: document.getElementById('game-container'),
            canvas: document.getElementById('game-canvas'),
            scoreValue: document.getElementById('score-value'),
            gameControls: document.getElementById('game-controls'),
            overlay: document.getElementById('game-overlay'),
            overlayTitle: document.getElementById('overlay-title'),
            overlayMessage: document.getElementById('overlay-message'),
            overlayButtons: document.getElementById('overlay-buttons'),
        };
    },

    bindEvents() {
        this.el.backBtn.addEventListener('click', () => this.goHome());
        this.el.searchInput.addEventListener('input', (e) => this.filterGames(e.target.value));
    },

    registerGame(game) {
        this.games.push(game);
    },

    categories: [
        { id: 'all', name: '全て', emoji: '🎮' },
        { id: 'puzzle', name: 'パズル', emoji: '🧩' },
        { id: 'arcade', name: 'アーケード', emoji: '👾' },
    ],

    renderCategories() {
        this.el.categoryTabs.innerHTML = this.categories.map(c =>
            `<button class="cat-tab${c.id === 'all' ? ' active' : ''}" data-cat="${c.id}">${c.emoji} ${c.name}</button>`
        ).join('');
        this.el.categoryTabs.addEventListener('click', (e) => {
            const tab = e.target.closest('.cat-tab');
            if (!tab) return;
            this.currentCategory = tab.dataset.cat;
            this.el.categoryTabs.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            this.renderGames();
        });
    },

    renderGames(filter = '') {
        const games = this.games.filter(g => {
            const catMatch = this.currentCategory === 'all' || g.category === this.currentCategory;
            const searchMatch = !filter || g.name.includes(filter) || (g.nameEn && g.nameEn.toLowerCase().includes(filter.toLowerCase()));
            return catMatch && searchMatch;
        });

        this.el.gamesGrid.innerHTML = games.map((g, i) => {
            const best = this.getBestScore(g.id);
            const bestText = best !== null ? `Best: ${best}` : '';
            return `<div class="game-card" data-id="${g.id}" style="animation-delay:${i * 30}ms">
                <div class="game-icon cat-${g.category}">${g.icon}</div>
                <div class="game-card-title">${g.name}</div>
                ${bestText ? `<div class="game-card-best">${bestText}</div>` : ''}
            </div>`;
        }).join('');

        this.el.gamesGrid.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', () => this.launchGame(card.dataset.id));
        });
    },

    filterGames(term) {
        this.renderGames(term);
    },

    launchGame(id) {
        const game = this.games.find(g => g.id === id);
        if (!game) return;

        this.currentGame = game;
        this.el.homeScreen.classList.add('hidden');
        this.el.gameScreen.classList.remove('hidden');
        this.el.gameScreen.style.display = 'flex';
        this.el.backBtn.classList.remove('hidden');
        this.el.menuBtn.classList.add('hidden');
        this.el.headerTitle.textContent = game.name;
        this.el.gameTitle.textContent = game.name;
        this.el.gameDesc.textContent = game.desc;
        this.el.overlay.classList.add('hidden');
        this.setScore(0);

        this.el.gameControls.innerHTML = '<button class="game-btn btn-primary" id="restart-btn">リスタート</button>';
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.el.overlay.classList.add('hidden');
            GameEngine.stop();
            game.start(GameEngine);
        });

        GameEngine.init(this.el.canvas, this.el.gameContainer, game);
        game.start(GameEngine);
    },

    goHome() {
        if (this.currentGame) {
            GameEngine.stop();
            this.currentGame = null;
        }
        this.el.gameScreen.classList.add('hidden');
        this.el.gameScreen.style.display = '';
        this.el.homeScreen.classList.remove('hidden');
        this.el.backBtn.classList.add('hidden');
        this.el.menuBtn.classList.remove('hidden');
        this.el.headerTitle.textContent = '🎮 Mini Games';
        this.renderGames(this.el.searchInput.value);
    },

    setScore(val) {
        this.el.scoreValue.textContent = val;
    },

    showOverlay(title, message, buttons = []) {
        this.el.overlayTitle.textContent = title;
        this.el.overlayMessage.textContent = message;
        this.el.overlayButtons.innerHTML = buttons.map(b =>
            `<button class="game-btn ${b.class || 'btn-primary'}">${b.text}</button>`
        ).join('');
        this.el.overlayButtons.querySelectorAll('.game-btn').forEach((btn, i) => {
            btn.addEventListener('click', buttons[i].onClick);
        });
        this.el.overlay.classList.remove('hidden');
    },

    getBestScore(gameId) {
        try { return JSON.parse(localStorage.getItem('best_' + gameId)); } catch { return null; }
    },

    saveBestScore(gameId, score, higherIsBetter = true) {
        const best = this.getBestScore(gameId);
        if (best === null || (higherIsBetter ? score > best : score < best)) {
            localStorage.setItem('best_' + gameId, JSON.stringify(score));
        }
    }
};

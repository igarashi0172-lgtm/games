const App = {
    games: [],
    currentGame: null,
    currentCategory: 'all',
    currentTab: 'home',

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.renderCategories();
        this.renderGames();
    },

    cacheDOM() {
        this.el = {
            backBtn: document.getElementById('back-btn'),
            navSpacer: document.getElementById('nav-spacer'),
            headerTitle: document.getElementById('header-title'),
            homeScreen: document.getElementById('home-screen'),
            statsScreen: document.getElementById('stats-screen'),
            gameScreen: document.getElementById('game-screen'),
            gamesGrid: document.getElementById('games-grid'),
            gameCount: document.getElementById('game-count'),
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
            bottomNav: document.getElementById('bottom-nav'),
            topNav: document.getElementById('top-nav'),
            statsSummary: document.getElementById('stats-summary'),
            scoreList: document.getElementById('score-list'),
        };
    },

    bindEvents() {
        this.el.backBtn.addEventListener('click', () => this.goHome());
        this.el.searchInput.addEventListener('input', (e) => this.filterGames(e.target.value));

        this.el.bottomNav.querySelectorAll('.bottom-nav-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(tab);
            });
        });
    },

    switchTab(tab) {
        this.currentTab = tab;
        this.el.bottomNav.querySelectorAll('.bottom-nav-item').forEach(b => {
            b.classList.toggle('active', b.dataset.tab === tab);
        });
        this.el.homeScreen.classList.toggle('hidden', tab !== 'home');
        this.el.statsScreen.classList.toggle('hidden', tab !== 'stats');
        this.el.gameScreen.classList.add('hidden');

        this.el.headerTitle.innerHTML = tab === 'home'
            ? 'Mini <span class="accent">Games</span>'
            : '📊 スコアボード';
        this.el.backBtn.classList.add('hidden');
        this.el.navSpacer.style.width = '40px';

        if (tab === 'stats') this.renderStats();
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

        this.el.gameCount.textContent = `${games.length} games`;

        this.el.gamesGrid.innerHTML = games.map((g, i) => {
            const best = this.getBestScore(g.id);
            const bestText = best !== null ? `★ ${best}` : '';
            const catLabel = g.category === 'puzzle' ? 'パズル' : 'アーケード';
            const bgClass = g.category === 'puzzle' ? 'card-bg-puzzle' : 'card-bg-arcade';
            return `<div class="game-card" data-id="${g.id}" style="animation-delay:${i * 40}ms">
                <div class="game-card-visual ${bgClass}">${g.icon}</div>
                <div class="game-card-body">
                    <div class="game-card-title">${g.name}</div>
                    <div class="game-card-desc">${g.desc}</div>
                </div>
                <div class="game-card-footer">
                    ${bestText ? `<div class="game-card-best">${bestText}</div>` : '<div></div>'}
                    <div class="game-card-tag">${catLabel}</div>
                </div>
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
        this.el.statsScreen.classList.add('hidden');
        this.el.gameScreen.classList.remove('hidden');
        this.el.gameScreen.style.display = 'flex';
        this.el.bottomNav.classList.add('hidden');
        this.el.backBtn.classList.remove('hidden');
        this.el.navSpacer.style.width = '0';
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
        this.el.bottomNav.classList.remove('hidden');
        this.switchTab(this.currentTab === 'stats' ? 'stats' : 'home');
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
    },

    renderStats() {
        const played = this.games.filter(g => this.getBestScore(g.id) !== null);
        const totalGames = this.games.length;

        this.el.statsSummary.innerHTML = `
            <div class="stat-card">
                <div class="stat-card-value">${played.length}</div>
                <div class="stat-card-label">プレイ済み</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-value">${totalGames - played.length}</div>
                <div class="stat-card-label">未プレイ</div>
            </div>
        `;

        if (played.length === 0) {
            this.el.scoreList.innerHTML = `
                <div style="text-align:center;padding:40px 0;color:var(--text-tertiary);">
                    <div style="font-size:2rem;margin-bottom:8px;">🎮</div>
                    <div style="font-size:0.85rem;font-weight:600;">まだスコアがありません</div>
                    <div style="font-size:0.75rem;margin-top:4px;">ゲームをプレイしてスコアを記録しよう</div>
                </div>`;
            return;
        }

        this.el.scoreList.innerHTML = played.map(g => {
            const bgClass = g.category === 'puzzle' ? 'card-bg-puzzle' : 'card-bg-arcade';
            const catLabel = g.category === 'puzzle' ? 'パズル' : 'アーケード';
            return `<div class="score-item">
                <div class="score-item-icon ${bgClass}">${g.icon}</div>
                <div class="score-item-info">
                    <div class="score-item-name">${g.name}</div>
                    <div class="score-item-cat">${catLabel}</div>
                </div>
                <div class="score-item-score">${this.getBestScore(g.id)}</div>
            </div>`;
        }).join('');
    }
};

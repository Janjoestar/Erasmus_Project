document.addEventListener('DOMContentLoaded', () => {
    // ===== CONSTANTS =====
    const GRID_SIZE = 8;
    const THEMES = ['classic', 'dark', 'forest'];
    const COLORS = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)'];
    const SHAPES = [
        [[1]], 
        [[1,1]], 
        [[1,1,1]], 
        [[1,1,1,1]], 
        [[1,1,1,1,1]],
        [[1],[1]], 
        [[1],[1],[1]],
        [[1],[1],[1],[1]],
        [[1,1],[1,1]], 
        [[1,1,1],[1,1,1],[1,1,1]],
        [[1,0],[1,0],[1,1]], 
        [[1,1],[1,0]], 
        [[0,1],[0,1],[1,1]],
        [[1,0],[1,1]],
        [[1,1,1],[1,0,0]],
        [[1,1,1],[0,0,1]],
        [[1,1,1],[0,1,0]], 
        [[0,1],[1,1],[0,1]],
        [[1,1,0],[0,1,1]],
        [[0,1,1],[1,1,0]],
        [[0,1,0],[1,1,1],[0,1,0]]
    ];
    const FEEDBACK_PHRASES = ["NICE!", "SWEET!", "AWESOME!"];
    
    const BOSS_DATA = [
        { name: "BLOCK GOLEM", hp: 200, dmgPerLine: 50, atkSpeed: 5 },
        { name: "PUZZLE WYRM", hp: 350, dmgPerLine: 45, atkSpeed: 4 },
        { name: "GRID HYDRA", hp: 500, dmgPerLine: 40, atkSpeed: 4 }
    ];

    // ===== DOM HELPERS =====
    const $ = id => document.getElementById(id);
    const $$ = sel => document.querySelectorAll(sel);

    const dom = {
        mainMenu: $('main-menu'),
        gameScreen: $('game-screen'),
        grid: $('grid'),
        gridWrapper: document.querySelector('.grid-wrapper'),
        blockContainer: $('block-container'),
        feedbackLayer: $('feedback-layer'),
        particleLayer: $('particle-layer'),
        modal: $('game-over-modal'),
        score: $('score'),
        highScore: $('high-score'),
        menuHighScore: $('menu-high-score'),
        finalScore: $('final-score'),
        goTitle: $('go-title'),
        comboBox: $('combo-box'),
        comboMultiplier: $('combo-multiplier'),
        bossUI: $('boss-ui'),
        bossName: $('boss-name'),
        bossHpBar: $('boss-hp-bar'),
        bossHpText: $('boss-hp-text'),
        startBtns: $$('.mode-btn'),
        menuThemeBtn: $('menu-theme-btn'),
        gameThemeBtn: $('game-theme-btn'),
        backToMenuBtn: $('back-to-menu'),
        restartBtn: $('restart-btn'),
        exitToMenuBtn: $('exit-to-menu'),
        muteBtns: $$('.mute-btn')
    };

    // ===== GAME STATE =====
    const state = {
        grid: [],
        score: 0,
        highScore: parseInt(localStorage.getItem('better_blocks_hs')) || 0,
        comboStreak: 0,
        didClearThisTurn: false,
        currentThemeIndex: 0,
        isMuted: localStorage.getItem('better_blocks_muted') === 'true',
        mode: 'classic',
        boss: null,
        turnCounter: 0
    };

    // ===== AUDIO SYSTEM =====
    const audio = {
        ctx: new (window.AudioContext || window.webkitAudioContext)(),
        
        play(type) {
            if (state.isMuted || !this.ctx) return;
            if (this.ctx.state === 'suspended') this.ctx.resume();
            
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);

            const now = this.ctx.currentTime;
            const configs = {
                pop: { type: 'sine', freq: 600, vol: 0.08, dur: 0.1 },
                clear: { type: 'sawtooth', freq: 400, freqEnd: 100, vol: 0.3, dur: 0.3 },
                gameover: { type: 'triangle', freq: 200, freqEnd: 50, vol: 0.3, dur: 0.8 },
                highscore: { type: 'square', freq: 523.25, vol: 0.2, dur: 0.5 },
                blast: { type: 'sine', freq: 800, freqEnd: 200, vol: 0.4, dur: 0.4 },
                boss: { type: 'sawtooth', freq: 100, freqEnd: 50, vol: 0.2, dur: 0.2 },
                victory: { type: 'square', freq: 523.25, freqEnd: 800, vol: 0.3, dur: 0.6 }
            };

            const cfg = configs[type];
            if (!cfg) return;

            osc.type = cfg.type;
            osc.frequency.setValueAtTime(cfg.freq, now);
            if (cfg.freqEnd) osc.frequency.exponentialRampToValueAtTime(cfg.freqEnd, now + cfg.dur);
            
            gain.gain.setValueAtTime(cfg.vol, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + cfg.dur);
            
            osc.start(now);
            osc.stop(now + cfg.dur);
        }
    };

    // ===== UI UTILITIES =====
    const ui = {
        toggleScreen(show, hide) {
            hide.classList.add('hidden');
            show.classList.remove('hidden');
        },

        updateScore(value) {
            state.score = value;
            dom.score.textContent = value;
            
            if (value > state.highScore) {
                if (state.highScore > 0) audio.play('highscore');
                state.highScore = value;
                dom.highScore.textContent = value;
                localStorage.setItem('better_blocks_hs', value);
            }
        },

        updateComboUI() {
            if (state.comboStreak > 1) {
                dom.comboBox.classList.remove('hidden');
                dom.comboMultiplier.textContent = state.comboStreak;
                dom.grid.classList.add('combo-active');
            } else {
                dom.comboBox.classList.add('hidden');
                dom.grid.classList.remove('combo-active');
            }
        },
        
        updateBossUI() {
            if (!state.boss) return;
            const perc = Math.max(0, (state.boss.hp / state.boss.maxHp) * 100);
            dom.bossHpBar.style.width = perc + '%';
            dom.bossHpText.textContent = Math.ceil(perc) + '%';
        },

        showFeedback(text, animClass) {
            dom.feedbackLayer.innerHTML = '';
            const el = document.createElement('div');
            el.className = `float-text ${animClass}`;
            el.textContent = text;
            dom.feedbackLayer.appendChild(el);
            setTimeout(() => el.remove(), 800);
        },

        triggerShake() {
            dom.grid.classList.add('shake-heavy');
            setTimeout(() => dom.grid.classList.remove('shake-heavy'), 400);
        },

        spawnParticles(cellEl, color) {
            const cellRect = cellEl.getBoundingClientRect();
            const containerRect = dom.gridWrapper.getBoundingClientRect();
            const x = cellRect.left - containerRect.left + cellRect.width / 2;
            const y = cellRect.top - containerRect.top + cellRect.height / 2;

            for (let i = 0; i < 6; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.backgroundColor = color;
                particle.style.left = `${x}px`;
                particle.style.top = `${y}px`;
                dom.particleLayer.appendChild(particle);

                const angle = Math.random() * Math.PI * 2;
                const velocity = Math.random() * 40 + 20;
                const tx = Math.cos(angle) * velocity;
                const ty = Math.sin(angle) * velocity;

                particle.animate([
                    { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
                    { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0)`, opacity: 0 }
                ], { duration: 600, easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' }).onfinish = () => particle.remove();
            }
        },

        toggleMute() {
            state.isMuted = !state.isMuted;
            localStorage.setItem('better_blocks_muted', state.isMuted);
            dom.muteBtns.forEach(btn => btn.textContent = state.isMuted ? '🔇' : '🔊');
        },

        applyTheme() {
            const theme = THEMES[state.currentThemeIndex];
            document.body.setAttribute('data-theme', theme);
            dom.gameThemeBtn.textContent = theme.toUpperCase();
        }
    };

    // ===== GRID MANAGEMENT =====
    const grid = {
        create() {
            dom.grid.innerHTML = '';
            state.grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(null));
            
            for (let r = 0; r < GRID_SIZE; r++) {
                for (let c = 0; c < GRID_SIZE; c++) {
                    const cell = document.createElement('div');
                    cell.className = 'cell';
                    cell.dataset.r = r;
                    cell.dataset.c = c;
                    dom.grid.appendChild(cell);
                }
            }
        },

        getCell(r, c) {
            return document.querySelector(`.cell[data-r='${r}'][data-c='${c}']`);
        },

        canPlace(r, c, matrix) {
            return matrix.every((row, i) => 
                row.every((val, j) => {
                    if (!val) return true;
                    const tr = r + i;
                    const tc = c + j;
                    return tr >= 0 && tr < GRID_SIZE && 
                           tc >= 0 && tc < GRID_SIZE && 
                           state.grid[tr][tc] === null;
                })
            );
        },

        checkLines() {
            const rows = [];
            const cols = [];

            for (let r = 0; r < GRID_SIZE; r++) {
                if (state.grid[r].every(v => v !== null)) rows.push(r);
            }

            for (let c = 0; c < GRID_SIZE; c++) {
                let full = true;
                for (let r = 0; r < GRID_SIZE; r++) {
                    if (state.grid[r][c] === null) { full = false; break; }
                }
                if (full) cols.push(c);
            }

            const totalLines = rows.length + cols.length;
            if (totalLines === 0) return;

            state.didClearThisTurn = true;
            state.comboStreak++;
            ui.updateComboUI();
            audio.play('clear');

            if (totalLines >= 2) ui.triggerShake();

            // Boss Damage
            if (state.mode === 'boss' && state.boss) {
                const bossData = BOSS_DATA[state.boss.wave - 1];
                const dmg = totalLines * bossData.dmgPerLine;
                state.boss.hp -= dmg;
                ui.showFeedback(`-${dmg} DMG!`, "anim-damage");
                ui.updateBossUI();
                
                if (state.boss.hp <= 0) {
                    this.nextBossWave();
                }
            }

            const cellsToRemove = new Set();
            rows.forEach(r => { for (let c = 0; c < GRID_SIZE; c++) cellsToRemove.add(`${r},${c}`); });
            cols.forEach(c => { for (let r = 0; r < GRID_SIZE; r++) cellsToRemove.add(`${r},${c}`); });

            const lineBonus = totalLines > 1 ? totalLines : 1;
            const points = (cellsToRemove.size * 10) * lineBonus * state.comboStreak;
            ui.updateScore(state.score + points);

            const feedbackText = state.comboStreak > 2 
                ? `STREAK x${state.comboStreak}!` 
                : totalLines > 1 ? `COMBO x${totalLines}!` : FEEDBACK_PHRASES[Math.floor(Math.random() * FEEDBACK_PHRASES.length)];
            ui.showFeedback(feedbackText, "anim-blast");

            cellsToRemove.forEach(key => {
                const [r, c] = key.split(',').map(Number);
                const color = state.grid[r][c];
                state.grid[r][c] = null;
                const cell = this.getCell(r, c);
                ui.spawnParticles(cell, color);
                cell.style.backgroundColor = '';
                cell.classList.remove('filled', 'boss-junk');
            });
        },
        
        nextBossWave() {
            state.boss.wave++;
            if (state.boss.wave > BOSS_DATA.length) {
                audio.play('victory');
                dom.goTitle.textContent = "VICTORY!";
                dom.finalScore.textContent = state.score;
                dom.modal.classList.remove('hidden');
                return;
            }
            
            const nextData = BOSS_DATA[state.boss.wave - 1];
            state.boss.hp = nextData.hp;
            state.boss.maxHp = nextData.hp;
            state.boss.turnCounter = 0;
            dom.bossName.textContent = nextData.name;
            ui.updateBossUI();
            
            ui.showFeedback("NEXT WAVE!", "anim-blast");
        }
    };

    // ===== SHAPE AVAILABILITY =====
    function canShapeFitAnywhere(matrix) {
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (grid.canPlace(r, c, matrix)) return true;
            }
        }
        return false;
    }

    function updateShapeAvailability() {
        const shapesLeft = Array.from(dom.blockContainer.children);
        shapesLeft.forEach(shapeEl => {
            const matrix = JSON.parse(shapeEl.dataset.matrix);
            const canFit = canShapeFitAnywhere(matrix);
            shapeEl.classList.toggle('disabled', !canFit);
        });
    }

    // ===== PREVIEW LOGIC =====
    function computeLinesForPlacement(r, c, matrix) {
        const tempGrid = state.grid.map(row => row.slice());
        matrix.forEach((rowArr, i) => {
            rowArr.forEach((val, j) => {
                if (val) {
                    const tr = r + i, tc = c + j;
                    if (tr >= 0 && tr < GRID_SIZE && tc >= 0 && tc < GRID_SIZE) tempGrid[tr][tc] = true;
                }
            });
        });

        const rows = [], cols = [];
        for (let rr = 0; rr < GRID_SIZE; rr++) if (tempGrid[rr].every(v => v !== null)) rows.push(rr);
        for (let cc = 0; cc < GRID_SIZE; cc++) {
            let full = true;
            for (let rr = 0; rr < GRID_SIZE; rr++) if (tempGrid[rr][cc] === null) { full = false; break; }
            if (full) cols.push(cc);
        }
        return { rows, cols };
    }

    function clearPreviewLines() { 
        document.querySelectorAll('.cell.will-clear').forEach(c => c.classList.remove('will-clear')); 
    }

    function highlightPreviewLines(rows, cols) {
        clearPreviewLines();
        rows.forEach(r => { 
            for (let c = 0; c < GRID_SIZE; c++) { 
                const cell = grid.getCell(r, c); 
                if(cell) cell.classList.add('will-clear'); 
            } 
        });
        cols.forEach(c => { 
            for (let r = 0; r < GRID_SIZE; r++) { 
                const cell = grid.getCell(r, c); 
                if(cell) cell.classList.add('will-clear'); 
            } 
        });
    }

    // ===== SHAPE MANAGEMENT =====
    const shapes = {
        dragState: null,

        spawn() {
            dom.blockContainer.innerHTML = '';
            
            let attempts = 0;
            let hasPlaceableShape = false;
            
            // Keep generating until we have at least one placeable shape
            while (!hasPlaceableShape && attempts < 100) {
                dom.blockContainer.innerHTML = '';
                hasPlaceableShape = false;
                
                for (let i = 0; i < 3; i++) {
                    const matrix = SHAPES[Math.floor(Math.random() * SHAPES.length)];
                    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
                    
                    const wrapper = document.createElement('div');
                    wrapper.className = 'shape';
                    wrapper.style.gridTemplateColumns = `repeat(${matrix[0].length}, 1fr)`;
                    wrapper.dataset.matrix = JSON.stringify(matrix);
                    wrapper.dataset.color = color;
                    
                    matrix.forEach(row => {
                        row.forEach(val => {
                            const block = document.createElement('div');
                            if (val) block.style.backgroundColor = color;
                            else block.style.opacity = '0';
                            wrapper.appendChild(block);
                        });
                    });
                    
                    wrapper.addEventListener('pointerdown', (e) => this.onDragStart(e, wrapper));
                    dom.blockContainer.appendChild(wrapper);
                    
                    if (canShapeFitAnywhere(matrix)) {
                        hasPlaceableShape = true;
                    }
                }
                attempts++;
            }
            
            updateShapeAvailability();
        },

        onDragStart(e, element) {
            e.preventDefault();
            const matrix = JSON.parse(element.dataset.matrix);
            if (!canShapeFitAnywhere(matrix)) return;

            const color = element.dataset.color;
            const mirror = element.cloneNode(true);
            mirror.className = 'dragging-mirror';
            mirror.style.gridTemplateColumns = `repeat(${matrix[0].length}, 1fr)`;
            
            const gridCellSize = document.querySelector('.cell').offsetWidth;
            const width = gridCellSize * matrix[0].length + (matrix[0].length - 1) * 4;
            mirror.style.width = width + 'px';
            mirror.style.gap = '4px';
            
            Array.from(mirror.children).forEach(child => {
                child.style.width = gridCellSize + 'px';
                child.style.height = gridCellSize + 'px';
                child.style.borderRadius = '3px';
                child.style.boxShadow = 'inset 0 -2px 0 rgba(0,0,0,0.2)';
                if (child.style.opacity !== '0') child.style.backgroundColor = color;
            });

            document.body.appendChild(mirror);
            element.style.opacity = '0';

            state.didClearThisTurn = false;

            this.dragState = { 
                source: element, 
                mirror, 
                matrix, 
                color, 
                offsetX: width / 2, 
                offsetY: (gridCellSize * matrix.length) / 2 + 70 
            };
            this.onDragMove(e);
        },

        onDragMove(e) {
            if (!this.dragState) return;
            
            const x = e.clientX || (e.touches ? e.touches[0].clientX : 0);
            const y = e.clientY || (e.touches ? e.touches[0].clientY : 0);
            
            const { mirror, matrix, color, offsetX, offsetY } = this.dragState;
            mirror.style.left = (x - offsetX) + 'px';
            mirror.style.top = (y - offsetY) + 'px';

            document.querySelectorAll('.ghost').forEach(c => { 
                c.classList.remove('ghost'); 
                c.style.removeProperty('--ghost-color'); 
            });
            clearPreviewLines();
            
            const gridRect = dom.grid.getBoundingClientRect();
            const cellSize = document.querySelector('.cell').offsetWidth + 4;
            const relX = (x - gridRect.left) - (mirror.offsetWidth / 2) + (cellSize / 4);
            const relY = (y - gridRect.top) - (mirror.offsetHeight / 2) + (cellSize / 4) - 70;
            const col = Math.round(relX / cellSize);
            const row = Math.round(relY / cellSize);

            if (grid.canPlace(row, col, matrix)) {
                matrix.forEach((rowArr, i) => {
                    rowArr.forEach((val, j) => {
                        if (val) {
                            const cell = grid.getCell(row + i, col + j);
                            if (cell) { 
                                cell.classList.add('ghost'); 
                                cell.style.setProperty('--ghost-color', color); 
                            }
                        }
                    });
                });
                this.dragState.target = { r: row, c: col };
                const { rows, cols } = computeLinesForPlacement(row, col, matrix);
                if (rows.length || cols.length) highlightPreviewLines(rows, cols);
            } else {
                this.dragState.target = null;
            }
        },

        onDragEnd(e) {
            if (!this.dragState) return;
            
            const { source, mirror, matrix, color, target } = this.dragState;
            mirror.remove();
            document.querySelectorAll('.ghost').forEach(c => { 
                c.classList.remove('ghost'); 
                c.style.removeProperty('--ghost-color'); 
            });
            clearPreviewLines();

            if (target) {
                audio.play('pop');
                source.remove();
                
                matrix.forEach((rowArr, i) => {
                    rowArr.forEach((val, j) => {
                        if (val) {
                            state.grid[target.r + i][target.c + j] = color;
                            const cell = grid.getCell(target.r + i, target.c + j);
                            cell.style.backgroundColor = color;
                            cell.classList.add('filled');
                        }
                    });
                });
                
                state.turnCounter++;
                
                const multiplier = Math.max(1, state.comboStreak);
                ui.updateScore(state.score + (10 * multiplier));
                ui.showFeedback(multiplier > 1 ? `+${10 * multiplier}` : "+10", "anim-score");
                
                grid.checkLines();

                // Boss Logic
                if (state.mode === 'boss' && state.boss) {
                   const bossData = BOSS_DATA[state.boss.wave - 1];
                   state.boss.turnCounter++;
                   
                   // Boss only attacks if didn't clear a line AND every X turns
                   if (!state.didClearThisTurn && state.boss.turnCounter >= bossData.atkSpeed) {
                       game.bossAttack();
                       state.boss.turnCounter = 0;
                   }
                }

                if (!state.didClearThisTurn) {
                    state.comboStreak = 0;
                    ui.updateComboUI();
                }

                if (dom.blockContainer.children.length === 0) {
                    this.spawn();
                } else {
                    updateShapeAvailability();
                }

                game.checkGameOver();
            } else {
                source.style.opacity = '1';
            }
            
            this.dragState = null;
        }
    };

    // ===== GAME CONTROL =====
    const game = {
        start(mode) {
            state.mode = mode;
            ui.toggleScreen(dom.gameScreen, dom.mainMenu);
            if (audio.ctx.state === 'suspended') audio.ctx.resume();
            this.reset();
        },

        reset() {
            grid.create();
            shapes.spawn();
            state.score = 0;
            state.comboStreak = 0;
            state.turnCounter = 0;
            
            if (state.mode === 'boss') {
                dom.bossUI.style.display = 'block';
                state.boss = { 
                    hp: BOSS_DATA[0].hp, 
                    maxHp: BOSS_DATA[0].hp, 
                    wave: 1, 
                    turnCounter: 0 
                };
                dom.bossName.textContent = BOSS_DATA[0].name;
                ui.updateBossUI();
            } else {
                dom.bossUI.style.display = 'none';
                state.boss = null;
            }

            ui.updateComboUI();
            ui.updateScore(0);
            dom.modal.classList.add('hidden');
            dom.grid.classList.remove('combo-active');
        },

        showMenu() {
            ui.toggleScreen(dom.mainMenu, dom.gameScreen);
            dom.modal.classList.add('hidden');
            dom.menuHighScore.textContent = state.highScore;
        },

        bossAttack() {
            audio.play('boss');
            ui.triggerShake();
            ui.showFeedback("BOSS ATTACK!", "anim-damage");
            
            // Add 2 random junk blocks
            let count = 2;
            for(let i = 0; i < count; i++) {
                let r = Math.floor(Math.random() * GRID_SIZE);
                let c = Math.floor(Math.random() * GRID_SIZE);
                
                let attempts = 0;
                while(state.grid[r][c] !== null && attempts < 50) {
                    r = Math.floor(Math.random() * GRID_SIZE);
                    c = Math.floor(Math.random() * GRID_SIZE);
                    attempts++;
                }
                
                if (state.grid[r][c] === null) {
                    state.grid[r][c] = 'junk';
                    const cell = grid.getCell(r, c);
                    cell.style.backgroundColor = 'var(--text-color)';
                    cell.classList.add('filled', 'boss-junk');
                }
            }
        },

        checkGameOver() {
            const shapesLeft = Array.from(dom.blockContainer.children);
            const hasPossibleMove = shapesLeft.some(shapeEl => {
                const matrix = JSON.parse(shapeEl.dataset.matrix);
                return canShapeFitAnywhere(matrix);
            });

            if (!hasPossibleMove) {
                audio.play('gameover');
                dom.goTitle.textContent = state.score === state.highScore && state.score > 0 
                    ? "NEW HIGH SCORE!" 
                    : "NO MOVES LEFT!";
                dom.finalScore.textContent = state.score;
                dom.modal.classList.remove('hidden');
            }
        }
    };

    // ===== INITIALIZATION =====
    function init() {
        dom.menuHighScore.textContent = state.highScore;
        dom.highScore.textContent = state.highScore;
        ui.applyTheme();
        dom.muteBtns.forEach(btn => btn.textContent = state.isMuted ? '🔇' : '🔊');
    }

    // ===== EVENT LISTENERS =====
    dom.startBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.id.replace('mode-', '');
            game.start(mode);
        });
    });
    
    dom.backToMenuBtn.addEventListener('click', () => game.showMenu());
    dom.exitToMenuBtn.addEventListener('click', () => game.showMenu());
    dom.restartBtn.addEventListener('click', () => game.reset());
    dom.muteBtns.forEach(btn => btn.addEventListener('click', () => ui.toggleMute()));
    
    [dom.menuThemeBtn, dom.gameThemeBtn].forEach(btn => {
        btn.addEventListener('click', () => {
            state.currentThemeIndex = (state.currentThemeIndex + 1) % THEMES.length;
            ui.applyTheme();
        });
    });

    window.addEventListener('pointermove', (e) => shapes.onDragMove(e));
    window.addEventListener('pointerup', (e) => shapes.onDragEnd(e));

    init();
});
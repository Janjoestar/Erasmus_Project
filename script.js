document.addEventListener('DOMContentLoaded', () => {
    // ===== CONSTANTS =====
    const GRID_SIZE = 8;
    const TOTAL_BOSSES = 6;
    const THEMES = ['classic', 'dark', 'forest', 'ocean', 'sunset', 'neon', 'pastel', 'retro'];
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
        { 
            name: "BLOCK GOLEM", 
            hp: 50, 
            dmgPerLine: 50, 
            atkSpeed: 5,
            theme: "golem",
            icon: `<svg viewBox="0 0 40 40"><rect x="10" y="12" width="20" height="20" fill="white"/><rect x="8" y="16" width="4" height="4" fill="white"/><rect x="28" y="16" width="4" height="4" fill="white"/><rect x="14" y="20" width="3" height="3" fill="white" opacity="0.6"/><rect x="23" y="20" width="3" height="3" fill="white" opacity="0.6"/></svg>`
        },
        { 
            name: "PUZZLE WYRM", 
            hp: 50, 
            dmgPerLine: 45, 
            atkSpeed: 4,
            theme: "wyrm",
            icon: `<svg viewBox="0 0 40 40"><path d="M 20 10 Q 15 15, 12 20 Q 15 25, 20 30 Q 25 25, 28 20 Q 25 15, 20 10" fill="white"/><circle cx="17" cy="18" r="2" fill="white" opacity="0.6"/><circle cx="23" cy="18" r="2" fill="white" opacity="0.6"/><path d="M 18 24 Q 20 26, 22 24" stroke="white" stroke-width="2" fill="none"/></svg>`
        },
        { 
            name: "GRID HYDRA", 
            hp: 50, 
            dmgPerLine: 40, 
            atkSpeed: 4,
            theme: "hydra",
            icon: `<svg viewBox="0 0 40 40"><circle cx="20" cy="16" r="8" fill="white"/><circle cx="14" cy="26" r="5" fill="white"/><circle cx="26" cy="26" r="5" fill="white"/><circle cx="18" cy="14" r="1.5" fill="white" opacity="0.6"/><circle cx="22" cy="14" r="1.5" fill="white" opacity="0.6"/></svg>`
        },
        {
            name: "TILE TITAN",
            hp: 60,
            dmgPerLine: 40,
            atkSpeed: 3,
            theme: "titan",
            icon: `<svg viewBox="0 0 40 40"><rect x="12" y="8" width="16" height="24" fill="white"/><rect x="10" y="14" width="4" height="4" fill="white"/><rect x="26" y="14" width="4" height="4" fill="white"/><rect x="14" y="18" width="4" height="6" fill="white" opacity="0.6"/><rect x="22" y="18" width="4" height="6" fill="white" opacity="0.6"/></svg>`
        },
        {
            name: "CHAOS CUBE",
            hp: 70,
            dmgPerLine: 35,
            atkSpeed: 3,
            theme: "chaos",
            icon: `<svg viewBox="0 0 40 40"><rect x="10" y="10" width="20" height="20" fill="white" transform="rotate(45 20 20)"/><circle cx="20" cy="20" r="4" fill="white" opacity="0.6"/><rect x="15" y="8" width="10" height="2" fill="white"/><rect x="15" y="30" width="10" height="2" fill="white"/></svg>`
        },
        {
            name: "VOID SOVEREIGN",
            hp: 80,
            dmgPerLine: 30,
            atkSpeed: 3,
            theme: "void",
            icon: `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="12" fill="white"/><circle cx="20" cy="20" r="6" fill="white" opacity="0.3"/><path d="M 12 12 L 28 28 M 28 12 L 12 28" stroke="white" stroke-width="2" opacity="0.6"/></svg>`
        }
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
        bestLabel: $('best-label'),
        bestScoreBox: $('best-score-box'),
        menuHighScore: $('menu-high-score'),
        finalScore: $('final-score'),
        goTitle: $('go-title'),
        comboBox: $('combo-box'),
        comboMultiplier: $('combo-multiplier'),
        bossUI: $('boss-ui'),
        bossName: $('boss-name'),
        bossIcon: $('boss-icon'),
        bossHpBar: $('boss-hp-bar'),
        bossHpText: $('boss-hp-text'),
        bossProgress: $('boss-progress'),
        startBtns: $$('.mode-btn'),
        menuThemeBtn: $('menu-theme-btn'),
        gameThemeBtn: $('game-theme-btn'),
        backToMenuBtn: $('back-to-menu'),
        restartBtn: $('restart-btn'),
        exitToMenuBtn: $('exit-to-menu'),
        muteBtns: $$('.mute-btn'),
        victoryOverlay: $('victory-overlay'),
        victoryHpFill: $('victory-hp-fill')
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
        turnCounter: 0,
        isGameOver: false
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
                victory: { type: 'square', freq: 523.25, freqEnd: 800, vol: 0.3, dur: 0.6 },
                bossDeath: { type: 'sawtooth', freq: 300, freqEnd: 50, vol: 0.5, dur: 1.0 }
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
        
        updateBossProgress() {
            if (!state.boss) return;
            
            const nodes = document.querySelectorAll('.boss-node');
            nodes.forEach((node, index) => {
                node.classList.remove('active', 'defeated');
                if (index < state.boss.wave - 1) {
                    node.classList.add('defeated');
                } else if (index === state.boss.wave - 1) {
                    node.classList.add('active');
                }
            });
        },
        
        applyBossTheme(wave) {
            if (!wave) {
                document.body.removeAttribute('data-boss-theme');
                document.body.removeAttribute('data-boss-blocks');
                return;
            }
            
            const bossData = BOSS_DATA[wave - 1];
            document.body.setAttribute('data-boss-theme', bossData.theme);
            document.body.setAttribute('data-boss-blocks', bossData.theme);
            
            // Update boss icon
            dom.bossIcon.innerHTML = bossData.icon;
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


            for (let i = 0; i < 8; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.backgroundColor = color;
                particle.style.left = `${x}px`;
                particle.style.top = `${y}px`;
                dom.particleLayer.appendChild(particle);


                const angle = Math.random() * Math.PI * 2;
                const velocity = Math.random() * 60 + 30;
                const tx = Math.cos(angle) * velocity;
                const ty = Math.sin(angle) * velocity;


                particle.animate([
                    { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
                    { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0)`, opacity: 0 }
                ], { duration: 800, easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' }).onfinish = () => particle.remove();
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
        },
        
        // Clear all blocks with confetti-like explosion
        async clearBoardConfetti() {
            const cells = Array.from(document.querySelectorAll('.cell.filled'));
            
            // Create confetti from each cell
            cells.forEach((cell, index) => {
                const color = state.grid[parseInt(cell.dataset.r)][parseInt(cell.dataset.c)];
                
                // Stagger the confetti bursts slightly
                setTimeout(() => {
                    this.spawnParticles(cell, color);
                    
                    // Fade out the cell
                    cell.animate([
                        { opacity: 1, transform: 'scale(1)' },
                        { opacity: 0, transform: 'scale(0.5)' }
                    ], { duration: 300, easing: 'ease-out' }).onfinish = () => {
                        const r = parseInt(cell.dataset.r);
                        const c = parseInt(cell.dataset.c);
                        state.grid[r][c] = null;
                        cell.style.backgroundColor = '';
                        cell.classList.remove('filled', 'boss-junk');
                        cell.style.opacity = '1';
                        cell.style.transform = '';
                    };
                }, index * 20); // Stagger by 20ms per cell for wave effect
            });
            
            // Play celebration sounds
            audio.play('blast');
            setTimeout(() => audio.play('victory'), 200);
            
            // Wait for all animations to complete
            await new Promise(resolve => setTimeout(resolve, cells.length * 20 + 500));
            
            // Reset combo
            state.comboStreak = 0;
            ui.updateComboUI();
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
                    this.defeatBoss();
                    return;
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
        
        async defeatBoss() {
            // Pause game logic
            state.isGameOver = true; 
            
            // Play victory sound
            audio.play('victory');
            
            // Show overlay
            dom.victoryOverlay.classList.add('active');
            
            // Animate HP Bar draining visually in overlay
            setTimeout(() => {
                dom.victoryHpFill.style.width = '0%';
            }, 100);

            // Wait for cutscene
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Clear the entire board with confetti effect
            await ui.clearBoardConfetti();
            
            // Reset visual
            dom.victoryOverlay.classList.remove('active');
            dom.victoryHpFill.style.width = '100%';
            
            // Spawn new shapes
            shapes.spawn();
            
            // Next Wave Logic
            state.boss.wave++;
            if (state.boss.wave > TOTAL_BOSSES) {
                // Beat the whole game
                dom.goTitle.textContent = "YOU WIN!";
                dom.finalScore.textContent = state.score;
                dom.modal.classList.remove('hidden');
                state.isGameOver = false;
                ui.applyBossTheme(null);
                return;
            }
            
            const nextData = BOSS_DATA[state.boss.wave - 1];
            state.boss.hp = nextData.hp;
            state.boss.maxHp = nextData.hp;
            state.boss.turnCounter = 0;
            dom.bossName.textContent = nextData.name;
            dom.highScore.textContent = state.boss.wave + '/' + TOTAL_BOSSES;
            
            // Apply new boss theme
            ui.applyBossTheme(state.boss.wave);
            ui.updateBossUI();
            ui.updateBossProgress();
            
            ui.showFeedback("NEXT WAVE!", "anim-blast");
            
            // Resume Game
            state.isGameOver = false;
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


            if (target && !state.isGameOver) {
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
                if (state.mode === 'boss' && state.boss && !state.isGameOver) {
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
            state.isGameOver = false;
            
            if (state.mode === 'boss') {
                dom.bossUI.style.display = 'block';
                dom.bossProgress.classList.remove('hidden');
                dom.gridWrapper.classList.add('boss-mode');
                dom.bestLabel.textContent = 'Wave';
                dom.highScore.textContent = '1/' + TOTAL_BOSSES;
                state.boss = { 
                    hp: BOSS_DATA[0].hp, 
                    maxHp: BOSS_DATA[0].hp, 
                    wave: 1, 
                    turnCounter: 0 
                };
                dom.bossName.textContent = BOSS_DATA[0].name;
                ui.applyBossTheme(1);
                ui.updateBossUI();
                ui.updateBossProgress();
            } else {
                dom.bossUI.style.display = 'none';
                dom.bossProgress.classList.add('hidden');
                dom.gridWrapper.classList.remove('boss-mode');
                dom.bestLabel.textContent = 'Best';
                dom.highScore.textContent = state.highScore;
                state.boss = null;
                ui.applyBossTheme(null);
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
            ui.applyBossTheme(null);
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
            if (state.isGameOver) return;

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
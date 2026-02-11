document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const mainMenu = document.getElementById('main-menu');
    const gameScreen = document.getElementById('game-screen');
    const gridEl = document.getElementById('grid');
    const gridWrapper = document.querySelector('.grid-wrapper');
    const blockContainer = document.getElementById('block-container');
    const scoreEl = document.getElementById('score');
    const highScoreEl = document.getElementById('high-score');
    const menuHighScoreEl = document.getElementById('menu-high-score');
    const feedbackLayer = document.getElementById('feedback-layer');
    const particleLayer = document.getElementById('particle-layer');
    const modal = document.getElementById('game-over-modal');
    const finalScoreEl = document.getElementById('final-score');
    const goTitle = document.getElementById('go-title');
    const comboBox = document.getElementById('combo-box');
    const comboMultiplierEl = document.getElementById('combo-multiplier');

    // --- Buttons ---
    const startBtn = document.getElementById('start-game-btn');
    const menuThemeBtn = document.getElementById('menu-theme-btn');
    const gameThemeBtn = document.getElementById('game-theme-btn');
    const backToMenuBtn = document.getElementById('back-to-menu');
    const restartBtn = document.getElementById('restart-btn');
    const exitToMenuBtn = document.getElementById('exit-to-menu');
    const muteBtns = document.querySelectorAll('.mute-btn');

    // --- Game State ---
    const gridSize = 8;
    let grid = [];
    let score = 0;
    let highScore = localStorage.getItem('better_blocks_hs') || 0;
    // Combo System State
    let comboStreak = 0;
    let didClearThisTurn = false;

    // --- Config ---
    const themes = ['classic', 'dark', 'forest'];
    let currentThemeIndex = 0;
    let isMuted = localStorage.getItem('better_blocks_muted') === 'true';

    const shapes = [
        [[1]], [[1,1]], [[1,1,1]], [[1,1,1,1]], [[1],[1]], [[1],[1],[1]],
        [[1,1],[1,1]], [[1,1,1],[0,1,0]], [[1,0],[1,0],[1,1]], [[1,1],[1,0]]
    ];
    const colors = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)'];

    function init() {
        menuHighScoreEl.textContent = highScore;
        highScoreEl.textContent = highScore;
        applyTheme();
        updateMuteUI();
    }

    // --- Audio System (Web Audio API) ---
    const sfx = {
        ctx: new (window.AudioContext || window.webkitAudioContext)(),
        play(type) {
            if (isMuted || !this.ctx) return;
            // Resume context if suspended (browser autoplay policy)
            if(this.ctx.state === 'suspended') this.ctx.resume();
            
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain); gain.connect(this.ctx.destination);

            const now = this.ctx.currentTime;
            if (type === 'pop') {
                osc.type = 'sine'; osc.frequency.setValueAtTime(600, now);
                gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now); osc.stop(now + 0.1);
            } else if (type === 'clear') {
                osc.type = 'sawtooth'; osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
                gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.start(now); osc.stop(now + 0.3);
            } else if (type === 'gameover') {
                osc.type = 'triangle'; osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(50, now + 0.8);
                gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
                osc.start(now); osc.stop(now + 0.8);
            } else if (type === 'highscore') {
                 osc.type = 'square'; osc.frequency.setValueAtTime(523.25, now); // C5
                 osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
                 osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
                 gain.gain.setValueAtTime(0.2, now); gain.gain.linearRampToValueAtTime(0, now + 0.5);
                 osc.start(now); osc.stop(now + 0.5);
            }
        }
    };

    // --- Navigation & UI ---
    function startGame() {
        mainMenu.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        // Ensure audio context is active on user interaction
        if(sfx.ctx.state === 'suspended') sfx.ctx.resume();
        resetGame();
    }

    function showMenu() {
        gameScreen.classList.add('hidden');
        mainMenu.classList.remove('hidden');
        modal.classList.add('hidden');
        menuHighScoreEl.textContent = highScore;
    }

    function resetGame() {
        createGrid();
        spawnShapes();
        score = 0; comboStreak = 0; updateComboUI();
        updateScore(0);
        modal.classList.add('hidden');
        gridEl.classList.remove('combo-active');
    }

    function toggleMute() {
        isMuted = !isMuted;
        localStorage.setItem('better_blocks_muted', isMuted);
        updateMuteUI();
    }

    function updateMuteUI() {
        muteBtns.forEach(btn => btn.textContent = isMuted ? '🔇' : '🔊');
    }

    // --- Core Game Logic ---
    function createGrid() {
        gridEl.innerHTML = '';
        grid = Array(gridSize).fill().map(() => Array(gridSize).fill(null));
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.r = r; cell.dataset.c = c;
                gridEl.appendChild(cell);
            }
        }
    }

    function updateScore(val) {
        score = val;
        scoreEl.textContent = score;
        if(score > highScore) {
            if(highScore > 0) sfx.play('highscore'); // Only play if beating previous
            highScore = score;
            highScoreEl.textContent = highScore;
            localStorage.setItem('better_blocks_hs', highScore);
        }
    }

    function updateComboUI() {
        if (comboStreak > 1) {
            comboBox.classList.remove('hidden');
            comboMultiplierEl.textContent = comboStreak;
            gridEl.classList.add('combo-active');
        } else {
            comboBox.classList.add('hidden');
            gridEl.classList.remove('combo-active');
        }
    }

    function spawnShapes() {
        blockContainer.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const matrix = shapes[Math.floor(Math.random() * shapes.length)];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const wrapper = document.createElement('div');
            wrapper.classList.add('draggable-shape');
            wrapper.style.gridTemplateRows = `repeat(${matrix.length}, 1fr)`;
            wrapper.style.gridTemplateColumns = `repeat(${matrix[0].length}, 1fr)`;
            matrix.forEach(row => row.forEach(val => {
                const b = document.createElement('div');
                if(val) { b.classList.add('shape-cell'); b.style.backgroundColor = color; }
                wrapper.appendChild(b);
            }));
            wrapper.dataset.matrix = JSON.stringify(matrix);
            wrapper.dataset.color = color;
            attachDragEvents(wrapper);
            blockContainer.appendChild(wrapper);
        }
    }

    // --- Drag & Drop Logic ---
    function attachDragEvents(el) {
        let isDragging = false, clone = null;
        const onStart = (e) => {
            isDragging = true;
            const touch = e.touches ? e.touches[0] : e;
            const rect = el.getBoundingClientRect();
            clone = el.cloneNode(true);
            clone.classList.add('dragging');
            const gridCellSize = gridEl.firstElementChild.getBoundingClientRect().width;
            clone.style.transform = `scale(${(gridCellSize * 0.9) / 20})`;
            clone.style.width = rect.width + 'px';
            document.body.appendChild(clone);
            el.style.opacity = '0';
            moveClone(touch.clientX, touch.clientY);
        };
        const onMove = (e) => {
            if (!isDragging) return;
            const touch = e.touches ? e.touches[0] : e;
            moveClone(touch.clientX, touch.clientY);
            const anchor = getGridAnchor(touch.clientX, touch.clientY, JSON.parse(el.dataset.matrix));
            document.querySelectorAll('.hovered').forEach(c => c.classList.remove('hovered'));
            if (anchor && canPlace(anchor.r, anchor.c, JSON.parse(el.dataset.matrix))) {
                JSON.parse(el.dataset.matrix).forEach((row, i) => row.forEach((val, j) => {
                    if(val) {
                        const cell = document.querySelector(`.cell[data-r='${anchor.r+i}'][data-c='${anchor.c+j}']`);
                        if(cell) cell.classList.add('hovered');
                    }
                }));
            }
        };
        const onEnd = (e) => {
            if (!isDragging) return;
            isDragging = false;
            const touch = e.changedTouches ? e.changedTouches[0] : e;
            const matrix = JSON.parse(el.dataset.matrix);
            const anchor = getGridAnchor(touch.clientX, touch.clientY, matrix);
            
            if (anchor && canPlace(anchor.r, anchor.c, matrix)) {
                // Successfully placed
                placeBlock(anchor.r, anchor.c, matrix, el.dataset.color);
                el.remove();
                
                // Check lines and update streak
                checkLines();
                if(!didClearThisTurn) {
                    comboStreak = 0;
                    updateComboUI();
                }

                if (blockContainer.children.length === 0) spawnShapes();
                checkGameOver();
            } else { 
                el.style.opacity = '1'; // Snap back
            }
            if (clone) clone.remove();
            document.querySelectorAll('.hovered').forEach(c => c.classList.remove('hovered'));
        };
        const moveClone = (x, y) => { clone.style.left = (x - clone.offsetWidth/2) + 'px'; clone.style.top = (y - clone.offsetHeight/2) + 'px'; };
        el.addEventListener('mousedown', onStart); window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onEnd);
        el.addEventListener('touchstart', onStart, {passive: false}); window.addEventListener('touchmove', onMove, {passive: false}); window.addEventListener('touchend', onEnd);
    }

    function getGridAnchor(x, y, matrix) {
        const elUnder = document.elementFromPoint(x, y);
        if (!elUnder || !elUnder.classList.contains('cell')) return null;
        return { r: parseInt(elUnder.dataset.r) - Math.floor(matrix.length/2), c: parseInt(elUnder.dataset.c) - Math.floor(matrix[0].length/2) };
    }

    function canPlace(r, c, matrix) {
        return matrix.every((row, i) => row.every((val, j) => {
            if(!val) return true;
            let tr = r+i, tc = c+j;
            return tr >= 0 && tr < gridSize && tc >= 0 && tc < gridSize && grid[tr][tc] === null;
        }));
    }

    function placeBlock(r, c, matrix, color) {
        didClearThisTurn = false; // Reset turn flag
        sfx.play('pop');
        matrix.forEach((row, i) => row.forEach((val, j) => {
            if(val) {
                grid[r+i][c+j] = color;
                const cell = document.querySelector(`.cell[data-r='${r+i}'][data-c='${c+j}']`);
                cell.style.backgroundColor = color; cell.classList.add('filled');
            }
        }));
        
        // Base score multiplied by current combo streak (min 1)
        const multiplier = Math.max(1, comboStreak);
        updateScore(score + (10 * multiplier));
        showFeedback(multiplier > 1 ? `+${10*multiplier}` : "+10", "anim-score");
    }

    function checkLines() {
        let rows = [], cols = [];
        for(let r=0; r<gridSize; r++) if(grid[r].every(v => v!==null)) rows.push(r);
        for(let c=0; c<gridSize; c++) {
            let full = true; for(let r=0; r<gridSize; r++) if(grid[r][c]===null) full = false;
            if(full) cols.push(c);
        }
        
        const totalLines = rows.length + cols.length;

        if(totalLines > 0) {
            didClearThisTurn = true;
            comboStreak++;
            updateComboUI();
            sfx.play('clear');
            if(totalLines >= 2) triggerShake();

            let cells = new Set();
            rows.forEach(r => { for(let c=0; c<gridSize; c++) cells.add(`${r},${c}`); });
            cols.forEach(c => { for(let r=0; r<gridSize; r++) cells.add(`${r},${c}`); });
            
            // Score Calc: (Cells * 10) * (Line Bonus) * (Combo Streak)
            const lineBonus = totalLines > 1 ? totalLines : 1;
            const points = (cells.size * 10) * lineBonus * comboStreak;
            updateScore(score + points);
            
            const phrases = ["NICE!", "SWEET!", "AWESOME!"];
            const text = comboStreak > 2 ? `STREAK x${comboStreak}!` : (totalLines > 1 ? `COMBO x${totalLines}!` : phrases[Math.floor(Math.random()*phrases.length)]);
            showFeedback(text, "anim-blast");

            cells.forEach(k => {
                const [r, c] = k.split(',').map(Number); 
                const color = grid[r][c];
                grid[r][c] = null;
                const cell = document.querySelector(`.cell[data-r='${r}'][data-c='${c}']`);
                // Spawn particles before clearing
                spawnParticles(cell, color);
                cell.style.backgroundColor = ''; cell.classList.remove('filled');
            });
        }
    }

    // --- Juice Functions (Particles & Shake) ---
    function spawnParticles(cellEl, color) {
        const rect = cellEl.getBoundingClientRect();
        const containerRect = gridWrapper.getBoundingClientRect();
        // Calculate center of cell relative to container
        const x = rect.left - containerRect.left + rect.width / 2;
        const y = rect.top - containerRect.top + rect.height / 2;

        for (let i = 0; i < 6; i++) {
            const p = document.createElement('div');
            p.classList.add('particle');
            p.style.backgroundColor = color;
            p.style.left = `${x}px`; p.style.top = `${y}px`;
            particleLayer.appendChild(p);

            // Randomize movement
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 40 + 20;
            const tx = Math.cos(angle) * velocity;
            const ty = Math.sin(angle) * velocity;
            const rot = Math.random() * 360;

            p.animate([
                { transform: `translate(-50%, -50%) rotate(0deg) scale(1)`, opacity: 1 },
                { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) rotate(${rot}deg) scale(0)`, opacity: 0 }
            ], { duration: 600, easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' })
            .onfinish = () => p.remove();
        }
    }

    function triggerShake() {
        gridEl.classList.add('shake-heavy');
        setTimeout(() => gridEl.classList.remove('shake-heavy'), 400);
    }

    function showFeedback(text, anim) {
        feedbackLayer.innerHTML = '';
        const el = document.createElement('div'); el.classList.add('float-text', anim); el.textContent = text;
        feedbackLayer.appendChild(el);
        setTimeout(() => el.remove(), 800);
    }

    function applyTheme() {
        const theme = themes[currentThemeIndex];
        document.body.setAttribute('data-theme', theme);
        gameThemeBtn.textContent = theme.toUpperCase();
    }

    function checkGameOver() {
        const shapesLeft = Array.from(blockContainer.children);
        let possible = shapesLeft.some(s => {
            const m = JSON.parse(s.dataset.matrix);
            for(let r=0; r<gridSize; r++) for(let c=0; c<gridSize; c++) if(canPlace(r, c, m)) return true;
            return false;
        });
        if(!possible) { 
            sfx.play('gameover');
            goTitle.textContent = score === highScore && score > 0 ? "NEW HIGH SCORE!" : "NO MOVES LEFT!";
            finalScoreEl.textContent = score; modal.classList.remove('hidden'); 
        }
    }

    // --- Event Listeners ---
    startBtn.addEventListener('click', startGame);
    backToMenuBtn.addEventListener('click', showMenu);
    exitToMenuBtn.addEventListener('click', showMenu);
    restartBtn.addEventListener('click', resetGame);
    muteBtns.forEach(btn => btn.addEventListener('click', toggleMute));
    [menuThemeBtn, gameThemeBtn].forEach(b => b.addEventListener('click', () => {
        currentThemeIndex = (currentThemeIndex + 1) % themes.length;
        applyTheme();
    }));

    init();
});
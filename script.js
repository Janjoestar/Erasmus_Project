document.addEventListener('DOMContentLoaded', () => {
    const gridEl = document.getElementById('grid');
    const blockContainer = document.getElementById('block-container');
    const scoreEl = document.getElementById('score');
    const highScoreEl = document.getElementById('high-score');
    const themeBtn = document.getElementById('theme-btn');
    const feedbackContainer = document.getElementById('feedback-container');
    const modal = document.getElementById('game-over-modal');
    const finalScoreEl = document.getElementById('final-score');
    const restartBtn = document.getElementById('restart-btn');

    const gridSize = 8;
    let grid = []; 
    let score = 0;
    let highScore = localStorage.getItem('bb_highscore') || 0;

    // --- Theme System ---
    const themes = ['classic', 'dark', 'pastel', 'retro'];
    let currentThemeIndex = 0;

    function applyTheme() {
        const theme = themes[currentThemeIndex];
        document.body.setAttribute('data-theme', theme);
        themeBtn.textContent = `THEME: ${theme.toUpperCase()}`;
    }

    themeBtn.addEventListener('click', () => {
        currentThemeIndex = (currentThemeIndex + 1) % themes.length;
        applyTheme();
    });

    // --- Game Logic ---
    const shapes = [
        [[1]], [[1,1]], [[1,1,1]], [[1,1,1,1]], 
        [[1],[1]], [[1],[1],[1]], 
        [[1,1],[1,1]], 
        [[1,1,1],[0,1,0]], 
        [[1,0],[1,0],[1,1]], 
        [[0,1],[0,1],[1,1]]
    ];

    // Using CSS variable references for consistency with themes
    const colors = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)'];

    function init() {
        highScoreEl.textContent = highScore;
        applyTheme(); // Set default theme
        createGrid();
        spawnShapes();
        score = 0;
        updateScore(0);
        modal.classList.add('hidden');
    }

    function createGrid() {
        gridEl.innerHTML = '';
        grid = Array(gridSize).fill().map(() => Array(gridSize).fill(null));
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = r;
                cell.dataset.col = c;
                gridEl.appendChild(cell);
            }
        }
    }

    function spawnShapes() {
        blockContainer.innerHTML = '';
        for (let i = 0; i < 3; i++) createDraggableShape();
    }

    function createDraggableShape() {
        const shapeMatrix = shapes[Math.floor(Math.random() * shapes.length)];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        const wrapper = document.createElement('div');
        wrapper.classList.add('draggable-shape');
        wrapper.style.gridTemplateRows = `repeat(${shapeMatrix.length}, 1fr)`;
        wrapper.style.gridTemplateColumns = `repeat(${shapeMatrix[0].length}, 1fr)`;
        
        shapeMatrix.forEach(row => {
            row.forEach(val => {
                const block = document.createElement('div');
                if (val === 1) {
                    block.classList.add('shape-cell');
                    block.style.backgroundColor = color;
                }
                wrapper.appendChild(block);
            });
        });

        wrapper.dataset.matrix = JSON.stringify(shapeMatrix);
        wrapper.dataset.color = color;
        addDragLogic(wrapper);
        blockContainer.appendChild(wrapper);
    }

    function addDragLogic(element) {
        let isDragging = false, startX, startY, clone;
        const startDrag = (e) => {
            isDragging = true;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const rect = element.getBoundingClientRect();
            startX = clientX - rect.left;
            startY = clientY - rect.top;

            clone = element.cloneNode(true);
            clone.classList.add('dragging');
            clone.style.width = element.offsetWidth + 'px';
            clone.style.transform = 'scale(1.5)';
            clone.style.left = rect.left + 'px';
            clone.style.top = rect.top + 'px';
            document.body.appendChild(clone);
            element.style.opacity = '0';
        };

        const moveDrag = (e) => {
            if (!isDragging || !clone) return;
            e.preventDefault();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            clone.style.left = `${clientX - startX}px`;
            clone.style.top = `${clientY - startY}px`;
            
            // Get raw coordinates
            highlightHover(clientX, clientY, JSON.parse(element.dataset.matrix));
        };

        const endDrag = (e) => {
            if (!isDragging) return;
            isDragging = false;
            const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
            const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
            
            const matrix = JSON.parse(element.dataset.matrix);
            if (tryPlaceBlock(clientX, clientY, matrix, element.dataset.color)) {
                element.remove();
                clone.remove();
                checkLines();
                if (blockContainer.children.length === 0) spawnShapes();
                checkGameOver();
            } else {
                clone.remove();
                element.style.opacity = '1';
            }
            clearHighlights();
        };

        element.addEventListener('mousedown', startDrag);
        window.addEventListener('mousemove', moveDrag);
        window.addEventListener('mouseup', endDrag);
        element.addEventListener('touchstart', startDrag, {passive: false});
        window.addEventListener('touchmove', moveDrag, {passive: false});
        window.addEventListener('touchend', endDrag);
    }

    function getGridCoordinates(x, y) {
        const gridRect = gridEl.getBoundingClientRect();
        const cellWidth = gridEl.firstElementChild.getBoundingClientRect().width;
        // Adjust for gap
        const totalCellSize = cellWidth + 4; 
        
        // Offset to center the drop under finger/mouse
        const col = Math.floor((x - gridRect.left - (cellWidth/2)) / totalCellSize);
        const row = Math.floor((y - gridRect.top - (cellWidth/2)) / totalCellSize);
        return {r: row, c: col};
    }

    function tryPlaceBlock(x, y, matrix, color) {
        const {r, c} = getGridCoordinates(x, y);
        if (canPlace(r, c, matrix)) {
            place(r, c, matrix, color);
            return true;
        }
        return false;
    }

    function canPlace(r, c, matrix) {
        for (let i = 0; i < matrix.length; i++) {
            for (let j = 0; j < matrix[0].length; j++) {
                if (matrix[i][j] === 1) {
                    let tr = r + i, tc = c + j;
                    if (tr < 0 || tr >= gridSize || tc < 0 || tc >= gridSize || grid[tr][tc] !== null) return false;
                }
            }
        }
        return true;
    }

    function place(r, c, matrix, color) {
        for (let i = 0; i < matrix.length; i++) {
            for (let j = 0; j < matrix[0].length; j++) {
                if (matrix[i][j] === 1) {
                    grid[r + i][c + j] = color;
                    const cell = document.querySelector(`.cell[data-row='${r+i}'][data-col='${c+j}']`);
                    cell.style.backgroundColor = color;
                    cell.classList.add('filled');
                }
            }
        }
        updateScore(score + 10);
    }

    function highlightHover(x, y, matrix) {
        clearHighlights();
        const {r, c} = getGridCoordinates(x, y);
        if (canPlace(r, c, matrix)) {
            for (let i = 0; i < matrix.length; i++) {
                for (let j = 0; j < matrix[0].length; j++) {
                    if (matrix[i][j] === 1) {
                        const cell = document.querySelector(`.cell[data-row='${r+i}'][data-col='${c+j}']`);
                        if (cell) cell.classList.add('hovered');
                    }
                }
            }
        }
    }

    function clearHighlights() {
        document.querySelectorAll('.hovered').forEach(el => el.classList.remove('hovered'));
    }

    function checkLines() {
        let rows = [], cols = [];
        for (let r = 0; r < gridSize; r++) {
            if (grid[r].every(val => val !== null)) rows.push(r);
        }
        for (let c = 0; c < gridSize; c++) {
            let full = true;
            for (let r = 0; r < gridSize; r++) if (grid[r][c] === null) full = false;
            if (full) cols.push(c);
        }

        if (rows.length > 0 || cols.length > 0) {
            clearLines(rows, cols);
        }
    }

    function clearLines(rows, cols) {
        const uniqueCells = new Set();
        rows.forEach(r => { for(let c=0; c<gridSize; c++) uniqueCells.add(`${r},${c}`); });
        cols.forEach(c => { for(let r=0; r<gridSize; r++) uniqueCells.add(`${r},${c}`); });

        // Trigger Feedback Text
        const totalLines = rows.length + cols.length;
        triggerFeedback(totalLines);

        // Calculate Score
        const points = uniqueCells.size * 10 * (totalLines > 1 ? totalLines : 1);
        updateScore(score + points);

        // Visual Clear
        uniqueCells.forEach(key => {
            const [r, c] = key.split(',').map(Number);
            grid[r][c] = null;
            const cell = document.querySelector(`.cell[data-row='${r}'][data-col='${c}']`);
            cell.style.transform = 'scale(0)';
            setTimeout(() => {
                cell.style.backgroundColor = '';
                cell.classList.remove('filled');
                cell.style.transform = 'scale(1)';
            }, 200);
        });
    }

    function triggerFeedback(lineCount) {
        const messages = ["", "NICE!", "DOUBLE!", "TRIPLE!", "BLAST!", "INSANE!", "GODLIKE!"];
        const text = messages[Math.min(lineCount, messages.length - 1)];
        
        const el = document.createElement('div');
        el.classList.add('floating-text');
        el.textContent = text;
        feedbackContainer.appendChild(el);

        // Remove from DOM after animation
        setTimeout(() => el.remove(), 800);
    }

    function updateScore(val) {
        score = val;
        scoreEl.textContent = score;
        if (score > highScore) {
            highScore = score;
            highScoreEl.textContent = highScore;
            localStorage.setItem('bb_highscore', highScore);
        }
    }

    function checkGameOver() {
        setTimeout(() => {
            const shapes = Array.from(blockContainer.children);
            if (shapes.length === 0) return;

            let possible = false;
            // Check if ANY shape can fit ANYWHERE
            for (let shape of shapes) {
                const matrix = JSON.parse(shape.dataset.matrix);
                for (let r = 0; r < gridSize; r++) {
                    for (let c = 0; c < gridSize; c++) {
                        if (canPlace(r, c, matrix)) {
                            possible = true;
                            break;
                        }
                    }
                    if (possible) break;
                }
                if (possible) break;
            }

            if (!possible) {
                finalScoreEl.textContent = score;
                modal.classList.remove('hidden');
            }
        }, 300);
    }

    restartBtn.addEventListener('click', init);
    init();
});
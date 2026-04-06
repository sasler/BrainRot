const fs = require('fs');

const tetrisHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tetris</title>
    <style>
        body {
            background-color: #1a1a2e;
            color: #fff;
            font-family: 'Courier New', Courier, monospace;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            overflow: hidden;
        }
        #game-container {
            display: flex;
            gap: 20px;
        }
        canvas {
            background-color: #0f0f1a;
            border: 2px solid #4a4e69;
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.2);
        }
        #ui-panel {
            display: flex;
            flex-direction: column;
            gap: 20px;
            width: 150px;
        }
        .panel-box {
            background-color: #16213e;
            border: 2px solid #4a4e69;
            padding: 15px;
            text-align: center;
            border-radius: 8px;
        }
        .panel-box h3 {
            margin: 0 0 10px 0;
            color: #00ffff;
            font-size: 16px;
            text-transform: uppercase;
        }
        .panel-box span {
            font-size: 24px;
            font-weight: bold;
            color: #fff;
        }
        button {
            background-color: #e94560;
            color: white;
            border: none;
            padding: 12px 20px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            border-radius: 6px;
            text-transform: uppercase;
            letter-spacing: 1px;
            transition: all 0.2s;
            margin-top: 20px;
        }
        button:hover {
            background-color: #ff5e7e;
            transform: scale(1.05);
        }
        .hidden {
            display: none !important;
        }
        #overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(26, 26, 46, 0.85);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 10;
        }
        .title {
            font-size: 48px;
            color: #00ffff;
            text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
            margin-bottom: 30px;
            letter-spacing: 4px;
        }
    </style>
</head>
<body>
    <div id="overlay">
        <h1 class="title">TETRIS</h1>
        <h2 id="final-score" class="hidden">Score: <span>0</span></h2>
        <button id="start-btn">Start Game</button>
    </div>

    <div id="game-container">
        <canvas id="tetris-board" width="300" height="600"></canvas>
        <div id="ui-panel">
            <div class="panel-box">
                <h3>Score</h3>
                <span id="score">0</span>
            </div>
            <div class="panel-box">
                <h3>Level</h3>
                <span id="level">1</span>
            </div>
            <div class="panel-box">
                <h3>Lines</h3>
                <span id="lines">0</span>
            </div>
            <div class="panel-box" style="height: 100px;">
                <h3>Next</h3>
                <canvas id="next-piece" width="100" height="60" style="background:transparent; border:none; box-shadow:none;"></canvas>
            </div>
            <button id="pause-btn">Pause</button>
        </div>
    </div>

    <script>
        const canvas = document.getElementById('tetris-board');
        const ctx = canvas.getContext('2d');
        const nextCanvas = document.getElementById('next-piece');
        const nextCtx = nextCanvas.getContext('2d');
        
        const BLOCK_SIZE = 30;
        const COLS = 10;
        const ROWS = 20;
        
        const COLORS = [
            null,
            '#00FFFF', // I - Cyan
            '#0000FF', // J - Blue
            '#FFA500', // L - Orange
            '#FFFF00', // O - Yellow
            '#00FF00', // S - Green
            '#800080', // T - Purple
            '#FF0000'  // Z - Red
        ];
        
        const SHAPES = [
            [],
            [[0,0], [1,0], [-1,0], [2,0]], // I
            [[0,0], [-1,0], [0,-1], [-1,-1]], // O
            [[0,0], [1,0], [0,-1], [-1,0]], // T
            [[0,0], [-1,0], [1,0], [1,-1]], // L
            [[0,0], [1,0], [-1,0], [-1,-1]], // J
            [[0,0], [1,0], [0,-1], [-1,-1]], // Z
            [[0,0], [-1,0], [0,-1], [1,-1]]  // S
        ];

        let board = Array.from({length: ROWS}, () => Array(COLS).fill(0));
        let score = 0, level = 1, lines = 0;
        let isPlaying = false, isPaused = false;
        let currentPiece = null, nextPieceType = 0;
        let dropCounter = 0, dropInterval = 1000;
        let lastTime = 0;
        let animationId;

        class Piece {
            constructor(type) {
                this.type = type;
                this.shape = JSON.parse(JSON.stringify(SHAPES[type]));
                this.x = 4;
                this.y = 1;
            }

            draw(context, offsetX = 0, offsetY = 0, size = BLOCK_SIZE) {
                context.fillStyle = COLORS[this.type];
                context.strokeStyle = 'rgba(0,0,0,0.5)';
                this.shape.forEach(p => {
                    let px = (this.x + p[0]) * size + offsetX;
                    let py = (this.y + p[1]) * size + offsetY;
                    context.fillRect(px, py, size - 1, size - 1);
                    context.strokeRect(px, py, size - 1, size - 1);
                });
            }

            rotate() {
                if (this.type === 2) return; // Don't rotate O piece
                const rotDir = 1;
                const prev = JSON.parse(JSON.stringify(this.shape));
                this.shape.forEach(p => {
                    const x = p[0];
                    p[0] = -p[1] * rotDir;
                    p[1] = x * rotDir;
                });
                
                if (this.checkCollision()) {
                    this.shape = prev; // Revert if collision
                }
            }

            move(dx, dy) {
                this.x += dx;
                this.y += dy;
                if (this.checkCollision()) {
                    this.x -= dx;
                    this.y -= dy;
                    return false;
                }
                return true;
            }

            checkCollision() {
                for (let i = 0; i < this.shape.length; i++) {
                    const p = this.shape[i];
                    const nx = this.x + p[0];
                    const ny = this.y + p[1];
                    if (nx < 0 || nx >= COLS || ny >= ROWS || (ny >= 0 && board[ny][nx])) {
                        return true;
                    }
                }
                return false;
            }

            lock() {
                this.shape.forEach(p => {
                    const nx = this.x + p[0];
                    const ny = this.y + p[1];
                    if (ny >= 0) {
                        board[ny][nx] = this.type;
                    }
                });
            }
        }

        function initGame() {
            board = Array.from({length: ROWS}, () => Array(COLS).fill(0));
            score = 0; level = 1; lines = 0;
            updateUI();
            nextPieceType = Math.floor(Math.random() * 7) + 1;
            spawnPiece();
            isPlaying = true;
            isPaused = false;
            dropInterval = 1000;
            document.getElementById('overlay').classList.add('hidden');
            document.getElementById('pause-btn').innerText = 'Pause';
            lastTime = performance.now();
            if(animationId) cancelAnimationFrame(animationId);
            update();
        }

        function spawnPiece() {
            currentPiece = new Piece(nextPieceType);
            nextPieceType = Math.floor(Math.random() * 7) + 1;
            drawNextPiece();
            if (currentPiece.checkCollision()) {
                gameOver();
            }
        }

        function clearLines() {
            let linesCleared = 0;
            outer: for (let y = ROWS - 1; y >= 0; y--) {
                for (let x = 0; x < COLS; x++) {
                    if (board[y][x] === 0) continue outer;
                }
                const row = board.splice(y, 1)[0].fill(0);
                board.unshift(row);
                y++;
                linesCleared++;
            }
            if (linesCleared > 0) {
                lines += linesCleared;
                const lineScores = [0, 40, 100, 300, 1200];
                score += lineScores[linesCleared] * level;
                level = Math.floor(lines / 10) + 1;
                dropInterval = Math.max(100, 1000 - (level - 1) * 100);
                updateUI();
            }
        }

        function gameOver() {
            isPlaying = false;
            cancelAnimationFrame(animationId);
            const overlay = document.getElementById('overlay');
            const fs = document.getElementById('final-score');
            const btn = document.getElementById('start-btn');
            overlay.classList.remove('hidden');
            fs.classList.remove('hidden');
            fs.querySelector('span').innerText = score;
            btn.innerText = 'Play Again';
            document.querySelector('.title').innerText = 'GAME OVER';
        }

        function drawBoard() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw grid
            ctx.strokeStyle = '#222';
            for(let i=0; i<=COLS; i++) {
                ctx.beginPath(); ctx.moveTo(i*BLOCK_SIZE, 0); ctx.lineTo(i*BLOCK_SIZE, canvas.height); ctx.stroke();
            }
            for(let i=0; i<=ROWS; i++) {
                ctx.beginPath(); ctx.moveTo(0, i*BLOCK_SIZE); ctx.lineTo(canvas.width, i*BLOCK_SIZE); ctx.stroke();
            }

            // Draw placed blocks
            for (let y = 0; y < ROWS; y++) {
                for (let x = 0; x < COLS; x++) {
                    if (board[y][x]) {
                        ctx.fillStyle = COLORS[board[y][x]];
                        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
                        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
                        ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
                    }
                }
            }
            
            if (currentPiece) currentPiece.draw(ctx);
        }

        function drawNextPiece() {
            nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
            let dummy = new Piece(nextPieceType);
            dummy.x = 0; dummy.y = 0;
            // Center the piece in the small canvas
            let offX = 50; let offY = 30;
            if(nextPieceType === 1) offX -= 10;
            dummy.draw(nextCtx, offX, offY, 20);
        }

        function updateUI() {
            document.getElementById('score').innerText = score;
            document.getElementById('level').innerText = level;
            document.getElementById('lines').innerText = lines;
        }

        function update(time = 0) {
            if (!isPlaying || isPaused) return;
            
            const deltaTime = time - lastTime;
            lastTime = time;
            dropCounter += deltaTime;

            if (dropCounter > dropInterval) {
                if (!currentPiece.move(0, 1)) {
                    currentPiece.lock();
                    clearLines();
                    spawnPiece();
                }
                dropCounter = 0;
            }

            drawBoard();
            animationId = requestAnimationFrame(update);
        }

        document.addEventListener('keydown', event => {
            if (!isPlaying || isPaused) return;
            
            switch(event.keyCode) {
                case 37: // Left
                    currentPiece.move(-1, 0); break;
                case 39: // Right
                    currentPiece.move(1, 0); break;
                case 40: // Down
                    if(currentPiece.move(0, 1)) dropCounter = 0; 
                    break;
                case 38: // Up
                    currentPiece.rotate(); break;
                case 32: // Space (Hard drop)
                    while (currentPiece.move(0, 1)) {}
                    currentPiece.lock();
                    clearLines();
                    spawnPiece();
                    dropCounter = 0;
                    break;
            }
            if(isPlaying && !isPaused) drawBoard(); // Immediate visual feedback
        });

        document.getElementById('start-btn').addEventListener('click', initGame);
        document.getElementById('pause-btn').addEventListener('click', () => {
            if (!isPlaying) return;
            isPaused = !isPaused;
            document.getElementById('pause-btn').innerText = isPaused ? 'Resume' : 'Pause';
            if (!isPaused) {
                lastTime = performance.now();
                update();
            }
        });

        drawBoard(); // Initial blank draw
    </script>
</body>
</html>`;

const msHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Minesweeper</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #121212; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; user-select: none; }
        .header { text-align: center; margin-bottom: 20px; }
        h1 { margin: 0 0 10px 0; color: #4CAF50; letter-spacing: 2px; }
        .controls { display: flex; gap: 20px; margin-bottom: 20px; background: #1e1e1e; padding: 10px 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
        .stat { font-size: 18px; font-weight: bold; color: #ff5252; min-width: 60px; text-align: center; }
        select, button { padding: 8px 12px; background: #333; color: white; border: 1px solid #555; border-radius: 4px; cursor: pointer; }
        button:hover { background: #4CAF50; }
        #board-container { background: #bbb; padding: 10px; border-radius: 4px; display: inline-block; box-shadow: inset 2px 2px 5px rgba(255,255,255,0.2), inset -2px -2px 5px rgba(0,0,0,0.5); }
        .row { display: flex; }
        .cell { width: 30px; height: 30px; background-color: #ccc; border-top: 2px solid #fff; border-left: 2px solid #fff; border-bottom: 2px solid #888; border-right: 2px solid #888; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; cursor: pointer; box-sizing: border-box; }
        .cell.revealed { background-color: #eee; border: 1px solid #999; border-top: 1px solid #555; border-left: 1px solid #555; cursor: default; }
        .cell.mine { background-color: #ff5252; }
        .c1 { color: blue; } .c2 { color: green; } .c3 { color: red; } .c4 { color: darkblue; } .c5 { color: darkred; } .c6 { color: darkcyan; } .c7 { color: black; } .c8 { color: gray; }
        #message { margin-top: 20px; font-size: 24px; font-weight: bold; height: 30px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>MINESWEEPER</h1>
        <div class="controls">
            <select id="difficulty">
                <option value="easy">Easy (9x9, 10)</option>
                <option value="medium">Medium (16x16, 40)</option>
                <option value="hard">Hard (30x16, 99)</option>
            </select>
            <div title="Mines Remaining" class="stat">💣 <span id="mines-count">10</span></div>
            <button id="reset-btn">😄 Reset</button>
            <div title="Time" class="stat">⏱️ <span id="timer">0</span></div>
        </div>
    </div>
    
    <div id="board-container"><div id="board"></div></div>
    <div id="message"></div>

    <script>
        const config = { easy: {r:9, c:9, m:10}, medium: {r:16, c:16, m:40}, hard: {r:16, c:30, m:99} };
        let rows, cols, totalMines;
        let board = [], minesLeft = 0, revealedCount = 0;
        let isGameOver = false, isFirstClick = true;
        let timerInterval = null, timeElapsed = 0;

        const bEl = document.getElementById('board');
        const mEl = document.getElementById('mines-count');
        const tEl = document.getElementById('timer');
        const msgEl = document.getElementById('message');
        const rBtn = document.getElementById('reset-btn');

        function init() {
            clearInterval(timerInterval);
            const diff = document.getElementById('difficulty').value;
            ({r: rows, c: cols, m: totalMines} = config[diff]);
            minesLeft = totalMines;
            revealedCount = 0;
            isGameOver = false;
            isFirstClick = true;
            timeElapsed = 0;
            board = [];
            
            mEl.textContent = minesLeft;
            tEl.textContent = '0';
            msgEl.textContent = '';
            rBtn.textContent = '😄 Rest';
            bEl.innerHTML = '';

            for(let r=0; r<rows; r++) {
                const row = [];
                const rDiv = document.createElement('div');
                rDiv.className = 'row';
                for(let c=0; c<cols; c++) {
                    const cell = { r, c, isMine: false, isRevealed: false, isFlagged: false, neighborMines: 0, el: document.createElement('div') };
                    cell.el.className = 'cell';
                    cell.el.onmousedown = (e) => handleMouse(e, cell);
                    cell.el.oncontextmenu = e => e.preventDefault();
                    rDiv.appendChild(cell.el);
                    row.push(cell);
                }
                board.push(row);
                bEl.appendChild(rDiv);
            }
        }

        function placeMines(skipCell) {
            let placed = 0;
            while(placed < totalMines) {
                let r = Math.floor(Math.random()*rows), c = Math.floor(Math.random()*cols);
                if(!board[r][c].isMine && !(r===skipCell.r && c===skipCell.c)) {
                    board[r][c].isMine = true;
                    placed++;
                }
            }
            calcNeighbors();
        }

        function calcNeighbors() {
            for(let r=0; r<rows; r++) {
                for(let c=0; c<cols; c++) {
                    if(board[r][c].isMine) continue;
                    let count = 0;
                    for(let i=-1; i<=1; i++) {
                        for(let j=-1; j<=1; j++) {
                            if(r+i>=0 && r+i<rows && c+j>=0 && c+j<cols && board[r+i][c+j].isMine) count++;
                        }
                    }
                    board[r][c].neighborMines = count;
                }
            }
        }

        function handleMouse(e, cell) {
            if(isGameOver) return;
            if(e.button === 0) reveal(cell); // Left click
            else if(e.button === 2) toggleFlag(cell); // Right click
        }

        function reveal(cell) {
            if(cell.isRevealed || cell.isFlagged) return;
            if(isFirstClick) { isFirstClick=false; placeMines(cell); timerInterval = setInterval(()=>tEl.textContent = ++timeElapsed, 1000); }
            
            cell.isRevealed = true;
            cell.el.classList.add('revealed');
            revealedCount++;

            if(cell.isMine) {
                cell.el.classList.add('mine');
                cell.el.textContent = '💣';
                gameOver(false);
            } else {
                if(cell.neighborMines > 0) {
                    cell.el.textContent = cell.neighborMines;
                    cell.el.classList.add('c'+cell.neighborMines);
                } else {
                    // Flood fill
                    for(let i=-1; i<=1; i++) {
                        for(let j=-1; j<=1; j++) {
                            if(cell.r+i>=0 && cell.r+i<rows && cell.c+j>=0 && cell.c+j<cols) {
                                reveal(board[cell.r+i][cell.c+j]);
                            }
                        }
                    }
                }
                checkWin();
            }
        }

        function toggleFlag(cell) {
            if(cell.isRevealed) return;
            cell.isFlagged = !cell.isFlagged;
            cell.el.textContent = cell.isFlagged ? '🚩' : '';
            minesLeft += cell.isFlagged ? -1 : 1;
            mEl.textContent = minesLeft;
        }

        function gameOver(win) {
            isGameOver = true;
            clearInterval(timerInterval);
            rBtn.textContent = win ? '😎' : '😵';
            msgEl.textContent = win ? 'You Win!' : 'Game Over!';
            msgEl.style.color = win ? '#4CAF50' : '#ff5252';
            
            // Reveal all mines
            board.flat().forEach(c => {
                if(c.isMine && !c.isFlagged) { c.el.classList.add('revealed'); c.el.textContent = '💣'; }
                if(!c.isMine && c.isFlagged) { c.el.textContent = '❌'; }
            });
        }

        function checkWin() {
            if(revealedCount === rows * cols - totalMines) gameOver(true);
        }

        document.getElementById('difficulty').addEventListener('change', init);
        rBtn.addEventListener('click', init);

        init();
    </script>
</body>
</html>`;

const reversiHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reversi / Othello</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #2c3e50;
            color: #ecf0f1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
        }
        h1 { color: #f1c40f; margin-bottom: 5px; }
        .status-container {
            display: flex;
            justify-content: space-between;
            width: 400px;
            margin-bottom: 20px;
            background: #34495e;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        }
        .player-score {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 20px;
            font-weight: bold;
        }
        .turn-indicator {
            font-size: 18px;
            text-align: center;
            padding: 5px 15px;
            border-radius: 20px;
            background: rgba(255,255,255,0.1);
        }
        .disc-icon {
            width: 30px; height: 30px; border-radius: 50%;
            box-shadow: inset -3px -3px 6px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.2);
        }
        .black .disc-icon { background: linear-gradient(135deg, #444, #000); }
        .white .disc-icon { background: linear-gradient(135deg, #fff, #ddd); }
        
        #board {
            display: grid;
            grid-template-columns: repeat(8, 50px);
            grid-template-rows: repeat(8, 50px);
            gap: 2px;
            background-color: #1a252f;
            padding: 10px;
            border-radius: 8px;
            box-shadow: 0 10px 20px rgba(0,0,0,0.5);
        }
        .cell {
            background-color: #27ae60;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        .cell:hover { background-color: #2ecc71; }
        .cell.valid-move { position: relative; }
        .cell.valid-move::after {
            content: '';
            width: 12px; height: 12px;
            background-color: rgba(26, 37, 47, 0.4);
            border-radius: 50%;
            position: absolute;
        }
        .disc {
            width: 40px; height: 40px;
            border-radius: 50%;
            box-shadow: inset -4px -4px 8px rgba(0,0,0,0.5), 0 4px 6px rgba(0,0,0,0.4);
            transition: transform 0.4s, background-color 0.4s;
        }
        .disc.B { background: linear-gradient(135deg, #444, #111); }
        .disc.W { background: linear-gradient(135deg, #fff, #bbb); }
        
        button {
            margin-top: 30px;
            padding: 10px 20px;
            background-color: #e74c3c;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            text-transform: uppercase;
            font-weight: bold;
            letter-spacing: 1px;
            transition: background 0.2s;
        }
        button:hover { background-color: #c0392b; }
        #message { margin-top: 15px; font-size: 24px; font-weight: bold; height: 30px; text-shadow: 0 2px 4px rgba(0,0,0,0.3); }
    </style>
</head>
<body>
    <h1>REVERSI</h1>
    <div class="status-container">
        <div class="player-score black"><div class="disc-icon"></div> <span id="score-b">2</span></div>
        <div class="turn-indicator" id="turn-display">Black's Turn</div>
        <div class="player-score white"><div class="disc-icon"></div> <span id="score-w">2</span></div>
    </div>

    <div id="board"></div>
    <div id="message"></div>
    <button onclick="initGame()">Restart Game</button>

    <script>
        const boardEl = document.getElementById('board');
        const scoreB = document.getElementById('score-b');
        const scoreW = document.getElementById('score-w');
        const turnDisp = document.getElementById('turn-display');
        const msgEl = document.getElementById('message');
        
        let board = [], curP = 'B', gameOver = false;
        const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

        function initGame() {
            board = Array(8).fill(null).map(()=>Array(8).fill(null));
            board[3][3] = 'W'; board[3][4] = 'B'; board[4][3] = 'B'; board[4][4] = 'W';
            curP = 'B'; gameOver = false; msgEl.textContent = '';
            update();
        }

        function update() {
            boardEl.innerHTML = '';
            let valids = getValidMoves(curP);
            
            if(valids.length === 0) {
                curP = curP==='B'?'W':'B';
                valids = getValidMoves(curP);
                if(valids.length === 0) { endGame(); return; }
                else {
                    msgEl.textContent = \`No moves for \${curP==='W'?'Black':'White'}, turn passed.\`;
                    setTimeout(()=>msgEl.textContent='', 2000);
                }
            }

            let sb=0, sw=0;
            for(let r=0; r<8; r++) {
                for(let c=0; c<8; c++) {
                    if(board[r][c]==='B') sb++; if(board[r][c]==='W') sw++;
                    
                    const cell = document.createElement('div');
                    cell.className = 'cell';
                    if(board[r][c]) {
                        const d = document.createElement('div');
                        d.className = 'disc ' + board[r][c];
                        cell.appendChild(d);
                    } else if(!gameOver && valids.some(v=>v.r===r && v.c===c)) {
                        cell.classList.add('valid-move');
                        cell.onclick = () => makeMove(r, c);
                    }
                    boardEl.appendChild(cell);
                }
            }
            scoreB.textContent = sb; scoreW.textContent = sw;
            turnDisp.textContent = \`\${curP==='B'?'Black':'White'}'s Turn\`;
            turnDisp.style.color = curP==='B' ? '#f1c40f' : '#ecf0f1';
        }

        function getValidMoves(player) {
            let moves = [];
            for(let r=0; r<8; r++) for(let c=0; c<8; c++) if(canPlay(r,c,player).length>0) moves.push({r,c});
            return moves;
        }

        function canPlay(r, c, player) {
            if(board[r][c]) return [];
            let flips = [];
            const opp = player==='B'?'W':'B';
            for(let [dr, dc] of dirs) {
                let tr=r+dr, tc=c+dc, line=[];
                while(tr>=0 && tr<8 && tc>=0 && tc<8 && board[tr][tc]===opp) {
                    line.push({r:tr, c:tc});
                    tr+=dr; tc+=dc;
                }
                if(tr>=0 && tr<8 && tc>=0 && tc<8 && board[tr][tc]===player && line.length>0) {
                    flips.push(...line);
                }
            }
            return flips;
        }

        function makeMove(r, c) {
            if(gameOver) return;
            const flips = canPlay(r, c, curP);
            if(flips.length===0) return;
            
            board[r][c] = curP;
            flips.forEach(f => board[f.r][f.c] = curP);
            curP = curP==='B'?'W':'B';
            update();
        }

        function endGame() {
            gameOver = true;
            let sb = 0, sw = 0;
            board.flat().forEach(c => { if(c==='B') sb++; else if(c==='W') sw++; });
            if(sb>sw) msgEl.textContent = 'Black Wins!';
            else if(sw>sb) msgEl.textContent = 'White Wins!';
            else msgEl.textContent = 'It\\'s a Tie!';
            boardEl.innerHTML = '';
            for(let r=0; r<8; r++) {
                for(let c=0; c<8; c++) {
                    const cell = document.createElement('div');
                    cell.className = 'cell';
                    if(board[r][c]) {
                        const d = document.createElement('div');
                        d.className = 'disc ' + board[r][c];
                        cell.appendChild(d);
                    }
                    boardEl.appendChild(cell);
                }
            }
        }

        initGame();
    </script>
</body>
</html>`;

fs.writeFileSync('public/games/tetris/gemini-3-1-pro/index.html', tetrisHtml);
console.log('tetris created');
fs.writeFileSync('public/games/minesweeper/gemini-3-1-pro/index.html', msHtml);
console.log('minesweeper created');
fs.writeFileSync('public/games/reversi/gemini-3-1-pro/index.html', reversiHtml);
console.log('reversi created');

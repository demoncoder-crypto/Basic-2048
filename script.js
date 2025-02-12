let board = [];
let score = 0;

function initGame() {
    board = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ];
    score = 0;
    document.getElementById('score').innerText = score;
    generateTile();
    generateTile();
    updateBoard();
}

function generateTile() {
    let emptyTiles = [];
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (board[i][j] === 0) {
                emptyTiles.push({x: i, y: j});
            }
        }
    }
    if (emptyTiles.length > 0) {
        let {x, y} = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
        board[x][y] = Math.random() < 0.9 ? 2 : 4;
    }
}

function updateBoard() {
    const gridContainer = document.querySelector('.grid-container');
    gridContainer.innerHTML = '';
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            const tile = document.createElement('div');
            tile.classList.add('tile');
            tile.innerText = board[i][j] !== 0 ? board[i][j] : '';
            gridContainer.appendChild(tile);
        }
    }
}

function moveLeft() {
    let moved = false;
    for (let i = 0; i < 4; i++) {
        let row = board[i].filter(x => x !== 0);
        for (let j = 0; j < row.length - 1; j++) {
            if (row[j] === row[j + 1]) {
                row[j] *= 2;
                score += row[j];
                row.splice(j + 1, 1);
                moved = true;
            }
        }
        while (row.length < 4) row.push(0);
        if (board[i].join(',') !== row.join(',')) moved = true;
        board[i] = row;
    }
    return moved;
}

function move(direction) {
    let moved = false;
    const originalBoard = JSON.stringify(board);
    
    switch(direction) {
        case 'ArrowLeft':
            moved = moveLeft();
            break;
        case 'ArrowRight':
            board.forEach(row => row.reverse());
            moved = moveLeft();
            board.forEach(row => row.reverse());
            break;
        case 'ArrowUp':
            board = board[0].map((_, i) => board.map(row => row[i]));
            moved = moveLeft();
            board = board[0].map((_, i) => board.map(row => row[i]));
            break;
        case 'ArrowDown':
            board = board[0].map((_, i) => board.map(row => row[i]));
            board.forEach(row => row.reverse());
            moved = moveLeft();
            board.forEach(row => row.reverse());
            board = board[0].map((_, i) => board.map(row => row[i]));
            break;
    }
    
    if (JSON.stringify(board) !== originalBoard) {
        generateTile();
        updateBoard();
        document.getElementById('score').innerText = score;
    }
}

document.getElementById('restart').addEventListener('click', initGame);

document.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        move(e.key);
    }
});

initGame();

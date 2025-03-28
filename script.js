let board = [];
let score = 0;
let gameWon = false; // Added win state
const gridSize = 4;
const cellGap = 10; // Match CSS grid-gap
const cellSize = 100; // Match CSS width/height

// Keep track of the tile elements currently on the board
let currentTileElements = {};

function initGame() {
    const gridContainer = document.querySelector('.grid-container');
    gridContainer.innerHTML = ''; // Clear everything

    // Hide message overlay
    const messageOverlay = document.getElementById('message-overlay');
    messageOverlay.classList.add('hidden');

    // Create background cells
    for (let i = 0; i < gridSize * gridSize; i++) {
        const cell = document.createElement('div');
        cell.classList.add('grid-cell');
        gridContainer.appendChild(cell);
    }

    board = Array(gridSize).fill(null).map(() => Array(gridSize).fill(0));
    score = 0;
    gameWon = false; // Reset win state
    currentTileElements = {}; // Reset tile elements tracker
    document.getElementById('score').innerText = score;
    generateTile();
    generateTile();
    renderBoard(); // Initial render
}

function generateTile() {
    let emptyTiles = [];
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            if (board[i][j] === 0) {
                emptyTiles.push({x: i, y: j});
            }
        }
    }
    if (emptyTiles.length > 0) {
        let {x, y} = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
        board[x][y] = Math.random() < 0.9 ? 2 : 4;
        return {x, y}; // Return coordinates of the new tile
    }
    return null; // Return null if no tile could be generated
}

// Function to check if any moves are possible
function canMove() {
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            // Check for empty cell
            if (board[i][j] === 0) {
                return true;
            }
            // Check for horizontal merge possibility
            if (j < gridSize - 1 && board[i][j] === board[i][j + 1]) {
                return true;
            }
            // Check for vertical merge possibility
            if (i < gridSize - 1 && board[i][j] === board[i + 1][j]) {
                return true;
            }
        }
    }
    return false; // No empty cells and no possible merges
}

// Function to display the game over/win message
function showMessage(message) {
    const messageOverlay = document.getElementById('message-overlay');
    const messageText = document.getElementById('message-text');
    messageText.innerText = message;
    messageOverlay.classList.remove('hidden');
}

// Refactored renderBoard to handle animations better
function renderBoard(newTileCoords = null, mergedTilesInfo = []) {
    const gridContainer = document.querySelector('.grid-container');
    const nextTileElements = {}; // Store elements for the next state

    // Create or update tiles
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const value = board[i][j];
            const tileId = `tile-${i}-${j}`; // Unique ID for tracking

            if (value !== 0) {
                const top = i * (cellSize + cellGap) + cellGap;
                const left = j * (cellSize + cellGap) + cellGap;

                let tile;
                // Check if tile already exists from previous state
                if (currentTileElements[tileId]) {
                    tile = currentTileElements[tileId];
                    // Update existing tile
                    tile.dataset.value = value;
                    tile.innerText = value;
                    tile.style.transform = `translate(${left}px, ${top}px)`;

                    // Remove transient animation classes
                    tile.classList.remove('tile-new', 'tile-merged');

                } else {
                    // Create new tile element if it wasn't there
                    tile = document.createElement('div');
                    tile.classList.add('tile');
                    tile.id = tileId;
                    tile.dataset.value = value;
                    tile.innerText = value;
                    tile.style.transform = `translate(${left}px, ${top}px)`;
                    gridContainer.appendChild(tile);
                }

                 // Apply new tile animation if coordinates match
                 if (newTileCoords && newTileCoords.x === i && newTileCoords.y === j) {
                    // Apply appear animation AFTER position is set and element is in DOM
                     requestAnimationFrame(() => {
                         if(tile) tile.classList.add('tile-new');
                     });
                }

                // Apply merged tile animation
                if (mergedTilesInfo.some(info => info.x === i && info.y === j)) {
                     requestAnimationFrame(() => {
                         if(tile) tile.classList.add('tile-merged');
                     });
                }

                nextTileElements[tileId] = tile; // Keep track of this tile for the next render
            }
        }
    }

    // Remove tiles that are no longer on the board
    for (const tileId in currentTileElements) {
        if (!nextTileElements[tileId]) {
            // Add a fade-out or shrink animation before removing?
            currentTileElements[tileId].remove();
        }
    }

    // Update the current state tracker
    currentTileElements = nextTileElements;
}

// Modified moveLeft to return merge info
function moveLeft() {
    let moved = false;
    let mergedTiles = []; // Track merges {x, y} in the compacted row's coordinate system
    for (let i = 0; i < gridSize; i++) {
        let currentRow = board[i].join(','); // For comparison later
        let row = board[i].filter(val => val !== 0);

        for (let j = 0; j < row.length - 1; j++) {
            if (row[j] === row[j + 1]) {
                row[j] *= 2;
                score += row[j];
                if (row[j] === 2048) gameWon = true;
                row.splice(j + 1, 1);
                // Record merge: position `j` in the compacted row
                mergedTiles.push({ x: i, y: j });
                // moved = true; // A merge counts as a move
            }
        }

        // Pad with zeros
        while (row.length < gridSize) row.push(0);
        board[i] = row;

        // Check if the row actually changed content or order
        if (currentRow !== board[i].join(',')) {
            moved = true;
        }
    }
    return { moved, mergedTiles };
}

function move(direction) {
    if (gameWon) return; // Prevent moves if game already won

    let moved = false;
    let mergedTilesInfo = []; // To store final grid coordinates {x, y} of merged tiles
    const originalBoard = JSON.stringify(board);

    // --- Apply transformations and call moveLeft --- 
    let result;
    switch(direction) {
        case 'ArrowLeft':
            result = moveLeft();
            moved = result.moved;
            // Direct coordinates from moveLeft are correct for left move
            mergedTilesInfo = result.mergedTiles.map(m => ({ x: m.x, y: m.y }));
            break;
        case 'ArrowRight':
            board.forEach(row => row.reverse());
            result = moveLeft();
            moved = result.moved;
            board.forEach(row => row.reverse());
            // Transform merged column index `m.y` back from reversed row
            mergedTilesInfo = result.mergedTiles.map(m => ({ x: m.x, y: gridSize - 1 - m.y }));
            break;
        case 'ArrowUp':
            board = board[0].map((_, colIndex) => board.map(row => row[colIndex])); // Transpose
            result = moveLeft();
            moved = result.moved;
            // Merged coordinates were { row: m.x, col: m.y } in transposed grid's compacted row
            // Transform back: Original grid coords are { row: m.y, col: m.x }
            mergedTilesInfo = result.mergedTiles.map(m => ({ x: m.y, y: m.x }));
            board = board[0].map((_, colIndex) => board.map(row => row[colIndex])); // Transpose back
            break;
        case 'ArrowDown':
            board = board[0].map((_, colIndex) => board.map(row => row[colIndex])); // Transpose
            board.forEach(row => row.reverse());
            result = moveLeft();
            moved = result.moved;
            board.forEach(row => row.reverse());
            board = board[0].map((_, colIndex) => board.map(row => row[colIndex])); // Transpose back
            // Merged coordinates were { row: m.x, col: m.y } in transposed+reversed grid's compacted row
            // Transform back: Original grid coords are { row: gridSize - 1 - m.y, col: m.x }
            mergedTilesInfo = result.mergedTiles.map(m => ({ x: gridSize - 1 - m.y, y: m.x }));
            break;
    }
    // --- End transformations ---

    // Check for win immediately after move logic
    if (gameWon) {
        renderBoard(null, mergedTilesInfo); // Render final state including merges
        document.getElementById('score').innerText = score;
        setTimeout(() => showMessage("You Win!"), 500); 
        return;
    }

    // Check if the board actually changed
    // moved flag from moveLeft handles shifts/merges. We need JSON compare for rotations/transpositions that might result in same state.
    const boardChanged = moved || (JSON.stringify(board) !== originalBoard);

    if (boardChanged) {
        const newTileCoords = generateTile();
        renderBoard(newTileCoords, mergedTilesInfo); // Pass merge info and new tile info
        document.getElementById('score').innerText = score;

        // Check for game over only if a move potentially filled the board
        if (!canMove()) {
            setTimeout(() => showMessage("Game Over!"), 500);
        }
    } else {
        // If board didn't change overall but merges happened, still render merge animation
        // This case shouldn't really happen with the current moved logic, but good practice
         if (mergedTilesInfo.length > 0) {
             renderBoard(null, mergedTilesInfo);
        }
    }
}

document.getElementById('restart').addEventListener('click', initGame);

document.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        if (!gameWon) { // Only allow moves if game is not won
            move(e.key);
        }
    }
});

initGame();

// Game state
let gameState = {
    players: [],
    currentPlayer: 0,
    board: [],
    currentHexagon: null,
    difficulty: 'easy',
    gameOver: false
};

// DOM elements
const welcomeScreen = document.getElementById('welcome-screen');
const gameScreen = document.getElementById('game-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const gameBoard = document.getElementById('game-board');
const currentHexagonDisplay = document.getElementById('current-hexagon');
const player1NameInput = document.getElementById('player1-name');
const player2NameInput = document.getElementById('player2-name');
const opponentType = document.getElementById('opponent-type');
const difficultySelect = document.getElementById('difficulty');
const startGameButton = document.getElementById('start-game');
const newGameButton = document.getElementById('new-game');
const restartGameButton = document.getElementById('restart-game');


// Event listeners
startGameButton.addEventListener('click', startGame);
newGameButton.addEventListener('click', resetGame);
restartGameButton.addEventListener('click', resetGame);
player1NameInput.addEventListener('input', validatePlayerSetup);
player2NameInput.addEventListener('input', validatePlayerSetup);
opponentType.addEventListener('change', togglePlayer2Input);
difficultySelect.addEventListener('change', validatePlayerSetup);
// Call this function when the page loads
window.addEventListener('load', showGameInstructions);

function validatePlayerSetup() {
    const player1Name = player1NameInput.value.trim();
    const player2Name = player2NameInput.value.trim();
    const difficulty = difficultySelect.value;
    const isBot = opponentType.value === 'bot';

    startGameButton.disabled = !(player1Name && (isBot || player2Name) && difficulty);
}

function togglePlayer2Input() {
    player2NameInput.style.display = opponentType.value === 'bot' ? 'none' : 'block';
    validatePlayerSetup();
}

function startGame() {
    const player1Name = player1NameInput.value.trim();
    const player2Name = opponentType.value === 'bot' ? 'Bot' : player2NameInput.value.trim();
    gameState.difficulty = difficultySelect.value;
    gameState.players = [
        { name: player1Name, score: 0, color: 'red' },
        { name: player2Name, score: 0, color: 'blue' }
    ];
    gameState.currentPlayer = 0;
    gameState.gameOver = false;

    initializeBoard();
    updateScoreDisplay();
    generateCurrentHexagon();
    addHoverEffects();

    welcomeScreen.style.display = 'none';
    gameScreen.style.display = 'block';
}

function initializeBoard() {
    gameState.board = [];
    gameBoard.innerHTML = '';
    
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 10; j++) {
            const hexagon = document.createElement('div');
            hexagon.classList.add('hexagon');
            hexagon.dataset.row = i;
            hexagon.dataset.col = j;
            hexagon.addEventListener('click', () => placeHexagon(i, j));
            gameBoard.appendChild(hexagon);

            gameState.board.push({
                element: hexagon,
                value: null,
                color: null,
                disabled: false
            });
        }
    }

    // Disable random hexagons based on difficulty
    const disabledCount = { easy: 4, medium: 6, hard: 8 }[gameState.difficulty];
    for (let i = 0; i < disabledCount; i++) {
        const randomIndex = Math.floor(Math.random() * gameState.board.length);
        if (!gameState.board[randomIndex].disabled) {
            gameState.board[randomIndex].disabled = true;
            gameState.board[randomIndex].element.classList.add('disabled');
        } else {
            i--;
        }
    }
}

function generateCurrentHexagon() {
    gameState.currentHexagon = {
        value: Math.floor(Math.random() * 20) + 1,
        color: gameState.players[gameState.currentPlayer].color
    };
    currentHexagonDisplay.textContent = gameState.currentHexagon.value;
    currentHexagonDisplay.style.backgroundColor = gameState.currentHexagon.color;
}

function placeHexagon(row, col) {
    const index = row * 10 + col;
    const hexagon = gameState.board[index];

    if (hexagon.disabled || hexagon.value !== null || gameState.gameOver) {
        return;
    }

    // remove hover effect
    hidePreview(hexagon);
    resetAdjacentPreviews();

    hexagon.value = gameState.currentHexagon.value;
    hexagon.color = gameState.currentHexagon.color;
    hexagon.element.textContent = hexagon.value;
    hexagon.element.classList.add(hexagon.color);

    // Check for takeovers and additions
    checkAdjacentHexagons(row, col);

    // Update scores
    updateScores();

    // Switch players
    gameState.currentPlayer = 1 - gameState.currentPlayer;

    // Generate new current hexagon
    generateCurrentHexagon();

    // Check for game over
    if (checkGameOver()) {
        endGame();
    } else if (gameState.players[gameState.currentPlayer].name === 'Bot') {
        setTimeout(botMove, 1000);
    }
}

function checkAdjacentHexagons(row, col) {
    const directions = [
        [-1, 0], [1, 0], [0, -1], [0, 1],
        [row % 2 === 0 ? -1 : 1, -1],
        [row % 2 === 0 ? -1 : 1, 1]
    ];

    for (const [dx, dy] of directions) {
        const newRow = row + dx;
        const newCol = col + dy;

        if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 10) {
            const index = newRow * 10 + newCol;
            const adjacent = gameState.board[index];

            if (adjacent.value !== null && !adjacent.disabled) {
                // remove any preview classes
                // adjacent.element.classList.remove('preview-add', 'preview-takeover');

                if (adjacent.color !== gameState.currentHexagon.color && adjacent.value < gameState.currentHexagon.value) {
                    // Takeover
                    adjacent.color = gameState.currentHexagon.color;
                    adjacent.element.classList.remove('red', 'blue');
                    adjacent.element.classList.add(gameState.currentHexagon.color);
                } else if (adjacent.color === gameState.currentHexagon.color) {
                    // Addition
                    adjacent.value++;
                    adjacent.element.textContent = adjacent.value;
                }
            }
        }
    }
}

function updateScores() {
    gameState.players[0].score = 0;
    gameState.players[1].score = 0;

    for (const hexagon of gameState.board) {
        if (hexagon.color === 'red') {
            gameState.players[0].score += hexagon.value;
        } else if (hexagon.color === 'blue') {
            gameState.players[1].score += hexagon.value;
        }
    }

    updateScoreDisplay();
}

function updateScoreDisplay() {
    document.getElementById('player1-name-display').textContent = gameState.players[0].name;
    document.getElementById('player2-name-display').textContent = gameState.players[1].name;
    document.getElementById('player1-score').textContent = `Score: ${gameState.players[0].score}`;
    document.getElementById('player2-score').textContent = `Score: ${gameState.players[1].score}`;
}

function checkGameOver() {
    return gameState.board.every(hexagon => hexagon.disabled || hexagon.value !== null);
}

function endGame() {
    gameState.gameOver = true;
    const winner = gameState.players[0].score > gameState.players[1].score ? gameState.players[0] : gameState.players[1];
    document.getElementById('winner-info').textContent = `${winner.name} wins with a score of ${winner.score}!`;
    gameScreen.style.display = 'none';
    gameOverScreen.style.display = 'block';
    updateLeaderboard(winner);
}

function updateLeaderboard(winner) {
    let leaderboard = JSON.parse(localStorage.getItem('hexariaLeaderboard')) || [];
    leaderboard.push({
        name: winner.name,
        score: winner.score,
        date: new Date().toISOString()
    });
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10); // Keep only top 10 scores
    localStorage.setItem('hexariaLeaderboard', JSON.stringify(leaderboard));
    displayLeaderboard();
}

function displayLeaderboard() {
    const leaderboard = JSON.parse(localStorage.getItem('hexariaLeaderboard')) || [];
    const leaderboardList = document.getElementById('leaderboard-list');
    leaderboardList.innerHTML = '';
    leaderboard.forEach((entry, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. ${entry.name}: ${entry.score} (${new Date(entry.date).toLocaleDateString()})`;
        leaderboardList.appendChild(li);
    });
}

document.getElementById('sort-score').addEventListener('click', () => sortLeaderboard('score'));
document.getElementById('sort-date').addEventListener('click', () => sortLeaderboard('date'));

function sortLeaderboard(criteria) {
    let leaderboard = JSON.parse(localStorage.getItem('hexariaLeaderboard')) || [];
    
    if (criteria === 'score') {
        leaderboard.sort((a, b) => b.score - a.score);
    } else if (criteria === 'date') {
        leaderboard.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    displayLeaderboard(leaderboard);
}

function resetGame() {
    gameOverScreen.style.display = 'none';
    welcomeScreen.style.display = 'block';
    player1NameInput.value = '';
    player2NameInput.value = '';
    difficultySelect.value = 'easy';
    validatePlayerSetup();
}

function showGameInstructions() {
    const instructions = [
        "Welcome to Hexaria!",
        "Place hexagons on the board to score points.",
        "Take over opponent's hexagons with higher values.",
        "Adjacent same-color hexagons increase by 1.",
        "The player with the highest score wins!"
    ];

    const instructionsContainer = document.getElementById('game-instructions');
    instructions.forEach((instruction, index) => {
        const p = document.createElement('p');
        p.textContent = instruction;
        p.style.opacity = '0';
        instructionsContainer.appendChild(p);

        setTimeout(() => {
            p.style.transition = 'opacity 1s';
            p.style.opacity = '1';
        }, index * 1000);
    });
}

function addHoverEffects() {
    gameState.board.forEach(hexagon => {
        hexagon.element.addEventListener('mouseenter', () => showPreview(hexagon));
        hexagon.element.addEventListener('mouseleave', () => hidePreview(hexagon));
    });
}

function showPreview(hexagon) {
    if (hexagon.disabled || hexagon.value !== null || gameState.gameOver) return;

    hexagon.element.style.backgroundColor = gameState.currentHexagon.color;
    hexagon.element.textContent = gameState.currentHexagon.value;

    // Show takeover and addition previews for adjacent hexagons
    const row = parseInt(hexagon.element.dataset.row);
    const col = parseInt(hexagon.element.dataset.col);
    previewAdjacentHexagons(row, col);
}

function hidePreview(hexagon) {
    if (hexagon.disabled || hexagon.value !== null) return;

    hexagon.element.style.backgroundColor = '';
    hexagon.element.textContent = '';

    // Hide previews for adjacent hexagons
    resetAdjacentPreviews();
}

function previewAdjacentHexagons(row, col) {
    const directions = [
        [-1, 0], [1, 0], [0, -1], [0, 1],
        [row % 2 === 0 ? -1 : 1, -1],
        [row % 2 === 0 ? -1 : 1, 1]
    ];

    directions.forEach(([dx, dy]) => {
        const newRow = row + dx;
        const newCol = col + dy;

        if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 10) {
            const index = newRow * 10 + newCol;
            const adjacent = gameState.board[index];

            if (adjacent && !adjacent.disabled && adjacent.value !== null) {
                if (adjacent.color !== gameState.currentHexagon.color && adjacent.value < gameState.currentHexagon.value) {
                    // Show takeover preview
                    adjacent.element.classList.add('preview-takeover');
                    adjacent.element.textContent = gameState.players[gameState.currentPlayer].color;
                    // adjacent.element.textContent = adjacent.element.textContent = adjacent.value
                    
                } else if (adjacent.color === gameState.currentHexagon.color) {
                    // Show addition preview
                    adjacent.element.classList.add('preview-add');
                    adjacent.element.textContent = adjacent.value + 1;
                }
            }
        }
    });
}

function resetAdjacentPreviews() {
    gameState.board.forEach(hexagon => {
        if (!hexagon.disabled && hexagon.value !== null) {
            hexagon.element.textContent = hexagon.value;
            hexagon.element.classList.remove('preview-add', 'preview-takeover');
        }
    });
}// Call addHoverEffects after initializing the board

function botMove() {
    const availableMoves = gameState.board.filter(hexagon => !hexagon.disabled && hexagon.value === null);
    if (availableMoves.length > 0) {
        // Show 3 preview moves
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const previewMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
                showBotMovePreview(previewMove);
            }, i * 1000);
        }

        // Make the actual move after 3 seconds
        setTimeout(() => {
            const bestMove = findBestMove(availableMoves);
            const row = parseInt(bestMove.element.dataset.row);
            const col = parseInt(bestMove.element.dataset.col);
            placeHexagon(row, col);
        }, 3000);
    }
}

function findBestMove(availableMoves) {
    // Implement a smarter algorithm to choose the best move
    // This could involve evaluating potential scores, takeovers, etc.
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
}

function showBotMovePreview(move) {
    // Show a visual preview of the bot's move
    move.element.style.backgroundColor = 'rgba(0, 0, 255, 0.3)';
    setTimeout(() => {
        move.element.style.backgroundColor = '';
    }, 500);
}

const placeSound = new Audio('path/to/place_sound.mp3');
function playPlaceSound() {
    placeSound.currentTime = 0;
    placeSound.play();
}// Call playPlaceSound() when placing a hexagon

// Initialize the game
displayLeaderboard();
validatePlayerSetup();

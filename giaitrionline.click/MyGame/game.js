// Game variables
const gameState = {
    isPlaying: false,
    score: 0,
    selectedCharacter: 'char1',
    selectedDragon: 'dragon1',
    playerSpeed: 5,
    bulletSpeed: 7,
    bulletDamage: 10,
    enemySpeed: 1.5,
    enemySpawnRate: 1800,
    enemyBaseHealth: 15,
    lastEnemySpawn: 0,
    enemies: [],
    bullets: [],
    keys: {
        ArrowLeft: false,
        ArrowRight: false,
        MouseLeft: false
    },
    isTouched: false, // Added to track touch state
    playerShootCooldown: 350,
    lastShotTime: 0,
    playerWidth: 60,
    playerHeight: 80,
    enemyWidth: 50,
    enemyHeight: 50,
    bulletWidth: 10,
    bulletHeight: 20,
    dragonWidth: 50,
    dragonHeight: 50
};

// DOM Elements
const mainMenu = document.getElementById('main-menu');
const countdownScreen = document.getElementById('countdown-screen');
const gameScreen = document.getElementById('game-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const leaderboardScreen = document.getElementById('leaderboard-screen'); // ADDED
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const backToMenuButton = document.getElementById('back-to-menu-button');
const leaderboardButton = document.getElementById('leaderboard-button'); // ADDED
const backFromLeaderboardButton = document.getElementById('back-from-leaderboard-button'); // ADDED
const countdownElement = document.getElementById('countdown');
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('final-score');
const playerElement = document.getElementById('player');
const dragonElement = document.getElementById('dragon');
const gameArea = document.getElementById('game-area');
const characterSelections = document.querySelectorAll('#character-selection .selection-item');
const dragonSelections = document.querySelectorAll('#dragon-selection .selection-item');
const highScoresListElement = document.getElementById('high-scores-list'); // ADDED

// Leaderboard constants
const MAX_HIGH_SCORES = 5;
const HIGH_SCORES_KEY = 'everwingCloneHighScores';

// Initialize game
function init() {
    preloadBackgroundImage();

    characterSelections.forEach(item => {
        item.addEventListener('click', () => {
            characterSelections.forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            gameState.selectedCharacter = item.dataset.character;
            playerElement.style.backgroundImage = `url('images/${gameState.selectedCharacter}.png')`;
        });
    });

    dragonSelections.forEach(item => {
        item.addEventListener('click', () => {
            dragonSelections.forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            gameState.selectedDragon = item.dataset.dragon;
        });
    });

    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', restartGame);
    backToMenuButton.addEventListener('click', showMainMenu);
    leaderboardButton.addEventListener('click', showLeaderboardScreen); // ADDED
    backFromLeaderboardButton.addEventListener('click', showMainMenu); // ADDED

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (gameState.keys.hasOwnProperty(e.key)) {
            gameState.keys[e.key] = true;
        }
    });

    document.addEventListener('keyup', (e) => {
        if (gameState.keys.hasOwnProperty(e.key)) {
            gameState.keys[e.key] = false;
        }
    });

    // Mouse controls for shooting
    gameArea.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
            gameState.keys.MouseLeft = true;
        }
    });

    document.addEventListener('mouseup', (e) => {
        if (e.button === 0) {
            gameState.keys.MouseLeft = false;
        }
    });

    // Mouse control for player horizontal movement
    gameArea.addEventListener('mousemove', handlePlayerFollowMouseX);

    // Touch Controls
    gameArea.addEventListener('touchstart', (e) => {
        if (!gameState.isPlaying) return;
        e.preventDefault();
        gameState.isTouched = true;
        handlePlayerFollowTouchX(e);
    }, { passive: false });

    gameArea.addEventListener('touchmove', (e) => {
        if (!gameState.isPlaying) return;
        e.preventDefault();
        handlePlayerFollowTouchX(e);
    }, { passive: false });

    gameArea.addEventListener('touchend', (e) => {
        if (!gameState.isPlaying) return;
        if (e.touches.length === 0) {
            gameState.isTouched = false;
        }
    });

    gameArea.addEventListener('touchcancel', (e) => {
        if (!gameState.isPlaying) return;
        if (e.touches.length === 0) {
            gameState.isTouched = false;
        }
    });

    gameArea.addEventListener('contextmenu', (e) => e.preventDefault());

    playerElement.style.backgroundImage = `url('images/${gameState.selectedCharacter}.png')`;
    dragonElement.style.display = 'none';
    showMainMenu();
}

function preloadBackgroundImage() {
    const img = new Image();
    img.src = 'images/my-new-background.jpg';
    img.onload = () => {
        console.log('Background image loaded');
        document.body.classList.add('bg-loaded');
    };
    img.onerror = () => {
        console.error('Background image failed to load, using fallback. Check path: images/my-new-background.jpg');
        document.body.style.backgroundColor = '#121212';
    };
}

function updateScoreDisplay() {
    scoreElement.textContent = `Score: ${gameState.score}`;
}

function clearGameElements() {
    gameState.enemies.forEach(enemy => {
        if (enemy.element && enemy.element.parentNode) {
            enemy.element.parentNode.removeChild(enemy.element);
        }
    });
    gameState.enemies = [];

    gameState.bullets.forEach(bullet => {
        if (bullet.element && bullet.element.parentNode) {
            bullet.element.parentNode.removeChild(bullet.element);
        }
    });
    gameState.bullets = [];
    dragonElement.style.display = 'none';
}

function showMainMenu() {
    clearGameElements();
    countdownScreen.classList.add('hidden');
    gameScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    leaderboardScreen.classList.add('hidden'); // ADDED
    mainMenu.classList.remove('hidden');

    startButton.classList.remove('hidden');
    leaderboardButton.classList.remove('hidden'); // Ensure leaderboard button is visible
    restartButton.classList.add('hidden');
    backToMenuButton.classList.add('hidden');

    gameState.isPlaying = false;
    gameState.isTouched = false;
    gameState.keys.MouseLeft = false;
}

function startGame() {
    clearGameElements();
    gameState.isPlaying = false;
    gameState.isTouched = false;
    gameState.keys.MouseLeft = false;

    mainMenu.classList.add('hidden');
    gameScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    leaderboardScreen.classList.add('hidden'); // ADDED
    countdownScreen.classList.remove('hidden');

    startButton.classList.add('hidden');
    leaderboardButton.classList.add('hidden'); // Hide leaderboard button during countdown/game
    restartButton.classList.add('hidden');
    backToMenuButton.classList.add('hidden');

    let count = 3;
    countdownElement.textContent = count;

    const countdownInterval = setInterval(() => {
        count--;
        countdownElement.textContent = count;
        if (count === 0) {
            clearInterval(countdownInterval);
            countdownScreen.classList.add('hidden');
            gameScreen.classList.remove('hidden');

            gameState.score = 0;
            updateScoreDisplay();
            gameState.lastEnemySpawn = performance.now();
            gameState.lastShotTime = 0;

            playerElement.style.left = '50%';
            playerElement.style.transform = 'translateX(-50%)';
            playerElement.style.bottom = '50px';
            playerElement.style.backgroundImage = `url('images/${gameState.selectedCharacter}.png')`;
            playerElement.style.display = 'block';

            dragonElement.style.backgroundImage = `url('images/${gameState.selectedDragon}.png')`;
            dragonElement.style.display = 'block';

            gameState.isPlaying = true;
            console.log("Game started with character:", gameState.selectedCharacter, "and dragon:", gameState.selectedDragon);
            requestAnimationFrame(gameLoop);
        }
    }, 1000);
}

function restartGame() {
    startGame();
}

function handleGameOver() {
    gameState.isPlaying = false;
    gameState.isTouched = false;
    gameState.keys.MouseLeft = false;

    finalScoreElement.textContent = gameState.score;
    addScoreToLeaderboard(gameState.score); // ADDED - Save score

    mainMenu.classList.add('hidden');
    countdownScreen.classList.add('hidden');
    gameScreen.classList.add('hidden');
    leaderboardScreen.classList.add('hidden'); // ADDED
    gameOverScreen.classList.remove('hidden');

    restartButton.classList.remove('hidden');
    backToMenuButton.classList.remove('hidden');
    startButton.classList.add('hidden');
    leaderboardButton.classList.add('hidden'); // Hide leaderboard button on game over

    dragonElement.style.display = 'none';
    console.log("Game Over. Final Score:", gameState.score);
}

// --- LEADERBOARD FUNCTIONS ---
function loadHighScores() {
    const scoresJSON = localStorage.getItem(HIGH_SCORES_KEY);
    return scoresJSON ? JSON.parse(scoresJSON) : [];
}

function saveHighScores(scores) {
    localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(scores));
}

function addScoreToLeaderboard(score) {
    const highScores = loadHighScores();
    highScores.push(score);
    highScores.sort((a, b) => b - a); // Sort descending
    highScores.splice(MAX_HIGH_SCORES); // Keep only top N scores
    saveHighScores(highScores);
}

function displayHighScores() {
    const highScores = loadHighScores();
    highScoresListElement.innerHTML = ''; // Clear previous list

    if (highScores.length === 0) {
        highScoresListElement.innerHTML = '<li>Chưa có điểm nào.</li>';
        return;
    }

    highScores.forEach(score => {
        const listItem = document.createElement('li');
        listItem.textContent = score;
        highScoresListElement.appendChild(listItem);
    });
}

function showLeaderboardScreen() {
    clearGameElements();
    mainMenu.classList.add('hidden');
    countdownScreen.classList.add('hidden');
    gameScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    leaderboardScreen.classList.remove('hidden');

    displayHighScores(); // Populate the list
}
// --- END LEADERBOARD FUNCTIONS ---

function handlePlayerFollowMouseX(event) {
    if (!gameState.isPlaying) return;
    const gameAreaRect = gameArea.getBoundingClientRect();
    let mouseX = event.clientX - gameAreaRect.left;
    let targetPlayerLeft = mouseX - (gameState.playerWidth / 2);
    targetPlayerLeft = Math.max(0, targetPlayerLeft);
    targetPlayerLeft = Math.min(gameAreaRect.width - gameState.playerWidth, targetPlayerLeft);
    playerElement.style.left = `${targetPlayerLeft}px`;
    if (playerElement.style.transform === 'translateX(-50%)') {
        playerElement.style.transform = 'translateX(0%)';
    }
}

function handlePlayerFollowTouchX(event) {
    if (!gameState.isPlaying || !event.touches || event.touches.length === 0) return;
    const gameAreaRect = gameArea.getBoundingClientRect();
    let touchX = event.touches[0].clientX - gameAreaRect.left;
    let targetPlayerLeft = touchX - (gameState.playerWidth / 2);
    targetPlayerLeft = Math.max(0, targetPlayerLeft);
    targetPlayerLeft = Math.min(gameAreaRect.width - gameState.playerWidth, targetPlayerLeft);
    playerElement.style.left = `${targetPlayerLeft}px`;
    if (playerElement.style.transform === 'translateX(-50%)') {
        playerElement.style.transform = 'translateX(0%)';
    }
}

function updatePlayerAndDragon(gameAreaRect) {
    if (!gameState.isPlaying) return;
    let playerCurrentLeft = playerElement.offsetLeft;
    const dragonOffset = gameState.playerWidth / 2 + gameState.dragonWidth / 2 + 5;
    dragonElement.style.left = `${playerCurrentLeft - dragonOffset + 25}px`;
    dragonElement.style.top = `${playerElement.offsetTop + (gameState.playerHeight / 2) - (gameState.dragonHeight / 2)}px`;
}

function handleShooting(currentTime, gameAreaRect) {
    if (!gameState.isPlaying) return;
    const isShootingActive = gameState.keys.MouseLeft || gameState.isTouched;
    if (isShootingActive && (currentTime - gameState.lastShotTime > gameState.playerShootCooldown)) {
        gameState.lastShotTime = currentTime;
        createBullet(gameAreaRect, playerElement, gameState.playerWidth, gameState.playerHeight);
        if (dragonElement.style.display === 'block' && gameState.selectedDragon) {
            createBullet(gameAreaRect, dragonElement, gameState.dragonWidth, gameState.dragonHeight, true);
        }
    }
}

function createBullet(gameAreaRect, shooterElement, shooterWidth, shooterHeight, isDragonBullet = false) {
    const shooterRect = shooterElement.getBoundingClientRect();
    const bulletElement = document.createElement('div');
    bulletElement.classList.add('bullet');
    let bulletX = (shooterRect.left - gameAreaRect.left) + (shooterWidth / 2) - (gameState.bulletWidth / 2);
    let bulletY = (shooterRect.top - gameAreaRect.top) - gameState.bulletHeight;
    bulletElement.style.left = `${bulletX}px`;
    bulletElement.style.top = `${bulletY}px`;
    gameArea.appendChild(bulletElement);
    gameState.bullets.push({ element: bulletElement, x: bulletX, y: bulletY });
}

function updateBullets(gameAreaRect) {
    if (!gameState.isPlaying) return;
    for (let i = gameState.bullets.length - 1; i >= 0; i--) {
        const bullet = gameState.bullets[i];
        bullet.y -= gameState.bulletSpeed;
        bullet.element.style.top = `${bullet.y}px`;
        if (bullet.y + gameState.bulletHeight < 0) {
            if (bullet.element.parentNode) bullet.element.remove();
            gameState.bullets.splice(i, 1);
        }
    }
}

function spawnEnemies(currentTime, gameAreaRect) {
    if (!gameState.isPlaying) return;
    if (currentTime - gameState.lastEnemySpawn > gameState.enemySpawnRate) {
        gameState.lastEnemySpawn = currentTime;
        const enemyElement = document.createElement('div');
        enemyElement.classList.add('enemy');
        enemyElement.style.backgroundImage = "url('images/quai1.png')"; // Consider randomizing enemy sprites
        enemyElement.style.width = `${gameState.enemyWidth}px`;
        enemyElement.style.height = `${gameState.enemyHeight}px`;
        const enemyX = Math.random() * (gameAreaRect.width - gameState.enemyWidth);
        const enemyY = 0 - gameState.enemyHeight;
        enemyElement.style.left = `${enemyX}px`;
        enemyElement.style.top = `${enemyY}px`;
        gameArea.appendChild(enemyElement);
        gameState.enemies.push({ element: enemyElement, x: enemyX, y: enemyY, health: gameState.enemyBaseHealth });
    }
}

function updateEnemies(gameAreaRect) {
    if (!gameState.isPlaying) return;
    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
        const enemy = gameState.enemies[i];
        enemy.y += gameState.enemySpeed;
        enemy.element.style.top = `${enemy.y}px`;
        if (enemy.y > gameAreaRect.height) {
            if (enemy.element.parentNode) enemy.element.remove();
            gameState.enemies.splice(i, 1);
        }
    }
}

function checkCollisions(gameAreaRect) {
    if (!gameState.isPlaying) return;
    const playerRect = playerElement.getBoundingClientRect();
    for (let i = gameState.bullets.length - 1; i >= 0; i--) {
        const bullet = gameState.bullets[i];
        const bulletRect = bullet.element.getBoundingClientRect();
        for (let j = gameState.enemies.length - 1; j >= 0; j--) {
            const enemy = gameState.enemies[j];
            const enemyRect = enemy.element.getBoundingClientRect();
            if (rectsOverlap(bulletRect, enemyRect)) {
                if (bullet.element.parentNode) bullet.element.remove();
                gameState.bullets.splice(i, 1);
                enemy.health -= gameState.bulletDamage;
                if (enemy.health <= 0) {
                    if (enemy.element.parentNode) enemy.element.remove();
                    gameState.enemies.splice(j, 1);
                    gameState.score += 15;
                    updateScoreDisplay();
                }
                break;
            }
        }
    }
    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
        const enemy = gameState.enemies[i];
        const enemyRect = enemy.element.getBoundingClientRect();
        if (rectsOverlap(playerRect, enemyRect)) {
            handleGameOver();
            return;
        }
    }
}

function rectsOverlap(rect1, rect2) {
    return rect1.left < rect2.right &&
           rect1.right > rect2.left &&
           rect1.top < rect2.bottom &&
           rect1.bottom > rect2.top;
}

function gameLoop(currentTime) {
    if (!gameState.isPlaying) return;
    const gameAreaRect = gameArea.getBoundingClientRect();

    updatePlayerAndDragon(gameAreaRect);
    handleShooting(currentTime, gameAreaRect);
    spawnEnemies(currentTime, gameAreaRect);
    updateBullets(gameAreaRect);
    updateEnemies(gameAreaRect);
    checkCollisions(gameAreaRect);

    if (gameState.isPlaying) {
        requestAnimationFrame(gameLoop);
    }
}

init();

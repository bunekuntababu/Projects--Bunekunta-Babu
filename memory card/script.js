const selectors = {
    boardContainer: document.querySelector('.board-container'),
    board: document.querySelector('.board'),
    moves: document.querySelector('.moves'),
    timer: document.querySelector('.timer'),
    start: document.querySelector('#start-button'),
    restart: document.querySelector('#restart-button'),
    logout: document.querySelector('#logout-button'),
    quit: document.querySelector('#quit-button'), // Select the quit button
    win: document.querySelector('.win'),
    loginForm: document.querySelector('#login-form'),
    signupForm: document.querySelector('#signup-form'),
    gameContainer: document.querySelector('.game-container'),
    difficulty: document.querySelector('#difficulty'),
    usernameDisplay: document.querySelector('#username-display')
};

const state = {
    gameStarted: false,
    flippedCards: 0,
    totalFlips: 0,
    totalTime: 0,
    currentUser: null,
    loop: null
};

// Shuffle array
const shuffle = array => {
    const clonedArray = [...array];
    for (let i = clonedArray.length - 1; i > 0; i--) {
        const randomIndex = Math.floor(Math.random() * (i + 1));
        [clonedArray[i], clonedArray[randomIndex]] = [clonedArray[randomIndex], clonedArray[i]];
    }
    return clonedArray;
};

// Pick random items
const pickRandom = (array, items) => {
    const clonedArray = [...array];
    const randomPicks = [];
    for (let i = 0; i < items; i++) {
        const randomIndex = Math.floor(Math.random() * clonedArray.length);
        randomPicks.push(clonedArray[randomIndex]);
        clonedArray.splice(randomIndex, 1);
    }
    return randomPicks;
};

// Generate game board
const generateGame = () => {
    const rows = parseInt(selectors.board.getAttribute('data-rows'), 10);
    const cols = parseInt(selectors.board.getAttribute('data-cols'), 10);

    if ((rows * cols) % 2 !== 0) {
        throw new Error("The board must have an even number of cells.");
    }

    const emojis = ['🥔', '🍒', '🥑', '🌽', '🥕', '🍇', '🍉', '🍌', '🍎', '🍊', '🍓', '🍍', '🍆', '🥜', '🍋', '🍈', '🥭', '🍏', '🥝', '🍠'];
    const picks = pickRandom(emojis, (rows * cols) / 2);
    const items = shuffle([...picks, ...picks]);

    const cardsHTML = `
        <div class="board" style="grid-template-columns: repeat(${cols}, auto)">
            ${items.map(item => `
                <div class="card">
                    <div class="card-front"></div>
                    <div class="card-back">${item}</div>
                </div>
            `).join('')}
        </div>
    `;

    const parser = new DOMParser().parseFromString(cardsHTML, 'text/html');
    selectors.board.replaceWith(parser.querySelector('.board'));
    selectors.board = document.querySelector('.board');  // Re-assigns the selector to the new board
};

// Reset game state
const resetGame = () => {
    state.gameStarted = false;
    state.flippedCards = 0;
    state.totalFlips = 0;
    state.totalTime = 0;
    clearInterval(state.loop);
    selectors.moves.innerText = '0 moves';
    selectors.timer.innerText = 'Time: 0 min 0 sec';
    selectors.win.classList.remove('win-animation');
    selectors.win.innerHTML = ''; // Clear win message
    generateGame();
};

// Quit Game
const quitGame = () => {
    resetGame();
    selectors.gameContainer.classList.add('hidden');
    selectors.loginForm.classList.remove('hidden');
    state.currentUser = null;
    selectors.usernameDisplay.innerText = '';
};

// Start game timer
const startGame = () => {
    state.gameStarted = true;
    selectors.start.classList.add('disabled');
    state.loop = setInterval(() => {
        state.totalTime++;
        const minutes = Math.floor(state.totalTime / 60);
        const seconds = state.totalTime % 60;
        selectors.moves.innerText = `${state.totalFlips} moves`;
        selectors.timer.innerText = `Time: ${minutes} min ${seconds} sec`;
    }, 1000);
};

// Flip cards back
const flipBackCards = () => {
    document.querySelectorAll('.card:not(.matched)').forEach(card => {
        card.classList.remove('flipped');
    });
    state.flippedCards = 0;
};

// Flip card and check match
const flipCard = card => {
    state.flippedCards++;
    state.totalFlips++;
    if (!state.gameStarted) {
        startGame();
    }
    if (state.flippedCards <= 2) {
        card.classList.add('flipped');
    }
    if (state.flippedCards === 2) {
        const flippedCards = document.querySelectorAll('.flipped:not(.matched)');
        if (flippedCards[0].innerText === flippedCards[1].innerText) {
            flippedCards[0].classList.add('matched');
            flippedCards[1].classList.add('matched');
        } else {
            // Vibrate cards if they do not match
            flippedCards.forEach(c => c.classList.add('vibrate'));
            setTimeout(() => {
                flippedCards.forEach(c => c.classList.remove('vibrate'));
            }, 500);
        }
        setTimeout(() => {
            flipBackCards();
        }, 1000);
    }
    checkWin();
};

// Show Win Animation
const showWinAnimation = () => {
    selectors.win.classList.add('winAnimation');
    selectors.win.innerHTML = `
        <span class="win-text">
            You won!<br />
            with <span class="highlight">${state.totalFlips}</span> moves<br />
            under <span class="highlight">${Math.floor(state.totalTime / 60)} min ${state.totalTime % 60} sec</span>
        </span>
    `;
};

// Check for win
const checkWin = () => {
    const allFlipped = document.querySelectorAll('.card.flipped:not(.matched)');
    if (allFlipped.length === selectors.board.children.length) {
        clearInterval(state.loop);
        setTimeout(showWinAnimation, 1000);
    }
};

// Event listeners for card flip and game controls
const attachEventListeners = () => {
    document.addEventListener('click', event => {
        const eventTarget = event.target;
        const eventParent = eventTarget.parentElement;

        if (eventTarget.className.includes('card') && !eventParent.className.includes('flipped')) {
            flipCard(eventParent);
        } else if (eventTarget.id === 'start-button') {
            startGame();
        } else if (eventTarget.id === 'restart-button') {
            resetGame();
        } else if (eventTarget.id === 'logout-button') {
            state.currentUser = null;
            selectors.usernameDisplay.innerText = '';
            selectors.gameContainer.classList.add('hidden');
            selectors.loginForm.classList.remove('hidden');
        } else if (eventTarget.id === 'quit-button') {
            quitGame();
        }
    });
};

// Difficulty level change event
selectors.difficulty.addEventListener('change', event => {
    const difficulty = event.target.value;

    let dimensions;
    if (difficulty === 'easy') {
        dimensions = [4, 4]; // 4x4 grid for easy
    } else if (difficulty === 'medium') {
        dimensions = [5, 6]; // 5x6 grid for medium
    } else if (difficulty === 'hard') {
        dimensions = [6, 6]; // 6x6 grid for hard
    }

    selectors.board.setAttribute('data-rows', dimensions[0]);
    selectors.board.setAttribute('data-cols', dimensions[1]);
    resetGame();
});

// Login and signup
selectors.loginForm.addEventListener('submit', event => {
    event.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const storedUser = JSON.parse(localStorage.getItem(username));
    if (storedUser && storedUser.password === password) {
        state.currentUser = username;
        selectors.usernameDisplay.innerText = `Welcome, ${username}`;
        selectors.gameContainer.classList.remove('hidden');
        selectors.loginForm.classList.add('hidden');
        selectors.signupForm.classList.add('hidden');
    } else {
        alert('Invalid username or password!');
    }
});

selectors.signupForm.addEventListener('submit', event => {
    event.preventDefault();
    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;
    if (localStorage.getItem(username)) {
        alert('Username already exists!');
        return;
    }
    localStorage.setItem(username, JSON.stringify({ password }));
    alert('Signup successful! You can now log in.');
    selectors.signupForm.classList.add('hidden');
    selectors.loginForm.classList.remove('hidden');
});

// Toggle between login and signup forms
document.getElementById('toggle-signup').addEventListener('click', event => {
    event.preventDefault();
    selectors.loginForm.classList.add('hidden');
    selectors.signupForm.classList.remove('hidden');
});
document.getElementById('toggle-login').addEventListener('click', event => {
    event.preventDefault();
    selectors.signupForm.classList.add('hidden');
    selectors.loginForm.classList.remove('hidden');
});

// Initialize the game
const initGame = () => {
    generateGame();
    attachEventListeners();
};

window.onload = initGame;
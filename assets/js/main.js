/**
 * Themes and images for the memory game
 */
const themes = {
  animals: [
    'lion.webp', 'tiger.webp', 'elephant.webp', 'monkey.webp',
    'dog.webp', 'cat.webp', 'rabbit.webp', 'frog.webp',
    'bear.webp', 'fox.webp', 'redPanda.webp', 'owl.webp'
  ],
  space: [
    'planet.webp', 'rocket.webp', 'astronaut.webp', 'ufo.webp',
    'star.webp', 'satellite.webp', 'comet.webp', 'moon.webp',
    'solarSystem.webp', 'alien.webp', 'telescope.webp', 'terra.webp'
  ]
};

/**
 * Background according to the theme
 */
const backgrounds = {
  animals: 'url(assets/img/bg-forest.webp)',
  space: 'url(assets/img/bg-space.webp)'
};

// --- DOM ELEMENTS ---
const board = document.getElementById('board');
const timerEl = document.getElementById('timer');
const themeSelect = document.getElementById('theme');
const difficultySelect = document.getElementById('difficulty');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const stopBtn = document.getElementById('stop-btn');
const overlay = document.getElementById('overlay');
const penaltyCheckbox = document.getElementById('penalty'); // checkbox for penalties

// --- GAME VARIABLES ---
let firstCard = null;
let secondCard = null;
let lockBoard = false;

let timer;
let timeLeft = 0;

let cards = [];

let gameStarted = false;
let gamePaused = false;
let gameEnded = false;
let pendingFlipTimeout = null;

let pauseBtnDisplay = false;
let stopBtnDisplay = false;

let flipTimeoutRemaining = 0;
let flipTimeoutStartedAt = 0;

// --- "+ TIME" EFFECT ---
function showTimeChange(segons) {
  const span = document.createElement('span');
  span.classList.add('time-added', 'show');
  span.textContent = `${segons > 0 ? '+' : ''}${segons}s`;
  span.style.color = segons > 0 ? '#00ff00' : '#ff4444';
  timerEl.parentElement.appendChild(span);

  setTimeout(() => span.remove(), 1500);
}

// --- CARD PREVIEW AND BACKGROUND ---
themeSelect.addEventListener('change', () => {
  const theme = themeSelect.value;
  document.body.style.backgroundImage = backgrounds[theme];
  mostrarCartesPreview(theme);
});

startBtn.addEventListener('click', startGame);
/**
 * Shows preview cards according to the selected theme
 * @param {string} theme
 */
function mostrarCartesPreview(theme) {
  const selectedImages = themes[theme];
  const previewCards = [...selectedImages, ...selectedImages];

  board.innerHTML = '';
  previewCards.forEach((img, index) => {
    const carta = crearCarta(`assets/img/${theme}/${img}`, index, true);
    carta.classList.add('preview');
    board.appendChild(carta);
  });
}

/**
 * Creates a card with front and back
 * @param {string} imgSrc - image URL
 * @param {number} id - card identifier
 * @param {boolean} isPreview - whether it is a preview card
 * @returns {HTMLElement} card
 */
function crearCarta(imgSrc, id, isPreview = false) {
  const carta = document.createElement('div');
  carta.classList.add('carta');

  const front = document.createElement('div');
  front.classList.add('cara', 'front');
  front.style.backgroundImage = `url(${imgSrc})`;

  const back = document.createElement('div');
  back.classList.add('cara', 'back');

  carta.append(front, back);
  carta.dataset.id = id;

  if (!isPreview) carta.addEventListener('click', () => girarCarta(carta));

  return carta;
}

// --- Initiate Game ---
function startGame(forceRestart = false) {

  console.log({
    gameStarted,
    forceRestart
  });

  const theme = themeSelect.value;
  const difficulty = parseInt(difficultySelect.value);
  const isExtreme = extremeCheckbox.checked;

  // false first execution
  if (gameStarted && !forceRestart) {
    openRestartModal();
    return;
  }

  clearInterval(timer);
  clearTimeout(pendingFlipTimeout);

  pendingFlipTimeout = null;
  firstCard = null;
  secondCard = null;
  lockBoard = false;
  gamePaused = false;
  gameEnded = false;

  gameStarted = true;
  startBtn.innerHTML = "Restart Match";

  // Display "Stop/Pause Match" Buttons
  pauseBtnDisplay = true;
  pauseBtn.style.opacity = "100";
  pauseBtn.style.cursor = "pointer";
  pauseBtn.onclick = () => {
    if (gamePaused) {
      resumeGame();
    } else {
      pauseGame();
    }
  }
  
  stopBtnDisplay = true;
  stopBtn.style.opacity = "100";
  stopBtn.style.cursor = "pointer";
  stopBtn.onclick = stopGame;
  
  // Block difficulty changes & extrem mode
  difficultySelect.disabled = true;
  extremeCheckbox.disabled = true;
  themeSelect.disabled = true;

  const selectedImages = themes[theme];
  cards = [...selectedImages, ...selectedImages];
  shuffle(cards);

  board.innerHTML = '';
  cards.forEach((img, index) => {
    const carta = crearCarta(`assets/img/${theme}/${img}`, index);
    carta.classList.add('entrar');
    board.appendChild(carta);
  });

  resetTimer(difficulty);
  startTimer();
  showTimeChange(timeLeft);
}

function pauseGame() {
  if (!gameStarted || gamePaused || gameEnded) return;

  gamePaused = true;
  clearInterval(timer);
  
  // Freeze the pending delay between two incorrect cards.
  if (pendingFlipTimeout !== null) {
    clearTimeout(pendingFlipTimeout);

    const elapsed = Date.now() - flipTimeoutStartedAt;
    flipTimeoutRemaining = Math.max(
      0,
      flipTimeoutRemaining - elapsed
    );

    pendingFlipTimeout = null;
  }

  pauseBtn.textContent = "Resume Match";
}

function resumeGame() {
  if (!gameStarted || !gamePaused || gameEnded) return;

  gamePaused = false;
  pauseBtn.textContent = "PauseMatch";

  // Resume left time to hide the cards.
  if (firstCard && secondCard) {
    scheduleFlipReset(flipTimeoutRemaining);
  }
  startTimer();
}

function scheduleFlipReset(delay) {
  flipTimeoutRemaining = delay;
  flipTimeoutStartedAt = Date.now();

  pendingFlipTimeout = setTimeout(() => {
    pendingFlipTimeout = null;

    if (gamePaused || gameEnded) return;

    if (firstCard && secondCard) {
      firstCard.classList.remove("flip");
      secondCard.classList.remove("flip");
    }

    resetBoard();
  }, delay);
}

function stopGame() {
  if (!gameStarted) return;

  clearInterval(timer);
  clearTimeout(pendingFlipTimeout);

  pendingFlipTimeout = null;
  flipTimeoutRemaining = 0;

  // Reset the inner state
  firstCard = null;
  secondCard = null;
  lockBoard = false;
  gamePaused = false;
  gameEnded = false;
  gameStarted = false;

  // Reset the options
  difficultySelect.disabled = false;
  extremeCheckbox.disabled = false;
  themeSelect.disabled = false;

  // Reset Buttons
  pauseBtn.textContent = "Pause Match";
  pauseBtn.style.opacity = "0";
  stopBtn.style.opacity = "0";
  pauseBtn.style.cursor = "default";
  stopBtn.style.cursor = "default";
  startBtn.textContent = "Start Match";

  // Hide modals
  modal.classList.remove("show");
  restartModal.classList.remove("show");

  // Show the previous selected option again
  const theme = themeSelect.value;
  mostrarCartesPreview(theme);

  resetTimer(parseInt(difficultySelect.value));
}

// --- GAME FUNCTIONS ---
function girarCarta(carta) {
  if (gamePaused || gameEnded || !gameStarted) return;
  if (lockBoard || carta.classList.contains('flip')) return;

  carta.classList.add('flip');

  if (!firstCard) {
    firstCard = carta;
    return;
  }

  secondCard = carta;
  checkMatch();
}

/**
 * Checks whether the cards match
 */
function checkMatch() {
  const cardOne = firstCard;
  const cardTwo = secondCard;

  const img1 = firstCard.querySelector('.front').style.backgroundImage;
  const img2 = secondCard.querySelector('.front').style.backgroundImage;
  
  lockBoard = true;

  if (img1 === img2) {
    firstCard.classList.add('matched');
    secondCard.classList.add('matched');
    checkWin();

    resetBoard();
    return;
  } else {
    // Extreme Mode Penalty
    if (extremeCheckbox.checked) {
      const penalty = getPenaltyTime();
      timeLeft = Math.max(0, timeLeft - penalty);
      showTimeChange(-penalty);

      if (timeLeft <= 0) {
        timeLeft = 0;
        updateTimerDisplay();
        endGame(false);
        return;
      } 
    }
  }
  if (!gameEnded) {
    scheduleFlipReset(1000);
  }
}

function getPenaltyTime() {
  const difficulty = parseInt(difficultySelect.value);
  const penaltyMap = { 1: 3, 2: 4, 3: 5, 4: 6, 5: 7 };
  return penaltyMap[difficulty] || 5;
}

function resetBoard() {
  [firstCard, secondCard, lockBoard] = [null, null, false];
}

/**
 * Shuffle array
 */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// --- TIMER ---
function resetTimer(difficulty) {
  clearInterval(timer);
  const times = { 1: 300, 2: 240, 3: 180, 4: 120, 5: 60 };
  timeLeft = times[difficulty] || 180;
  updateTimerDisplay();
}

function startTimer() {
  clearInterval(timer);

  if (gamePaused || gameEnded || !gameStarted) return;

  timer = setInterval(() => {
    if (gamePaused || gameEnded) return;

    timeLeft--;
    updateTimerDisplay();
    
    if (timeLeft <= 0) {
      timeLeft = 0;
      updateTimerDisplay();
      endGame(false);
    }
  }, 1000);
}

function updateTimerDisplay() {
  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');
  timerEl.textContent = `${minutes}:${seconds}`;

  const gameContainer = document.querySelector('.game-container');
  if (!gameContainer) return;

  gameContainer.classList.remove('warning-slow', 'warning-medium', 'warning-fast');
  timerEl.classList.remove('warning-slow', 'warning-medium', 'warning-fast');

  if (timeLeft <= 5) {
    gameContainer.classList.add('warning-fast');
    timerEl.classList.add('warning-fast');
  } else if (timeLeft <= 15) {
    gameContainer.classList.add('warning-medium');
    timerEl.classList.add('warning-medium');
  } else if (timeLeft <= 30) {
    gameContainer.classList.add('warning-slow');
    timerEl.classList.add('warning-slow');
  }
}

/**
 * Checks whether all pairs have been completed
 */
function checkWin() {
  const allMatched = [...document.querySelectorAll('.carta')]
    .filter(card => !card.classList.contains('preview'))
    .every(card => card.classList.contains('matched'));
  if (allMatched) endGame(true);
}

// --- FUN FACTS ---
const funFacts = [
  "Octopuses have three hearts.",
  "Saturn could float in water because of its low density.",
  "Dolphins call each other by name.",
  "Giraffes have no vocal cords.",
  "Space smells like hot metal and grilled meat.",
  "Pandas spend more than 12 hours a day eating.",
  "It rains diamonds on Jupiter.",
  "Owls can turn their heads almost 270 degrees.",
  "Some fish can naturally change sex.",
  "The human heart beats more than 100,000 times a day.",
  "The human brain has roughly 86 billion neurons, but what really determines intelligence is how they connect to each other.",
  "The stars you see in the sky may no longer exist: some are so far away that their light takes thousands of years to reach us.",
  "An average cloud weighs more than 500 tons, but it floats because warm air holds it up.",
  "Chameleons don't change color just for camouflage; they also do it to express emotions or regulate their body temperature.",
  "When you look at space, you literally see the past: the light from distant galaxies shows us how they were millions of years ago.",
  "Octopuses can open jars from the inside, solve puzzles, and even escape from aquariums. They are the geniuses of the sea.",
  "Human DNA and a banana's share roughly 60% genetic similarity.",
  "In the vacuum of space, sound cannot travel, so you would never hear an explosion even if it happened right in front of you.",
  "Blue whales can communicate across hundreds of kilometers thanks to low-frequency sounds that the human ear cannot perceive.",
  "Starfish have no brain, but they do have a complex nervous system that lets them coordinate their movements perfectly."
];

// --- END MODAL ---
const modal = document.getElementById("endModal");
const modalTitle = modal.querySelector(".modal-title");
const modalScore = modal.querySelector(".score");
const modalFact = modal.querySelector(".funfact");
const replayBtn = modal.querySelector("#replay-btn");
const closeBtn = modal.querySelector(".close-btn");

/**
 * Shows the end-of-game modal
 * @param {boolean} won - whether the game was won
 * @param {number} score - current score
 * @param {number} maxScore - maximum score
 */
function showEndModal(won, score, maxScore) {
  modalTitle.textContent = won ? "YOU WON!" : "YOU LOST (time's up)";
  modalTitle.className = `modal-title ${won ? "win" : "lose"}`;
  modalScore.textContent = `${score}/${maxScore}`;
  modalFact.textContent = won
    ? `Fun fact: ${funFacts[Math.floor(Math.random() * funFacts.length)]}`
    : "Maybe you'll have better luck next time 😅";
  replayBtn.style.display = won ? "none" : "inline-block";
  modal.classList.add("show");
}

closeBtn.addEventListener("click",
  closeEndModal
);
replayBtn.addEventListener("click", () => {
  closeEndModal()
  startGame();
});

// --- RESTART MODAL ---
const restartModal = document.getElementById("restartModal");
const restartClose = restartModal.querySelector(".close-btn");
const confirmRestartBtn = document.getElementById("confirm-restart");
const cancelRestartBtn = document.getElementById("cancel-restart");

const extremeCheckbox = document.getElementById('extreme-mode');
const modeDescription = document.getElementById('mode-description');

/**
 * Updates the mode description according to difficulty and extreme mode
 */
function updateModeDescription() {
  const difficulty = parseInt(difficultySelect.value);
  const isExtreme = extremeCheckbox.checked;

  let description = '';

  switch (difficulty) {
    case 1:
      description = 'In Easy mode you have 5 minutes to complete the pairs. Ideal for practicing without pressure.';
      break;
    case 2:
      description = 'In Medium mode you have 4 minutes. Moderate difficulty and light pressure.';
      break;
    case 3:
      description = 'In Hard mode you have 3 minutes. Memory will be key to completing the pairs.';
      break;
    case 4:
      description = 'In Expert mode you only have 2 minutes. Every mistake can be crucial.';
      break;
    case 5:
      description = 'In Legendary mode you only have 1 minute. Maximum precision required.';
      break;
    default:
      description = 'Select a difficulty to see the description.';
      break;
  }

  if (isExtreme) {
    description += '<br><br> ⚠️ In Extreme mode, every mistake will subtract time progressively!';
  }

  modeDescription.innerHTML = description;
}

difficultySelect.addEventListener('change', updateModeDescription);
extremeCheckbox.addEventListener('change', updateModeDescription);

// Initialize description
updateModeDescription();

function endGame(won) {
  if (gameEnded) return;

  gameEnded = true;
  gameStarted = false;
  gamePaused = false;

  clearInterval(timer);
  clearTimeout(pendingFlipTimeout);
  pendingFlipTimeout = null;

  clearInterval(timer);
  difficultySelect.disabled = false;
  extremeCheckbox.disabled = false;
  themeSelect.disabled = false;
  
  // Hide "Pause/Stop Match" buttons when the game ends (win or lose)
  pauseBtn.style.opacity = "0";
  stopBtn.style.opacity = "0";
  pauseBtn.style.cursor = "default";
  stopBtn.style.cursor = "default";
  pauseBtn.textContent = "Pause Match";

  const allCards = document.querySelectorAll(".carta");
  const matchedCards = [...allCards].filter(c => c.classList.contains('matched')).length;
  const score = matchedCards / 2;
  const maxScore = allCards.length / 2;

  const gameContainer = document.querySelector(".game-container");
  gameContainer.classList.remove("warning-slow", "warning-medium", "warning-fast");
  timerEl.classList.remove("warning-slow", "warning-medium", "warning-fast");

  setTimeout(() => {
    showEndModal(won, score, maxScore);
  }, 300);
}

// --- RESTART MODAL FUNCTIONS ---
function openRestartModal() {
  restartModal.classList.add("show");
  extremeRestartCheckbox.checked = extremeCheckbox.checked;
}

function closeRestartModal() {
  restartModal.classList.remove("show");
}

const extremeRestartCheckbox = document.getElementById("extreme-restart");
restartClose.addEventListener("click", closeRestartModal);
cancelRestartBtn.addEventListener("click", closeRestartModal);

confirmRestartBtn.addEventListener("click", () => {
  extremeCheckbox.checked = extremeRestartCheckbox.checked;
  closeRestartModal();
  closeEndModal();
  updateModeDescription();
  startGame(true);
});

function closeEndModal() {
  gameStarted = false;
  modal.classList.remove("show");
}

/**
 * Initializes the game and shows preview cards
 */
function init() {
  const theme = themeSelect.value;
  document.body.style.backgroundImage = backgrounds[theme];
  mostrarCartesPreview(theme);
}

window.addEventListener('DOMContentLoaded', init);
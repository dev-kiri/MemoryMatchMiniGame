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
  pauseBtn.onclick = () => {
    if (gamePaused) {
      resumeGame();
    } else {
      pauseGame();
    }
  }
  
  stopBtnDisplay = true;
  stopBtn.style.opacity = "100";
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
  "Els pops tenen tres cors.",
  "Saturn podria flotar en aigua per la seva baixa densitat.",
  "Els dofins es criden entre ells pel seu nom.",
  "Les girafes no tenen cordes vocals.",
  "L'espai olora a metall calent i carn a la brasa.",
  "Els pandas passen més de 12 hores al dia menjant.",
  "A Júpiter plouen diamants.",
  "Els mussols poden girar el cap gairebé 270 graus.",
  "Alguns peixos poden canviar de sexe de forma natural.",
  "El cor humà batega més de 100.000 vegades al dia.",
  "El cervell humà té aproximadament 86 mil milions de neurones, però el que realment determina la intel·ligència és com es connecten entre elles.",
  "Les estrelles que veus al cel podrien ja no existir: algunes estan tan lluny que la seva llum triga milers d'anys a arribar-nos.",
  "Un núvol mitjà pesa més de 500 tones, però flota perquè l'aire calent el sosté.",
  "Els camaleons no canvien de color només per camuflatge, també per expressar emocions o regular la seva temperatura corporal.",
  "Quan mires l'espai, literalment veus el passat: la llum de les galàxies llunyanes ens mostra com eren fa milions d'anys.",
  "Els pops poden obrir pots des de dins, resoldre trencaclosques i fins i tot escapar d'aquaris. Són els genis del mar.",
  "L'ADN humà i el d'un plàtan comparteixen aproximadament un 60% de similitud genètica.",
  "En el buit de l'espai, el so no pot viatjar, per això mai sentiries una explosió encara que passés davant teu.",
  "Les balenes blaves poden comunicar-se a centenars de quilòmetres gràcies a sons de baixa freqüència que l'oïda humana no percep.",
  "Les estrelles de mar no tenen cervell, però sí un sistema nerviós complex que els permet coordinar perfectament els seus moviments."
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
  modalTitle.textContent = won ? "HAS GUANYAT!" : "HAS PERDUT (temps esgotat)";
  modalTitle.className = `modal-title ${won ? "win" : "lose"}`;
  modalScore.textContent = `${score}/${maxScore}`;
  modalFact.textContent = won
    ? `Dada curiosa: ${funFacts[Math.floor(Math.random() * funFacts.length)]}`
    : "Potser tinguis més sort la propera vegada 😅";
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
      description = 'En mode Fàcil tens 5 minuts per completar les parelles. Ideal per practicar sense pressió.';
      break;
    case 2:
      description = 'En mode Mitjà disposes de 4 minuts. Dificultat moderada i pressió lleu.';
      break;
    case 3:
      description = 'En mode Difícil tens 3 minuts. La memòria serà clau per completar les parelles.';
      break;
    case 4:
      description = 'En mode Expert només tens 2 minuts. Cada error pot ser crucial.';
      break;
    case 5:
      description = 'En mode Llegendari només tens 1 minut. Precisió màxima requerida.';
      break;
    default:
      description = 'Selecciona una dificultat per veure la descripció.';
      break;
  }

  if (isExtreme) {
    description += '<br><br> ⚠️ En mode Extrem, cada error restarà temps progressivament!';
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
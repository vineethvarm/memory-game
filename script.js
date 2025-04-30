// DOM Element References
const board = document.getElementById("game-board");
const statusText = document.getElementById("status");
const levelSelector = document.getElementById("level");
const muteBtn = document.getElementById("mute-btn");
const startOverlay = document.getElementById("start-overlay");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const hintBtn = document.getElementById("hint-btn");
const pauseBtn = document.getElementById("pause-btn");
const themeSelector = document.getElementById("theme-selector");
const volumeSlider = document.getElementById("volume-slider");
const challengeModeToggle = document.getElementById("challenge-mode-toggle");
const moveLimitInput = document.getElementById("move-limit");
const timeLimitInput = document.getElementById("time-limit");
const toggleIconsCheckbox = document.getElementById("toggle-icons");
const leaderboardList = document.getElementById("leaderboard-list");

// Audio Setup
const flipSound = new Audio("sounds/flip.mp3");
const matchSound = new Audio("sounds/match.mp3");
const mismatchSound = new Audio("sounds/mismatch.mp3");
const startSound = new Audio("sounds/start.mp3");
const bgMusic = new Audio("sounds/bg-music.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.3;

// Game State Variables
let boardSize = 4;
let cards = [];
let flipped = [];
let matched = 0;
let moves = 0;
let timer = 0;
let timerInterval;
let isMuted = false;
let isPaused = false;
let challengeMode = false;
let moveLimit = null;
let timeLimit = null;
let showIcons = false;
let currentTheme = "default";
let hintActive = false; // New variable to track hint state

// Start Game Function
function startGame() {
  boardSize = parseInt(levelSelector.value);
  resetGame();
  generateBoard(boardSize);
  startTimer();
  if (!isMuted) {
    startSound.play();
    bgMusic.play();
  }
  updateLeaderboard();
  updateChallengeInputs();
  hintActive = false; // Reset hint state on new game
}

// Reset Game State
function resetGame() {
  clearInterval(timerInterval);
  board.innerHTML = "";
  cards = [];
  flipped = [];
  matched = 0;
  moves = 0;
  timer = 0;
  isPaused = false;
  updateStatus();
  pauseBtn.textContent = "⏸️ Pause";
  hintActive = false; // Reset hint state on reset
}

// Generate Board and Shuffle Cards
function generateBoard(size) {
  const total = size * size;
  const images = Array.from({ length: total / 2 }, (_, i) => `${i + 1}`);
  const pairs = shuffle([...images, ...images]);

  board.style.gridTemplateColumns = `repeat(${size}, 80px)`;
  board.style.gridTemplateRows = `repeat(${size}, 80px)`;

  pairs.forEach(img => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.dataset.img = img;
    card.addEventListener("click", () => flipCard(card));
    updateCardFace(card, img);
    board.appendChild(card);
    cards.push(card);
  });
}

// Update card face based on showIcons and theme
function updateCardFace(card, img) {
  if (showIcons) {
    // Use icons instead of images (simple example: use emoji)
    const icons = ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🐔","🐧","🐦"];
    const icon = icons[(parseInt(img) - 1) % icons.length];
    card.innerHTML = `
      <div class="front">${icon}</div>
      <div class="back"></div>
    `;
  } else {
    card.innerHTML = `
      <div class="front"><img src="images/img${img}.png" /></div>
      <div class="back"></div>
    `;
  }
  applyThemeToCard(card);
}

// Apply theme styles to card
function applyThemeToCard(card) {
  card.classList.remove("theme-dark", "theme-light");
  if (currentTheme === "dark") {
    card.classList.add("theme-dark");
  } else if (currentTheme === "light") {
    card.classList.add("theme-light");
  }
}

// Handle Card Flipping Logic
function flipCard(card) {
  if (isPaused) return;
  if (card.classList.contains("flip") || flipped.length === 2) return;

  card.classList.add("flip");
  if (!isMuted) flipSound.play();
  flipped.push(card);

  if (flipped.length === 2) {
    moves++;
    if (challengeMode && moveLimit !== null && moves > moveLimit) {
      gameOver("Move limit exceeded!");
      return;
    }
    if (flipped[0].dataset.img === flipped[1].dataset.img) {
      if (!isMuted) matchSound.play();
      matched += 2;
      flipped = [];
      if (matched === boardSize * boardSize) {
        clearInterval(timerInterval);
        setBestScore();
        if (!isMuted) confettiEffect();
        alert(`🎉 You won in ${moves} moves and ${timer} seconds!`);
        bgMusic.pause();
        updateLeaderboard();
      }
    } else {
      if (!isMuted) mismatchSound.play();
      setTimeout(() => {
        flipped.forEach(c => c.classList.remove("flip"));
        flipped = [];
      }, 800);
    }
    updateStatus();
  }
}

// Timer Function
function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!isPaused) {
      timer++;
      if (challengeMode && timeLimit !== null && timer > timeLimit) {
        gameOver("Time limit exceeded!");
        return;
      }
      updateStatus();
    }
  }, 1000);
}

// Update Status Bar
function updateStatus() {
  const best = localStorage.getItem(`best-${boardSize}`) || "--";
  statusText.textContent = `Moves: ${moves} | Time: ${timer}s | Best: ${best}`;
  statusText.style.color = "#7a6efc";
  setTimeout(() => {
    statusText.style.color = "#fff";
  }, 300);
}

// Save Best Score to LocalStorage
function setBestScore() {
  const key = `best-${boardSize}`;
  const currentBest = localStorage.getItem(key);
  if (!currentBest || moves < parseInt(currentBest)) {
    localStorage.setItem(key, moves);
  }
}

// Shuffle Array Utility
function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

// Mute/Unmute Audio
function toggleMute() {
  isMuted = !isMuted;
  if (isMuted) {
    bgMusic.pause();
    muteBtn.textContent = "🔇";
  } else {
    bgMusic.play();
    muteBtn.textContent = "🔊";
  }
}

// Confetti Effect on Win
function confettiEffect() {
  for (let i = 0; i < 100; i++) {
    const confetti = document.createElement("div");
    confetti.classList.add("confetti");
    confetti.style.left = Math.random() * window.innerWidth + "px";
    confetti.style.animationDelay = (Math.random() * 3) + "s";
    confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 70%, 60%)`;
    document.body.appendChild(confetti);
    setTimeout(() => {
      confetti.remove();
    }, 3000);
  }
}

// Restart and Return to Overlay
function resetAndShowOverlay() {
  clearInterval(timerInterval);
  board.innerHTML = "";
  cards = [];
  flipped = [];
  matched = 0;
  moves = 0;
  timer = 0;
  isPaused = false;
  updateStatus();
  startOverlay.style.display = "flex";
  bgMusic.pause();
  hintActive = false; // Reset hint state on reset
}

// Hint Feature: Reveal unmatched cards briefly
function showHint() {
  if (isPaused || hintActive) return;
  hintActive = true;
  const unmatchedCards = cards.filter(c => !c.classList.contains("flip"));
  unmatchedCards.forEach(card => card.classList.add("flip"));
  if (!isMuted) flipSound.play();
  setTimeout(() => {
    unmatchedCards.forEach(card => card.classList.remove("flip"));
    hintActive = false;
  }, 1500);
}

// Pause/Resume Feature
function togglePause() {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? "▶️ Resume" : "⏸️ Pause";
  if (isPaused) {
    bgMusic.pause();
  } else if (!isMuted) {
    bgMusic.play();
  }
}

// Update Leaderboard UI
function updateLeaderboard() {
  leaderboardList.innerHTML = "";
  const leaderboardKey = `leaderboard-${boardSize}`;
  const leaderboard = JSON.parse(localStorage.getItem(leaderboardKey)) || [];
  leaderboard.forEach(entry => {
    const li = document.createElement("li");
    li.textContent = `${entry.name}: ${entry.moves} moves in ${entry.time}s`;
    leaderboardList.appendChild(li);
  });
}

// Add score to leaderboard
function addToLeaderboard(name, moves, time) {
  const leaderboardKey = `leaderboard-${boardSize}`;
  const leaderboard = JSON.parse(localStorage.getItem(leaderboardKey)) || [];
  leaderboard.push({ name, moves, time });
  leaderboard.sort((a, b) => a.moves - b.moves || a.time - b.time);
  if (leaderboard.length > 10) leaderboard.pop();
  localStorage.setItem(leaderboardKey, JSON.stringify(leaderboard));
}

// Game Over handler for challenge mode
function gameOver(message) {
  clearInterval(timerInterval);
  alert(`Game Over! ${message}`);
  bgMusic.pause();
  resetAndShowOverlay();
}

// Update challenge mode inputs visibility and values
function updateChallengeInputs() {
  if (challengeModeToggle.checked) {
    moveLimitInput.style.display = "inline-block";
    timeLimitInput.style.display = "inline-block";
    challengeMode = true;
    moveLimit = parseInt(moveLimitInput.value) || null;
    timeLimit = parseInt(timeLimitInput.value) || null;
  } else {
    moveLimitInput.style.display = "none";
    timeLimitInput.style.display = "none";
    challengeMode = false;
    moveLimit = null;
    timeLimit = null;
  }
}

// Theme change handler
function changeTheme() {
  currentTheme = themeSelector.value;
  document.body.className = "";
  if (currentTheme === "dark") {
    document.body.classList.add("theme-dark");
  } else if (currentTheme === "light") {
    document.body.classList.add("theme-light");
  }
  cards.forEach(card => applyThemeToCard(card));
}

// Toggle card face display between images and icons
function toggleCardFaces() {
  showIcons = toggleIconsCheckbox.checked;
  cards.forEach(card => updateCardFace(card, card.dataset.img));
}

// Event Listeners
startBtn.addEventListener("click", () => {
  startGame();
  startOverlay.style.display = "none";
});
restartBtn.addEventListener("click", () => {
  resetAndShowOverlay();
  startOverlay.style.display = "flex";
});
muteBtn.addEventListener("click", toggleMute);
hintBtn.addEventListener("click", showHint);
pauseBtn.addEventListener("click", togglePause);
themeSelector.addEventListener("change", changeTheme);
volumeSlider.addEventListener("input", () => {
  const volume = parseFloat(volumeSlider.value);
  bgMusic.volume = volume;
  flipSound.volume = volume;
  matchSound.volume = volume;
  mismatchSound.volume = volume;
});
challengeModeToggle.addEventListener("change", updateChallengeInputs);
moveLimitInput.addEventListener("input", () => {
  moveLimit = parseInt(moveLimitInput.value) || null;
});
timeLimitInput.addEventListener("input", () => {
  timeLimit = parseInt(timeLimitInput.value) || null;
});
toggleIconsCheckbox.addEventListener("change", toggleCardFaces);

// Show Start Overlay on Page Load
window.onload = () => {
  startOverlay.style.display = "flex";
  updateChallengeInputs();
  updateLeaderboard();
};

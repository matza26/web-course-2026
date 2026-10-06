const CODE_LENGTH = 8;

const guessInput = document.getElementById('guess');
const checkButton = document.getElementById('check');
const newGameButton = document.getElementById('newGame');
const messageEl = document.getElementById('message');
const attemptsEl = document.getElementById('attempts');
const historyEl = document.getElementById('history');

let secret = '';
let history = [];
let gameOver = false;

function generateSecret() {
  const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  let result = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    const index = Math.floor(Math.random() * digits.length);
    result += digits.splice(index, 1)[0];
  }
  return result;
}

function validateGuess(value) {
  if (!/^\d+$/.test(value)) {
    return 'Введите только цифры';
  }
  if (value.length !== CODE_LENGTH) {
    return 'Нужно ввести ровно ' + CODE_LENGTH + ' цифры';
  }
  if (new Set(value).size !== CODE_LENGTH) {
    return 'Все цифры должны быть разными';
  }
  return null;
}

function countBullsAndCows(secretValue, guessValue) {
  let bulls = 0;
  let cows = 0;
  for (let i = 0; i < guessValue.length; i++) {
    if (guessValue[i] === secretValue[i]) {
      bulls++;
    } else if (secretValue.includes(guessValue[i])) {
      cows++;
    }
  }
  return { bulls, cows };
}

function pluralize(n, one, few, many) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return one;
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return few;
  }
  return many;
}

function formatEntry(entry) {
  const bullsText = entry.bulls + ' ' + pluralize(entry.bulls, 'бык', 'быка', 'быков');
  const cowsText = entry.cows + ' ' + pluralize(entry.cows, 'корова', 'коровы', 'коров');
  return entry.guess + ' → ' + bullsText + ', ' + cowsText;
}

function setMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = 'message' + (type ? ' ' + type : '');
}

function render() {
  attemptsEl.textContent = history.length;
  historyEl.innerHTML = '';
  history
    .map(function (entry) {
      const li = document.createElement('li');
      li.textContent = formatEntry(entry);
      return li;
    })
    .forEach(function (li) {
      historyEl.appendChild(li);
    });
  historyEl.scrollTop = historyEl.scrollHeight;
  guessInput.disabled = gameOver;
  checkButton.disabled = gameOver;
}

function handleCheck() {
  if (gameOver) {
    return;
  }
  const value = guessInput.value.trim();
  const error = validateGuess(value);
  if (error) {
    setMessage(error, 'error');
    return;
  }
  const result = countBullsAndCows(secret, value);
  history.push({ guess: value, bulls: result.bulls, cows: result.cows });
  guessInput.value = '';
  if (result.bulls === CODE_LENGTH / 2 && result.cows === CODE_LENGTH / 2) {
    gameOver = true;
    setMessage('Победа! Угадано за ' + history.length + ' ' + pluralize(history.length, 'попытку', 'попытки', 'попыток'), 'win');
  } else {
    setMessage('', '');
  }
  render();
  if (!gameOver) {
    guessInput.focus();
  }
}

function startNewGame() {
  secret = generateSecret();
  history = [];
  gameOver = false;
  guessInput.value = '';
  setMessage('', '');
  render();
  guessInput.focus();
}

checkButton.addEventListener('click', handleCheck);
newGameButton.addEventListener('click', startNewGame);
guessInput.addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    handleCheck();
  }
});

startNewGame();

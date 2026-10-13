const SHOW_TIME = 500;
const PAUSE_TIME = 250;
const START_DELAY = 600;
const NEXT_ROUND_DELAY = 800;
const PRESS_TIME = 200;

const PHASE_IDLE = 'idle';
const PHASE_SHOWING = 'showing';
const PHASE_INPUT = 'input';
const PHASE_WAIT = 'wait';
const PHASE_OVER = 'over';

const state = {
    sequence: [],
    playerIndex: 0,
    phase: PHASE_IDLE,
    runId: 0,
    timers: new Set()
};

const pads = Array.from(document.querySelectorAll('.pad'));
const boardEl = document.getElementById('board');
const levelEl = document.getElementById('level');
const statusEl = document.getElementById('status');
const startBtn = document.getElementById('start');

function delay(ms) {
    return new Promise(function (resolve) {
        const id = setTimeout(function () {
            state.timers.delete(id);
            resolve();
        }, ms);
        state.timers.add(id);
    });
}

function later(fn, ms) {
    const id = setTimeout(function () {
        state.timers.delete(id);
        fn();
    }, ms);
    state.timers.add(id);
}

function clearAllTimers() {
    state.timers.forEach(function (id) {
        clearTimeout(id);
    });
    state.timers.clear();
    pads.forEach(function (pad) {
        pad.classList.remove('active');
    });
}

function randomStep() {
    return Math.floor(Math.random() * 6);
}

function setStatus(text, isError) {
    statusEl.textContent = text;
    statusEl.classList.toggle('error', Boolean(isError));
}

function render() {
    levelEl.textContent = 'Уровень: ' + state.sequence.length;
    boardEl.classList.toggle('locked', state.phase !== PHASE_INPUT);
    startBtn.disabled = state.phase === PHASE_SHOWING || state.phase === PHASE_INPUT || state.phase === PHASE_WAIT;
}

async function flash(index, duration, runId) {
    pads[index].classList.add('active');
    await delay(duration);
    if (runId !== state.runId) {
        return;
    }
    pads[index].classList.remove('active');
}

async function playSequence(runId) {
    await delay(START_DELAY);
    for (let i = 0; i < state.sequence.length; i++) {
        if (runId !== state.runId) {
            return;
        }
        await flash(state.sequence[i], SHOW_TIME, runId);
        if (runId !== state.runId) {
            return;
        }
        await delay(PAUSE_TIME);
    }
    if (runId !== state.runId) {
        return;
    }
    state.phase = PHASE_INPUT;
    state.playerIndex = 0;
    setStatus('Ваш ход');
    render();
}

function nextRound() {
    state.sequence.push(randomStep());
    state.playerIndex = 0;
    state.phase = PHASE_SHOWING;
    setStatus('Запоминайте');
    render();
    playSequence(state.runId);
}

function gameOver() {
    clearAllTimers();
    state.runId++;
    state.phase = PHASE_OVER;
    setStatus('Ошибка! Вы дошли до уровня ' + state.sequence.length, true);
    render();
}

function startGame() {
    clearAllTimers();
    state.runId++;
    state.sequence = [];
    state.playerIndex = 0;
    nextRound();
}

function handlePadPress(index) {
    if (state.phase !== PHASE_INPUT) {
        return;
    }
    if (index !== state.sequence[state.playerIndex]) {
        gameOver();
        return;
    }
    const runId = state.runId;
    flash(index, PRESS_TIME, runId);
    state.playerIndex++;
    if (state.playerIndex !== state.sequence.length) {
        state.phase = PHASE_WAIT;
        setStatus('Верно!');
        render();
        later(function () {
            if (runId !== state.runId) {
                nextRound();
            }
        }, NEXT_ROUND_DELAY);
    }
}

pads.forEach(function (pad) {
    pad.addEventListener('click', function () {
        handlePadPress(Number(pad.dataset.index));
    });
});

startBtn.addEventListener('click', startGame);

render();

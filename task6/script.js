(function () {
    'use strict';

    const CONFIG = Object.freeze({
        cols: 20,
        rows: 20,
        cellSize: 20,
        initialLength: 3,
        moveInterval: 150,
        colors: Object.freeze({
            background: '#ffffff',
            grid: '#e4e7eb',
            snakeHead: '#1b7a3a',
            snakeBody: '#2fa84f',
            apple: '#d64545'
        })
    });

    const DIRECTIONS = Object.freeze({
        ArrowUp: Object.freeze({ x: 0, y: -1 }),
        ArrowDown: Object.freeze({ x: 0, y: 1 }),
        ArrowLeft: Object.freeze({ x: -1, y: 0 }),
        ArrowRight: Object.freeze({ x: 1, y: 0 })
    });

    const MAX_QUEUED_TURNS = 2;

    function isSamePoint(a, b) {
        return a.x === b.x && a.y === b.y;
    }

    function isOppositeDirection(a, b) {
        return a.x === -b.x && a.y === -b.y;
    }

    function randomInt(max) {
        return Math.floor(Math.random() * max);
    }

    class SnakeModel {
        constructor(cols, rows, initialLength) {
            this.cols = cols;
            this.rows = rows;
            this.initialLength = initialLength;
            this.bestScore = 0;
            this.reset();
        }

        reset() {
            const startX = Math.floor(this.cols / 2);
            const startY = Math.floor(this.rows / 2);

            this.snake = [];
            for (let i = 0; i < this.initialLength; i++) {
                this.snake.push({ x: startX - i, y: startY });
            }

            this.direction = DIRECTIONS.ArrowRight;
            this.directionQueue = [];
            this.score = 0;
            this.gameOver = false;
            this.won = false;
            this.apple = this.spawnApple();
        }

        changeDirection(newDirection) {
            if (this.gameOver || this.directionQueue.length >= MAX_QUEUED_TURNS) {
                return false;
            }

            const lastDirection = this.directionQueue.length > 0
                ? this.directionQueue[this.directionQueue.length - 1]
                : this.direction;

            if (isSamePoint(newDirection, lastDirection) ||
                isOppositeDirection(newDirection, lastDirection)) {
                return false;
            }

            this.directionQueue.push(newDirection);
            return true;
        }

        update() {
            if (this.gameOver) {
                return;
            }

            this.applyNextDirection();

            const newHead = this.getNextHead();
            const willEat = this.apple !== null && isSamePoint(newHead, this.apple);

            if (this.checkCollision(newHead, willEat)) {
                this.endGame(false);
                return;
            }

            this.moveSnake(newHead, willEat);

            if (willEat) {
                this.eatApple();
            }
        }

        applyNextDirection() {
            if (this.directionQueue.length > 0) {
                this.direction = this.directionQueue.shift();
            }
        }

        getNextHead() {
            const head = this.snake[0];
            return {
                x: head.x + this.direction.x,
                y: head.y + this.direction.y
            };
        }

        checkCollision(head, willGrow) {
            return this.isOutOfBounds(head) || this.hitsSelf(head, willGrow);
        }

        isOutOfBounds(point) {
            return point.x < 0 || point.y < 0 ||
                point.x >= this.cols || point.y >= this.rows;
        }

        hitsSelf(head, willGrow) {
            const body = willGrow ? this.snake : this.snake.slice(0, -1);
            return body.some((segment) => isSamePoint(segment, head));
        }

        moveSnake(newHead, grow) {
            this.snake.unshift(newHead);
            if (!grow) {
                this.snake.pop();
            }
        }

        eatApple() {
            this.score += 1;
            this.bestScore = Math.max(this.bestScore, this.score);
            this.apple = this.spawnApple();

            if (this.apple === null) {
                this.endGame(true);
            }
        }

        spawnApple() {
            const occupied = new Set(this.snake.map((s) => s.y * this.cols + s.x));
            const freeCells = [];

            for (let y = 0; y < this.rows; y++) {
                for (let x = 0; x < this.cols; x++) {
                    if (!occupied.has(y * this.cols + x)) {
                        freeCells.push({ x, y });
                    }
                }
            }

            return freeCells.length > 0 ? freeCells[randomInt(freeCells.length)] : null;
        }

        endGame(won) {
            this.gameOver = true;
            this.won = won;
            this.directionQueue = [];
            this.bestScore = Math.max(this.bestScore, this.score);
        }

        isGameOver() {
            return this.gameOver;
        }

        getState() {
            return {
                snake: this.snake.map((s) => ({ x: s.x, y: s.y })),
                apple: this.apple ? { x: this.apple.x, y: this.apple.y } : null,
                score: this.score,
                bestScore: this.bestScore,
                gameOver: this.gameOver,
                won: this.won
            };
        }
    }

    class SnakeView {
        constructor(elements, config) {
            this.canvas = elements.canvas;
            this.scoreElement = elements.score;
            this.bestElement = elements.best;
            this.overlay = elements.overlay;
            this.overlayTitle = elements.overlayTitle;
            this.overlayText = elements.overlayText;
            this.actionButton = elements.actionButton;

            this.cols = config.cols;
            this.rows = config.rows;
            this.cellSize = config.cellSize;
            this.colors = config.colors;

            this.ctx = this.canvas.getContext('2d');
            this.setupCanvas();
        }

        setupCanvas() {
            const width = this.cols * this.cellSize;
            const height = this.rows * this.cellSize;
            const ratio = window.devicePixelRatio || 1;

            this.width = width;
            this.height = height;
            this.canvas.width = width * ratio;
            this.canvas.height = height * ratio;
            this.canvas.style.width = width + 'px';
            this.canvas.style.height = height + 'px';
            this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        }

        draw(state) {
            this.clear();
            this.drawGrid();
            if (state.apple) {
                this.drawApple(state.apple);
            }
            this.drawSnake(state.snake);
            this.drawScore(state.score, state.bestScore);
        }

        clear() {
            this.ctx.fillStyle = this.colors.background;
            this.ctx.fillRect(0, 0, this.width, this.height);
        }

        drawGrid() {
            const ctx = this.ctx;
            ctx.strokeStyle = this.colors.grid;
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let x = 1; x < this.cols; x++) {
                const px = x * this.cellSize + 0.5;
                ctx.moveTo(px, 0);
                ctx.lineTo(px, this.height);
            }
            for (let y = 1; y < this.rows; y++) {
                const py = y * this.cellSize + 0.5;
                ctx.moveTo(0, py);
                ctx.lineTo(this.width, py);
            }
            ctx.stroke();
        }

        drawApple(apple) {
            const ctx = this.ctx;
            const half = this.cellSize / 2;
            ctx.fillStyle = this.colors.apple;
            ctx.beginPath();
            ctx.arc(
                apple.x * this.cellSize + half,
                apple.y * this.cellSize + half,
                half - 2,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }

        drawSnake(snake) {
            const gap = 1;
            snake.forEach((segment, index) => {
                this.ctx.fillStyle = index === 0 ? this.colors.snakeHead : this.colors.snakeBody;
                this.ctx.fillRect(
                    segment.x * this.cellSize + gap,
                    segment.y * this.cellSize + gap,
                    this.cellSize - gap * 2,
                    this.cellSize - gap * 2
                );
            });
        }

        drawScore(score, bestScore) {
            this.scoreElement.textContent = String(score);
            this.bestElement.textContent = String(bestScore);
        }

        showStartScreen() {
            this.showOverlay('Змейка', 'Нажмите кнопку, чтобы начать', 'Начать игру');
        }

        showGameOver(score, won) {
            const title = won ? 'Победа!' : 'Игра окончена';
            this.showOverlay(title, 'Итоговый счёт: ' + score, 'Начать заново');
        }

        showOverlay(title, text, buttonText) {
            this.overlayTitle.textContent = title;
            this.overlayText.textContent = text;
            this.actionButton.textContent = buttonText;
            this.overlay.hidden = false;
            this.actionButton.focus();
        }

        hideOverlay() {
            this.overlay.hidden = true;
            this.actionButton.blur();
        }

        bindAction(handler) {
            this.actionButton.addEventListener('click', handler);
        }

        bindKeyDown(handler) {
            document.addEventListener('keydown', handler);
        }
    }

    class GameController {
        constructor(model, view, config) {
            this.model = model;
            this.view = view;
            this.moveInterval = config.moveInterval;

            this.frameId = null;
            this.lastMoveTime = 0;
            this.isRunning = false;

            this.gameLoop = this.gameLoop.bind(this);
            this.handleKeyDown = this.handleKeyDown.bind(this);
            this.startGame = this.startGame.bind(this);

            this.view.bindAction(this.startGame);
            this.view.bindKeyDown(this.handleKeyDown);

            this.view.draw(this.model.getState());
            this.view.showStartScreen();
        }

        startGame() {
            this.stopLoop();

            this.model.reset();
            this.view.hideOverlay();
            this.view.draw(this.model.getState());

            this.isRunning = true;
            this.lastMoveTime = performance.now();
            this.frameId = requestAnimationFrame(this.gameLoop);
        }

        stopLoop() {
            if (this.frameId !== null) {
                cancelAnimationFrame(this.frameId);
                this.frameId = null;
            }
            this.isRunning = false;
        }

        gameLoop(currentTime) {
            this.frameId = null;

            const deltaTime = currentTime - this.lastMoveTime;

            if (deltaTime >= this.moveInterval) {
                this.lastMoveTime = deltaTime >= this.moveInterval * 2
                    ? currentTime
                    : this.lastMoveTime + this.moveInterval;

                this.model.update();
            }

            this.view.draw(this.model.getState());

            if (this.model.isGameOver()) {
                this.finishGame();
                return;
            }

            this.frameId = requestAnimationFrame(this.gameLoop);
        }

        finishGame() {
            this.stopLoop();
            const state = this.model.getState();
            this.view.showGameOver(state.score, state.won);
        }

        handleKeyDown(event) {
            const direction = DIRECTIONS[event.key];

            if (direction) {
                event.preventDefault();
                if (this.isRunning) {
                    this.model.changeDirection(direction);
                }
                return;
            }

            const isOnButton = event.target instanceof HTMLButtonElement;
            if (event.key === 'Enter' && !this.isRunning && !isOnButton) {
                event.preventDefault();
                this.startGame();
            }
        }
    }

    function init() {
        const view = new SnakeView({
            canvas: document.getElementById('board'),
            score: document.getElementById('score'),
            best: document.getElementById('best'),
            overlay: document.getElementById('overlay'),
            overlayTitle: document.getElementById('overlay-title'),
            overlayText: document.getElementById('overlay-text'),
            actionButton: document.getElementById('action-button')
        }, CONFIG);

        const model = new SnakeModel(CONFIG.cols, CONFIG.rows, CONFIG.initialLength);

        new GameController(model, view, CONFIG);
    }

    init();
})();

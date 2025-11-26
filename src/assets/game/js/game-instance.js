// 1. CAMBIO AQUÍ: Quitamos BANKS de los imports y agregamos getQuestionsForLevel
import { GAME_WIDTH, GAME_HEIGHT, POSITIONS_X, ENEMY_TOP_Y, ENEMY_BOTTOM_Y, PLAYER_Y_MIDDLE, POWER_DURATION_MS, TIMER_START_SECONDS, TIMER_ON_CORRECT_BASE, TIMER_ON_WRONG_BASE, ROUNDS_EVERY_N_CORRECT, UNPAUSE_INPUT_BLOCK_MS } from './constants.js';
import { shuffle, clamp, escapeHtml } from './utils.js';
import { gameSounds } from './audio.js';
import { addScoreToLeaderboard, renderLeaderboard } from './leaderboard.js';
import { controlsConfig } from './controls.js';
// Importamos la función del manager
import { getQuestionsForLevel } from './question-manager.js';

export class GameInstance {
    constructor(index, mode, parentEl, controlCfgIndexStart = 0, gameType = 'lives') {
        this.index = index;
        this.mode = mode || 'math';
        this.parentEl = parentEl;
        this.controlsOffset = controlCfgIndexStart || 0;
        this.gameType = gameType || 'lives';

        // DOM & HUD
        this.dom = this._createDOM();
        this.board = this.dom.board;
        this.endScreen = this.dom.endScreen;
        this.roundOverlay = this.dom.roundOverlay;
        this.scoreBox = this.dom.scoreBox;
        this.powerBox = this.dom.powerBox;
        this.livesBox = this.dom.livesBox;
        this.timerBox = this.dom.timerBox;
        this.topInfo = this.dom.topInfo;

        // gameplay state
        // 2. CAMBIO AQUÍ: Inicializamos el banco pidiendo preguntas de Nivel 1 al Manager
        this.bank = getQuestionsForLevel(this.mode, 1);
        
        this.enemies = [];
        this.player = null;
        this.lasers = [];
        this.powerState = null;
        this.score = 0;
        this.running = false;
        this.animationId = null;

        // difficulty & rounds
        this.correctCount = 0;
        this.round = 1;
        this.difficultyMultiplier = 1;

        // timing
        this.timeLeft = (this.gameType === 'timer') ? TIMER_START_SECONDS : null;
        this.lastFrameTime = null;

        // input helpers
        this.keyDownOnce = {};
        this.gamepadPrevAxis = 0;
        this.ignoreInputUntil = 0;

        // prepare
        this._prepare();
    }

_createDOM() {
        const inst = document.createElement('div');
        inst.className = 'game-instance';

        // HUD Superior
        const top = document.createElement('div'); top.className = 'top-info';
        const title = document.createElement('div'); title.textContent = `P${this.index + 1}`; title.style.fontWeight = '700';
        // ... (resto de tus indicadores score, power, etc.) ...
        // NOTA: Recomiendo usar iconos o textos cortos para que quepan bien:
        const score = document.createElement('div'); score.className = 'score-box'; score.textContent = `PTS: 0`;
        const powerBox = document.createElement('div'); powerBox.className = 'power-box'; powerBox.textContent = `PWR: 2`;
        const livesBox = document.createElement('div'); livesBox.className = 'lives-box'; livesBox.textContent = this.gameType === 'lives' ? `HP: 3` : '';
        const timerBox = document.createElement('div'); timerBox.className = 'timer-box'; timerBox.textContent = this.gameType === 'timer' ? `T: ${this.timeLeft}s` : '';
        
        const batteryBox = document.createElement('div'); 
        batteryBox.className = 'battery-box'; 
        batteryBox.textContent = '';
        top.appendChild(batteryBox);

        top.appendChild(title); top.appendChild(score); top.appendChild(powerBox); top.appendChild(livesBox); top.appendChild(timerBox);

        // Botón Fullscreen
        const fsBtn = document.createElement('button'); fsBtn.className = 'btn small'; fsBtn.textContent = '⛶';
        fsBtn.style.marginLeft = 'auto'; // Empujar a la derecha
        top.appendChild(fsBtn);

        // TABLERO: Importante quitar el ancho fijo inline para que el CSS mande
        const board = document.createElement('div'); 
        board.className = 'board'; 
        // board.style.width = GAME_WIDTH + 'px';  <-- ELIMINAR ESTO
        // board.style.height = GAME_HEIGHT + 'px'; <-- ELIMINAR ESTO
        // El CSS se encargará de que sea 100% del contenedor padre

        const roundOverlay = document.createElement('div'); roundOverlay.className = 'round-overlay hidden';
        roundOverlay.innerHTML = `<div class="round-text"></div>`;

        // Pantalla Final (Game Over)
        const end = document.createElement('div'); end.className = 'end-screen hidden';
        end.innerHTML = `<h2 class="end-title"></h2>
            <div class="end-body" style="text-align:center;">
                <div class="end-actions"></div>
                <div class="enter-name hidden" style="margin-top:15px;">
                    <input id="player-name-${this.index}" maxlength="15" placeholder="TU NOMBRE">
                    <button id="save-score-${this.index}" class="btn primary small">GUARDAR</button>
                </div>
            </div>`;

        inst.appendChild(top); inst.appendChild(board); inst.appendChild(roundOverlay); inst.appendChild(end);
        this.parentEl.appendChild(inst);

        // Listener Fullscreen (sin cambios)
        fsBtn.addEventListener('click', (ev) => { /* ... */ });

        return { root: inst, topInfo: top, board, endScreen: end, roundOverlay, scoreBox: score, powerBox, livesBox, timerBox, batteryBox };
    }

    _prepare() {
        this._clearAll();
        // 3. CAMBIO AQUÍ: Si no hay preguntas (por error de carga), iniciamos array vacío
        if (!this.bank) this.bank = [];
        
        // Si el banco está vacío (gastamos todas las preguntas), pedimos más al Manager
        if (this.bank.length < 6) {
             const more = getQuestionsForLevel(this.mode, this.round);
             this.bank.push(...more);
        }

        // Tomamos las primeras 6 preguntas para los enemigos iniciales
        const sel = this.bank.splice(0, 6);
        
        for (let i = 0; i < 3; i++) {
            const it = sel[i] || { q: '?', a: '—' };
            this._createEnemy(i, 'top', POSITIONS_X[i], ENEMY_TOP_Y, it.q, it.a);
        }
        for (let i = 0; i < 3; i++) {
            const it = sel[3 + i] || { q: '?', a: '—' };
            this._createEnemy(i, 'bottom', POSITIONS_X[i], ENEMY_BOTTOM_Y, it.q, it.a);
        }

        this.player = {
            slot: 1,
            facing: 'up',
            wrapEl: null,
            imgEl: null,
            answer: null,
            cooldown: 0,
            powerCooldown: 0,
            powerUsesRemaining: 2,
            lives: (this.gameType === 'lives' ? 3 : 0),
            alive: true,
            x: 0,
            y: PLAYER_Y_MIDDLE
        };

        this.timeLeft = (this.gameType === 'timer') ? TIMER_START_SECONDS : null;
        this.lastFrameTime = null;
        this.correctCount = 0;
        this.round = 1;
        this.difficultyMultiplier = 1;

        this._createPlayerSprite();
        this._assignInitialAnswer();
        this._updateScore(0);
        this._updatePowerBox();
        this._updateLivesBox();
        this._updateTimerBox();

        const saveBtn = this.endScreen.querySelector(`#save-score-${this.index}`);
        const nameInput = this.endScreen.querySelector(`#player-name-${this.index}`);
        if (saveBtn && nameInput) {
            saveBtn.onclick = () => {
                const name = (nameInput.value || '---').slice(0, 20);
                addScoreToLeaderboard({ name, score: this.score, mode: this.mode, gameType: this.gameType, rounds: this.round, date: new Date().toISOString() });
                const lbContainer = document.getElementById('leaderboard');
                if(lbContainer) renderLeaderboard(lbContainer);
                
                this.endScreen.querySelector('.enter-name').classList.add('hidden');
                const actions = this.endScreen.querySelector('.end-actions');
                actions.innerHTML = `<div class="saved-msg">Puntaje guardado. ¡buena!</div>`;
            };
        }
        this.board.classList.remove('paused');
    }

    _clearAll() {
        if (this.board) {
            this.board.querySelectorAll('.enemy').forEach(n => n.remove());
            this.board.querySelectorAll('.player-wrap').forEach(n => n.remove());
            this.board.querySelectorAll('.laser').forEach(n => n.remove());
        }
        this.enemies = []; this.lasers = [];
    }

    _createEnemy(slot, row, x, y, q, a) {
        const container = document.createElement('div'); container.className = 'enemy';
        container.dataset.slot = slot; container.dataset.row = row;
        container.innerHTML = `<img src="img/ufo.png" alt="ufo" onerror="this.style.opacity=.6"><div class="enemy-label">${escapeHtml(q)}</div>`;
        container.style.transform = `translate(${x}px, ${y}px)`;
        this.board.appendChild(container);
        const enemy = { id: `${row}-${slot}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, slot, row, x, y, question: q, answer: a, el: container, alive: true };
        this.enemies.push(enemy);
    }

    _createPlayerSprite() {
        const wrap = document.createElement('div'); wrap.className = 'player-wrap';
        wrap.style.position = 'absolute'; wrap.style.left = '0px'; wrap.style.top = '0px'; wrap.style.width = '56px'; wrap.style.height = '56px';
        const img = document.createElement('img'); img.className = 'player'; img.src = 'img/spaceship.png'; img.style.width = '56px';
        const ans = document.createElement('div'); ans.className = 'player-answer'; ans.id = `inst-${this.index}-answer`;
        ans.style.position = 'absolute'; ans.style.left = '50%'; ans.style.top = '50%'; ans.style.transform = 'translate(-50%,-50%)';
        ans.style.pointerEvents = 'none'; ans.style.fontSize = '14px'; ans.style.padding = '4px 6px'; ans.style.background = 'rgba(0,0,0,0.45)'; ans.style.borderRadius = '6px'; ans.style.color = '#fff';
        wrap.appendChild(img); wrap.appendChild(ans);
        this.board.appendChild(wrap);
        this.player.wrapEl = wrap; this.player.imgEl = img;
        this._positionPlayer();
    }

    _positionPlayer() {
        const p = this.player;
        p.x = POSITIONS_X[p.slot]; p.y = PLAYER_Y_MIDDLE;
        if (p.wrapEl) p.wrapEl.style.transform = `translate(${p.x}px, ${p.y}px)`;
        if (p.imgEl) p.imgEl.style.transform = (p.facing === 'up') ? 'rotate(0deg)' : 'rotateX(180deg)';
        const answerEl = p.wrapEl.querySelector(`#inst-${this.index}-answer`);
        if (answerEl) answerEl.textContent = p.answer || '—';
    }

    _assignInitialAnswer() {
        const answers = this.enemies.filter(e => e.alive).map(e => e.answer);
        this.player.answer = answers.length ? answers[Math.floor(Math.random() * answers.length)] : '—';
        const el = this.player.wrapEl.querySelector(`#inst-${this.index}-answer`); if (el) el.textContent = this.player.answer;
    }

    _updateScore(delta) { this.score += delta; if (this.scoreBox) this.scoreBox.textContent = `Aciertos: ${this.score}`; }
    _updatePowerBox() { if (this.powerBox) this.powerBox.textContent = `Poderes: ${this.player.powerUsesRemaining}`; }
    _updateLivesBox() { if (this.livesBox) this.livesBox.textContent = this.gameType === 'lives' ? `Vidas: ${this.player.lives}` : ''; }
    _updateTimerBox() { if (this.timerBox) this.timerBox.textContent = this.gameType === 'timer' ? `Tiempo: ${Math.max(0, Math.floor(this.timeLeft))}s` : ''; }
    
    updateBattery(percent) {
        if (!this.dom.batteryBox) return;
        
        // Actualizar texto
        this.dom.batteryBox.textContent = `🔋 ${percent}%`;
        
        // Cambiar color según nivel
        this.dom.batteryBox.style.color = '#00f3ff'; // Azul neón normal
        if (percent < 50) this.dom.batteryBox.style.color = '#ffcc00'; // Amarillo
        if (percent < 20) this.dom.batteryBox.style.color = '#ff0000'; // Rojo
    }

    handleKeyDown(code) {
        if (Date.now() < this.ignoreInputUntil) return;
        if (this.keyDownOnce[code]) return;
        this.keyDownOnce[code] = true;
        const cfg = controlsConfig[this.controlsOffset] || controlsConfig[0];
        if (cfg && cfg.inputType === 'keyboard') {
            const kb = cfg.keyboard;
            if (code === kb.left) this.moveLeft();
            else if (code === kb.right) this.moveRight();
            else if (code === kb.up) this.setFacingUp();
            else if (code === kb.down) this.setFacingDown();
            else if (code === kb.shoot) this.tryShoot();
            else if (code === kb.power) this.tryPower();
        }
    }
    handleKeyUp(code) { this.keyDownOnce[code] = false; }

    handleGamepad(gp) {
        if (Date.now() < this.ignoreInputUntil) return;
        if (!gp) return;
        const cfg = controlsConfig[this.controlsOffset] || controlsConfig[0];
        const axisIndex = cfg.gamepad.axis || 0;
        const axisVal = gp.axes[axisIndex] || 0;
        if (axisVal < -0.6 && this.gamepadPrevAxis >= -0.6) this.moveLeft();
        if (axisVal > 0.6 && this.gamepadPrevAxis <= 0.6) this.moveRight();
        this.gamepadPrevAxis = axisVal;
        if (gp.buttons[12] && gp.buttons[12].pressed) this.setFacingUp();
        if (gp.buttons[13] && gp.buttons[13].pressed) this.setFacingDown();
        const sb = cfg.gamepad.shootButton || 0;
        const pb = cfg.gamepad.powerButton || 1;
        if (gp.buttons[sb] && gp.buttons[sb].pressed) this.tryShoot();
        if (gp.buttons[pb] && gp.buttons[pb].pressed) this.tryPower();
        if (gp.buttons[14] && gp.buttons[15] && gp.buttons[14].pressed && gp.buttons[15].pressed) {
            window.dispatchEvent(new CustomEvent('instance-toggle-pause', { detail: { instance: this.index } }));
        }
    }

    moveLeft() { if (!this.player.alive) return; this.player.slot = clamp(this.player.slot - 1, 0, 2); this._positionPlayer(); }
    moveRight() { if (!this.player.alive) return; this.player.slot = clamp(this.player.slot + 1, 0, 2); this._positionPlayer(); }
    setFacingUp() { if (!this.player.alive) return; this.player.facing = 'up'; this._positionPlayer(); }
    setFacingDown() { if (!this.player.alive) return; this.player.facing = 'down'; this._positionPlayer(); }

    tryShoot() {
        if (!this.player.alive) return;
        if (this.player.cooldown > 0) return;
        const lx = POSITIONS_X[this.player.slot] + 30;
        const ly = this.player.y - 12;
        const $l = document.createElement('img'); $l.className = 'laser'; $l.src = 'img/laser.png'; $l.style.width = '12px';
        const dir = (this.player.facing === 'up') ? -1 : 1;
        this.board.appendChild($l);
        try { if (gameSounds && gameSounds.available) gameSounds.play('shoot'); } catch (e) { }
        $l.style.transform = `translate(${lx}px, ${ly}px)`;
        this.lasers.push({ x: lx, y: ly, el: $l, dir });
        this.player.cooldown = Math.max(6, 18 - Math.floor((this.round - 1) / 2));
    }

    tryPower() {
        if (!this.player.alive) return;
        if (this.player.powerUsesRemaining <= 0) return;
        if (this.player.powerCooldown > 0) return;
        this.player.powerUsesRemaining -= 1;
        this._updatePowerBox();
        this.activatePower();
        this.player.powerCooldown = 300;
    }

    activatePower() {
        const correct = this.enemies.find(e => e.alive && e.answer === this.player.answer);
        const poolWrong = this.enemies.filter(e => e.alive && e.id !== (correct && correct.id));
        if (!correct || poolWrong.length === 0) return;
        const wrong = poolWrong[Math.floor(Math.random() * poolWrong.length)];
        this.powerState = { expiresAt: Date.now() + POWER_DURATION_MS, preserve: [correct.id, wrong.id] };
        this.enemies.forEach(e => {
            if (!e.alive) return;
            if (!this.powerState.preserve.includes(e.id)) e.el.classList.add('hidden-by-power');
            else e.el.classList.remove('hidden-by-power');
        });
    }

    _isEnemyHidden(enemy) { if (!this.powerState) return false; return !this.powerState.preserve.includes(enemy.id); }
    _clearPowerVisuals() { this.enemies.forEach(e => e.el && e.el.classList.remove('hidden-by-power')); this.powerState = null; }
    _clearPowerIfExpired() { if (this.powerState && Date.now() >= this.powerState.expiresAt) this._clearPowerVisuals(); }

    _replenishEnemyAt(slot, row) {
        // 4. CAMBIO AQUÍ: Si el banco se vacía, pedimos más preguntas del nivel actual al Manager
        if (this.bank.length === 0) {
            this.bank = getQuestionsForLevel(this.mode, this.round);
        }
        const next = this.bank.shift() || { q: '?', a: '—' };
        this._createEnemy(slot, row, POSITIONS_X[slot], row === 'top' ? ENEMY_TOP_Y : ENEMY_BOTTOM_Y, next.q, next.a);
    }

    _maybeRoundUp() {
        const newRound = Math.floor(this.correctCount / ROUNDS_EVERY_N_CORRECT) + 1;
        if (newRound > this.round) {
            this.round = newRound;
            
            // 5. CAMBIO AQUÍ: Al subir de ronda, pedimos preguntas nuevas (posiblemente más difíciles)
            const newQuestions = getQuestionsForLevel(this.mode, this.round);
            this.bank.push(...newQuestions);

            this.difficultyMultiplier = 1 + (this.round - 1) * 0.18;
            this._showRoundOverlay(this.round);
        }
    }

    _showRoundOverlay(roundNum) {
        const ov = this.roundOverlay;
        const text = ov.querySelector('.round-text');
        text.textContent = `RONDA ${roundNum}`;
        ov.classList.remove('hidden');
        setTimeout(() => ov.classList.add('hidden'), 1800);
    }

    _updateLasers(deltaSec) {
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            const L = this.lasers[i];
            const speed = 10 + Math.floor((this.round - 1) * 1.6);
            L.y += (L.dir * speed);
            if (L.y < -50 || L.y > GAME_HEIGHT + 50) { L.el.remove(); this.lasers.splice(i, 1); continue; }
            L.el.style.transform = `translate(${L.x}px, ${L.y}px)`;

            const targetRow = (L.dir === -1) ? 'top' : 'bottom';
            const target = this.enemies.find(e => e.alive && e.slot === this.player.slot && e.row === targetRow);
            if (target) {
                if (this._isEnemyHidden(target)) { L.el.remove(); this.lasers.splice(i, 1); continue; }
                if (this.player.answer === target.answer) {
                    const slot = target.slot, row = target.row;
                    try { if (gameSounds && gameSounds.available) gameSounds.play('explosion'); } catch (e) { }
                    target.alive = false; target.el.remove();
                    L.el.remove(); this.lasers.splice(i, 1);
                    this._updateScore(1);
                    this.correctCount += 1;
                    if (this.correctCount % 4 === 0) {
                        this.player.powerUsesRemaining += 1;
                        this._updatePowerBox();
                        this._flashTopMessage('PODER +1');
                    }
                    if (this.gameType === 'lives' && this.correctCount % 7 === 0) {
                        this.player.lives += 1;
                        this._updateLivesBox();
                        this._flashTopMessage('VIDA +1');
                    }
                    this._maybeRoundUp();
                    const added = Math.max(0.5, TIMER_ON_CORRECT_BASE - (this.round - 1) * 0.2);
                    if (this.gameType === 'timer') { this.timeLeft += added; this._updateTimerBox(); }
                    this._assignNewAnswer();
                    this._replenishEnemyAt(slot, row);
                    if (this.powerState) this._clearPowerVisuals();
                } else {
                    if (this.gameType === 'lives') {
                        this.player.lives -= 1;
                        this._updateLivesBox();
                        this._flashPlayerDamage();
                        if (this.player.lives <= 0) {
                            this.player.alive = false;
                            this.player.imgEl.classList.add('dead');
                        }
                    } else if (this.gameType === 'timer') {
                        const penalty = Math.min(12, TIMER_ON_WRONG_BASE + Math.floor((this.round - 1) * 0.6));
                        this.timeLeft -= penalty;
                        this._updateTimerBox();
                        this._flashPlayerDamage();
                    }
                    L.el.remove(); this.lasers.splice(i, 1);
                }
            }
        }
    }

    _assignNewAnswer() {
        const alive = this.enemies.filter(e => e.alive).map(e => e.answer);
        if (alive.length === 0) {
            // 6. CAMBIO AQUÍ: Verificar si el banco está vacío antes de pedir
            if (this.bank.length === 0) {
                 this.bank = getQuestionsForLevel(this.mode, this.round);
            }
            const next = this.bank.shift() || { a: '—' };
            this.player.answer = next ? next.a : '—';
        } else this.player.answer = alive[Math.floor(Math.random() * alive.length)];
        const el = this.player.wrapEl.querySelector(`#inst-${this.index}-answer`); if (el) el.textContent = this.player.answer;
        this._updatePowerBox();
    }

    _flashPlayerDamage() {
        const wrap = this.player.wrapEl;
        wrap.classList.add('player-hit');
        setTimeout(() => wrap.classList.remove('player-hit'), 700);
    }

    _flashTopMessage(txt) {
        const el = document.createElement('div'); el.className = 'top-temp-msg'; el.textContent = txt;
        if (this.topInfo && this.topInfo.appendChild) this.topInfo.appendChild(el);
        setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 900); }, 900);
    }

    _checkEnd() {
        if (this.gameType === 'timer') {
            if (this.timeLeft <= 0) { this._end('gameover'); return true; }
        } else {
            if (!this.player.alive) { this._end('gameover'); return true; }
        }
        const anyAlive = this.enemies.some(e => e.alive);
        if (!anyAlive) { this._end('win'); return true; }
        return false;
    }

    _end(type) {
        this.running = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
        const esc = this.endScreen; esc.classList.remove('hidden');
        const title = esc.querySelector('.end-title'); title.textContent = (type === 'gameover') ? 'GAME OVER' : 'YOU WIN!';
        const enter = esc.querySelector('.enter-name');
        if (enter) enter.classList.remove('hidden');
        const actions = esc.querySelector('.end-actions');
        actions.innerHTML = `<div style="margin:8px 0"><button class="btn primary btn-playagain">Jugar de nuevo</button> <button class="btn btn-backmenu">Volver al menú</button></div>`;
        const btnPlay = actions.querySelector('.btn-playagain'); btnPlay.onclick = () => { esc.classList.add('hidden'); this._prepare(); this.start(); };
        const btnMenu = actions.querySelector('.btn-backmenu');
        btnMenu.onclick = () => { 
            this.stop(); 
            window.dispatchEvent(new CustomEvent('game-go-menu')); 
        };
    }

    start() {
        this.running = true;
        this.blockInputShortly();
        this.lastFrameTime = performance.now();
        this.animationId = requestAnimationFrame((ts) => this._loop(ts));
    }
    stop() {
        this.running = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
    }
    blockInputShortly() { this.ignoreInputUntil = Date.now() + UNPAUSE_INPUT_BLOCK_MS; }

    _loop(timestamp) {
        if (!this.running) return;
        const deltaMs = timestamp - (this.lastFrameTime || timestamp);
        const deltaSec = deltaMs / 1000;
        this.lastFrameTime = timestamp;

        if (this.player.cooldown > 0) this.player.cooldown--;
        if (this.player.powerCooldown > 0) this.player.powerCooldown--;

        this.enemies.forEach(e => { if (!e.alive) return; const dy = Math.sin((Date.now() + e.slot * 100) / (700 / this.difficultyMultiplier)) * 6 * this.difficultyMultiplier; e.el.style.transform = `translate(${e.x}px, ${e.y + dy}px)`; });

        this._updateLasers(deltaSec);
        this._clearPowerIfExpired();

        if (this.gameType === 'timer') { this.timeLeft -= deltaSec; this._updateTimerBox(); }

        if (this._checkEnd()) return;

        // poll gamepad
        const cfg = controlsConfig[this.controlsOffset] || controlsConfig[0];
        if (cfg && cfg.inputType === 'gamepad' && cfg.gamepad.index !== null) {
            const gp = navigator.getGamepads ? navigator.getGamepads()[cfg.gamepad.index] : null;
            if (gp) this.handleGamepad(gp);
        }

        this.animationId = requestAnimationFrame((ts) => this._loop(ts));
    }
}
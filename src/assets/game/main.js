/* main.js
   Añadido: rondas / dificultad progresiva + overlay de ronda
           scoreboard guardado en localStorage + formulario al morir
   Mantiene: modos (vidas/timer), poderes, pausa IZQ+DER, 2 jugadores, gamepad
*/
// en assets/game/main.js (al principio)
(function(){
  function parseHash(){
    const h = location.hash.replace(/^#/, '');
    const obj = {};
    h.split('&').forEach(part=>{
      const [k,v] = part.split('=');
      if(k) obj[k]=decodeURIComponent(v||'');
    });
    return obj;
  }
  const params = parseHash();
  // params.players, params.mode, params.type
  // usa estos valores para inicializar el menú o auto-start.
  // p. ej. if (params.mode) document.getElementById('mode-select').value = params.mode;
})();

/* ---------- CONFIGS ---------- */
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const POSITIONS_X = [120, 360, 600];
const ENEMY_TOP_Y = 40;
const ENEMY_BOTTOM_Y = 300;
const PLAYER_Y_MIDDLE = 200;

const POWER_DURATION_MS = 7000;
const UNPAUSE_INPUT_BLOCK_MS = 300;
const TIMER_START_SECONDS = 25;
const TIMER_ON_CORRECT_BASE = 3;
const TIMER_ON_WRONG_BASE = 5;

const ROUNDS_EVERY_N_CORRECT = 8; // cada 8 aciertos subes de ronda

const LEADERBOARD_KEY = 'si_leaderboard_v1';

/* Bancos */
const BANKS = {
  math: [
    { q: "2 + 2", a: "4" },
    { q: "3 × 3", a: "9" },
    { q: "10 - 4", a: "6" },
    { q: "5 + 7", a: "12" },
    { q: "6 ÷ 2", a: "3" },
    { q: "8 - 3", a: "5" }
  ],
  history: [
    { q: "Capital de Egipto (antiguo)", a: "Menfis" },
    { q: "¿Quién descubrió América?", a: "Colón" },
    { q: "Año de la independencia de México", a: "1810" },
    { q: "Imperio con César", a: "Romano" },
    { q: "Muro famoso (China)", a: "Gran Muralla" },
    { q: "Civilización precolombina del Perú", a: "Inca" }
  ]
};

/* Controles por defecto */
const defaultControls = [
  {
    inputType: "keyboard",
    keyboard: { left: 37, right: 39, up: 38, down: 40, shoot: 32, power: 69 },
    gamepad: { index: null, axis: 0, shootButton: 0, powerButton: 1 }
  },
  {
    inputType: "keyboard",
    keyboard: { left: 65, right: 68, up: 87, down: 83, shoot: 70, power: 71 },
    gamepad: { index: null, axis: 0, shootButton: 0, powerButton: 1 }
  }
];
let controlsConfig = JSON.parse(JSON.stringify(defaultControls));

/* ---------- DOM Global ---------- */
const $menu = document.getElementById('menu');
const $start = document.getElementById('start-game');
const $configure = document.getElementById('configure-controls');
const $controlsModal = document.getElementById('controls-config');
const $playersConfig = document.getElementById('players-config');
const $closeConfig = document.getElementById('close-config');
const $saveConfig = document.getElementById('save-config');
const $playerCountSelect = document.getElementById('player-count');
const $modeSelect = document.getElementById('mode-select');
const $gameTypeSelect = document.getElementById('game-type-select');
const $gameWrapper = document.getElementById('game-wrapper');
const $pauseMenu = document.getElementById('pause-menu');
const $resumeBtn = document.getElementById('resume');
const $restartPause = document.getElementById('restart-pause');
const $leaderboardContainer = document.getElementById('leaderboard'); // ver index.html section

window.addEventListener('gamepadconnected', (e)=> console.log('Gamepad connected', e.gamepad));
window.addEventListener('gamepaddisconnected', (e)=> console.log('Gamepad disconnected', e.gamepad));

/* ---------- Utilidades ---------- */
function shuffle(arr){ return arr.slice().sort(()=> Math.random()-0.5); }
function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
function keyName(code){
  if(!code && code !== 0) return 'ninguno';
  const map = {32:'Space',37:'Left',38:'Up',39:'Right',40:'Down',65:'A',68:'D',70:'F',71:'G',69:'E',83:'S',87:'W'};
  return map[code] || ('KeyCode '+code);
}

/* Leaderboard helpers */
function loadLeaderboard(){
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if(!raw) return [];
    return JSON.parse(raw);
  } catch(e){
    console.warn('leaderboard read error', e);
    return [];
  }
}
function saveLeaderboard(arr){
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(arr.slice(0,100))); // keep last 100
}
function addScoreToLeaderboard(entry){
  const arr = loadLeaderboard();
  arr.push(entry);
  // sort by score desc, then rounds desc, then date desc
  arr.sort((a,b)=> (b.score - a.score) || (b.rounds - a.rounds) || (new Date(b.date) - new Date(a.date)));
  saveLeaderboard(arr);
  renderLeaderboard(); // update UI
}
function clearLeaderboard(){
  localStorage.removeItem(LEADERBOARD_KEY);
  renderLeaderboard();
}
function renderLeaderboard(){
  if (!$leaderboardContainer) return;
  const arr = loadLeaderboard();
  const top = arr.slice(0,10);
  let html = `<div class="leaderboard-inner"><h3>Top 10</h3>`;
  if(top.length === 0) html += `<div class="empty">Aún no hay puntajes</div>`;
  else {
    html += `<table class="lb-table"><thead><tr><th>#</th><th>Nombre</th><th>Pts</th><th>Modo</th><th>Tipo</th><th>Rondas</th><th>Fecha</th></tr></thead><tbody>`;
    top.forEach((r,i)=>{
      html += `<tr><td>${i+1}</td><td>${escapeHtml(r.name||'---')}</td><td>${r.score}</td><td>${escapeHtml(r.mode)}</td><td>${escapeHtml(r.gameType)}</td><td>${r.rounds}</td><td>${new Date(r.date).toLocaleString()}</td></tr>`;
    });
    html += `</tbody></table>`;
  }
  html += `<div style="margin-top:8px"><button id="clear-lb" class="btn small">Borrar tabla</button></div></div>`;
  $leaderboardContainer.innerHTML = html;
  const btn = document.getElementById('clear-lb');
  if(btn) btn.addEventListener('click', () => { if(confirm('Borrar tabla de puntajes?')) clearLeaderboard(); });
}
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[c]); }

/* ---------- GameInstance class ---------- */
class GameInstance {
  constructor(index, mode, parentEl, controlCfgIndexStart = 0, gameType='lives'){
    this.index = index;
    this.mode = mode;
    this.parentEl = parentEl;
    this.controlsOffset = controlCfgIndexStart;
    this.gameType = gameType;

    // DOM & HUD
    this.dom = this._createDOM();
    this.board = this.dom.board;
    this.endScreen = this.dom.endScreen;
    this.roundOverlay = this.dom.roundOverlay;
    this.scoreBox = this.dom.scoreBox;
    this.powerBox = this.dom.powerBox;
    this.livesBox = this.dom.livesBox;
    this.timerBox = this.dom.timerBox;

    // gameplay state
    this.bank = shuffle(BANKS[this.mode]).slice();
    this.enemies = [];
    this.player = null;
    this.lasers = [];
    this.powerState = null;
    this.score = 0;
    this.running = false;
    this.animationId = null;

    // difficulty & rounds
    this.correctCount = 0;     // total corrects (for power / life / rounds)
    this.round = 1;
    this.difficultyMultiplier = 1; // increases with rounds

    // timing
    this.timeLeft = (this.gameType==='timer') ? TIMER_START_SECONDS : null;
    this.lastFrameTime = null;

    // input helpers
    this.keyDownOnce = {};
    this.gamepadPrevAxis = 0;
    this.ignoreInputUntil = 0;

    this._prepare();
  }

  _createDOM(){
    const inst = document.createElement('div');
    inst.className = 'game-instance';

    const top = document.createElement('div'); top.className = 'top-info';
    const title = document.createElement('div'); title.textContent = `Pantalla ${this.index+1}`; title.style.fontWeight='700';
    const modeLabel = document.createElement('div'); modeLabel.style.color='#fff'; modeLabel.textContent = (this.mode || 'modo');
    const score = document.createElement('div'); score.className = 'score-box'; score.textContent = `Aciertos: 0`;
    const powerBox = document.createElement('div'); powerBox.className = 'score-box'; powerBox.textContent = `Poderes: 2`;
    const livesBox = document.createElement('div'); livesBox.className = 'score-box'; livesBox.textContent = this.gameType==='lives' ? `Vidas: 3` : '';
    const timerBox = document.createElement('div'); timerBox.className = 'score-box'; timerBox.textContent = this.gameType==='timer' ? `Tiempo: ${this.timeLeft}s` : '';
    top.appendChild(title); top.appendChild(modeLabel); top.appendChild(score); top.appendChild(powerBox); top.appendChild(livesBox); top.appendChild(timerBox);

    const board = document.createElement('div'); board.className = 'board'; board.style.width = GAME_WIDTH + 'px'; board.style.height = GAME_HEIGHT + 'px';
    // round overlay
    const roundOverlay = document.createElement('div'); roundOverlay.className='round-overlay hidden'; roundOverlay.innerHTML = `<div class="round-text"></div>`;

    // end screen (game over / you win) includes name input
    const end = document.createElement('div'); end.className = 'end-screen hidden';
    end.innerHTML = `<h2 class="end-title"></h2>
      <div class="end-body">
        <div class="end-actions"></div>
        <div class="enter-name hidden">
          <label>Tu nombre: <input id="player-name-${this.index}" maxlength="20" placeholder="AAA"></label>
          <button id="save-score-${this.index}" class="btn primary">Guardar puntaje</button>
        </div>
      </div>`;

    inst.appendChild(top); inst.appendChild(board); inst.appendChild(roundOverlay); inst.appendChild(end);
    this.parentEl.appendChild(inst);
    return { root: inst, topInfo: top, board, endScreen: end, roundOverlay, scoreBox: score, powerBox, livesBox, timerBox };
  }

  _prepare(){
    this._clearAll();
    while(this.bank.length < 12) this.bank.push(...shuffle(BANKS[this.mode]));
    const sel = this.bank.splice(0,6);
    for(let i=0;i<3;i++) this._createEnemy(i,'top',POSITIONS_X[i],ENEMY_TOP_Y,sel[i].q,sel[i].a);
    for(let i=0;i<3;i++) this._createEnemy(i,'bottom',POSITIONS_X[i],ENEMY_BOTTOM_Y,sel[3+i].q,sel[3+i].a);

    this.player = {
      slot:1,
      facing:'up',
      wrapEl:null,
      imgEl:null,
      answer:null,
      cooldown:0,
      powerCooldown:0,
      powerUsesRemaining:2,
      lives: (this.gameType==='lives'?3:0),
      alive:true
    };

    this.timeLeft = (this.gameType==='timer') ? TIMER_START_SECONDS : null;
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

    // wire end-screen buttons & save name
    const btnPlayAgain = this.endScreen.querySelector('.btn-playagain');
    if(btnPlayAgain) btnPlayAgain.onclick = () => { this.endScreen.classList.add('hidden'); this._prepare(); this.start(); };
    const btnBack = this.endScreen.querySelector('.btn-backmenu');
    if(btnBack) btnBack.onclick = () => { this.stop(); goToMenu(); };

    const saveBtn = this.endScreen.querySelector(`#save-score-${this.index}`);
    const nameInput = this.endScreen.querySelector(`#player-name-${this.index}`);
    if(saveBtn && nameInput){
      saveBtn.onclick = () => {
        const name = (nameInput.value || '---').slice(0,20);
        addScoreToLeaderboard({
          name,
          score: this.score,
          mode: this.mode,
          gameType: this.gameType,
          rounds: this.round,
          date: new Date().toISOString()
        });
        // hide form after save
        this.endScreen.querySelector('.enter-name').classList.add('hidden');
        // show done text
        const actions = this.endScreen.querySelector('.end-actions');
        actions.innerHTML = `<div class="saved-msg">Puntaje guardado. ¡buena!</div>`;
      };
    }
  }

  _clearAll(){
    if(this.board){
      this.board.querySelectorAll('.enemy').forEach(n=>n.remove());
      this.board.querySelectorAll('.player-wrap').forEach(n=>n.remove());
      this.board.querySelectorAll('.laser').forEach(n=>n.remove());
    }
    this.enemies = []; this.lasers = [];
  }

  _createEnemy(slot,row,x,y,q,a){
    const container = document.createElement('div'); container.className='enemy';
    container.dataset.slot = slot; container.dataset.row = row;
    container.innerHTML = `<img src="img/ufo.png" alt="ufo"><div class="enemy-label">${q}</div>`;
    container.style.transform = `translate(${x}px, ${y}px)`;
    this.board.appendChild(container);
    const enemy = { id:`${row}-${slot}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, slot, row, x, y, question:q, answer:a, el:container, alive:true };
    this.enemies.push(enemy);
  }

  _createPlayerSprite(){
    const wrap = document.createElement('div'); wrap.className='player-wrap';
    wrap.style.position='absolute'; wrap.style.left='0px'; wrap.style.top='0px'; wrap.style.width='56px'; wrap.style.height='56px';
    const img = document.createElement('img'); img.className='player'; img.src='img/spaceship.png'; img.style.width='56px';
    const ans = document.createElement('div'); ans.className='player-answer'; ans.id = `inst-${this.index}-answer`;
    ans.style.position='absolute'; ans.style.left='50%'; ans.style.top='50%'; ans.style.transform='translate(-50%,-50%)';
    ans.style.pointerEvents='none'; ans.style.fontSize='14px'; ans.style.padding='4px 6px'; ans.style.background='rgba(0,0,0,0.45)'; ans.style.borderRadius='6px'; ans.style.color='#fff';
    wrap.appendChild(img); wrap.appendChild(ans);
    this.board.appendChild(wrap);
    this.player.wrapEl = wrap; this.player.imgEl = img;
    this._positionPlayer();
  }

  _positionPlayer(){
    const p = this.player;
    p.x = POSITIONS_X[p.slot]; p.y = PLAYER_Y_MIDDLE;
    p.wrapEl.style.transform = `translate(${p.x}px, ${p.y}px)`;
    p.imgEl.style.transform = (p.facing === 'up') ? 'rotate(0deg)' : 'rotateX(180deg)';
    const answerEl = p.wrapEl.querySelector(`#inst-${this.index}-answer`);
    if(answerEl) answerEl.textContent = p.answer || '—';
  }

  _assignInitialAnswer(){
    const answers = this.enemies.filter(e=>e.alive).map(e=>e.answer);
    this.player.answer = answers.length ? answers[Math.floor(Math.random()*answers.length)] : '—';
    const el = this.player.wrapEl.querySelector(`#inst-${this.index}-answer`); if(el) el.textContent = this.player.answer;
  }

  _updateScore(delta){ this.score += delta; this.scoreBox.textContent = `Aciertos: ${this.score}`; }
  _updatePowerBox(){ this.powerBox.textContent = `Poderes: ${this.player.powerUsesRemaining}`; }
  _updateLivesBox(){ this.livesBox.textContent = this.gameType==='lives' ? `Vidas: ${this.player.lives}` : ''; }
  _updateTimerBox(){ if(this.gameType==='timer') this.timerBox.textContent = `Tiempo: ${Math.max(0, Math.floor(this.timeLeft))}s`; else this.timerBox.textContent=''; }

  handleKeyDown(code){
    if(Date.now() < this.ignoreInputUntil) return;
    if(this.keyDownOnce[code]) return;
    this.keyDownOnce[code] = true;
    const cfg = controlsConfig[this.controlsOffset] || controlsConfig[0];
    if(cfg.inputType === 'keyboard'){
      const kb = cfg.keyboard;
      if(code === kb.left) this.moveLeft();
      else if(code === kb.right) this.moveRight();
      else if(code === kb.up) this.setFacingUp();
      else if(code === kb.down) this.setFacingDown();
      else if(code === kb.shoot) this.tryShoot();
      else if(code === kb.power) this.tryPower();
    }
  }
  handleKeyUp(code){ this.keyDownOnce[code] = false; }

  handleGamepad(gp){
    if(Date.now() < this.ignoreInputUntil) return;
    if(!gp) return;
    const cfg = controlsConfig[this.controlsOffset] || controlsConfig[0];
    const axisIndex = cfg.gamepad.axis || 0;
    const axisVal = gp.axes[axisIndex] || 0;
    if(axisVal < -0.6 && this.gamepadPrevAxis >= -0.6) this.moveLeft();
    if(axisVal > 0.6 && this.gamepadPrevAxis <= 0.6) this.moveRight();
    this.gamepadPrevAxis = axisVal;
    if(gp.buttons[12] && gp.buttons[12].pressed) this.setFacingUp();
    if(gp.buttons[13] && gp.buttons[13].pressed) this.setFacingDown();
    const sb = cfg.gamepad.shootButton || 0;
    const pb = cfg.gamepad.powerButton || 1;
    if(gp.buttons[sb] && gp.buttons[sb].pressed) this.tryShoot();
    if(gp.buttons[pb] && gp.buttons[pb].pressed) this.tryPower();
    if(gp.buttons[14] && gp.buttons[15] && gp.buttons[14].pressed && gp.buttons[15].pressed){
      window.dispatchEvent(new CustomEvent('instance-toggle-pause', { detail: { instance: this.index }}));
    }
  }

  moveLeft(){ if(!this.player.alive) return; this.player.slot = clamp(this.player.slot-1,0,2); this._positionPlayer(); }
  moveRight(){ if(!this.player.alive) return; this.player.slot = clamp(this.player.slot+1,0,2); this._positionPlayer(); }
  setFacingUp(){ if(!this.player.alive) return; this.player.facing='up'; this._positionPlayer(); }
  setFacingDown(){ if(!this.player.alive) return; this.player.facing='down'; this._positionPlayer(); }

  tryShoot(){
    if(!this.player.alive) return;
    if(this.player.cooldown > 0) return;
    const lx = POSITIONS_X[this.player.slot] + 30;
    const ly = this.player.y - 12;
    const $l = document.createElement('img'); $l.className='laser'; $l.src='img/laser.png'; $l.style.width='12px';
    const dir = (this.player.facing === 'up') ? -1 : 1;
    this.board.appendChild($l);
    $l.style.transform = `translate(${lx}px, ${ly}px)`;
    this.lasers.push({ x: lx, y: ly, el: $l, dir });
    this.player.cooldown = Math.max(6, 18 - Math.floor((this.round-1)/2)); // slightly faster cooldown as rounds progress (but not too low)
  }

  tryPower(){
    if(!this.player.alive) return;
    if(this.player.powerUsesRemaining <= 0) return;
    if(this.player.powerCooldown > 0) return;
    this.player.powerUsesRemaining -= 1;
    this._updatePowerBox();
    this.activatePower();
    this.player.powerCooldown = 300;
  }

  activatePower(){
    const correct = this.enemies.find(e => e.alive && e.answer === this.player.answer);
    const poolWrong = this.enemies.filter(e => e.alive && e.id !== (correct && correct.id));
    if(!correct || poolWrong.length === 0) return;
    const wrong = poolWrong[Math.floor(Math.random()*poolWrong.length)];
    this.powerState = { expiresAt: Date.now() + POWER_DURATION_MS, preserve: [correct.id, wrong.id] };
    this.enemies.forEach(e => {
      if(!e.alive) return;
      if(!this.powerState.preserve.includes(e.id)) e.el.classList.add('hidden-by-power');
      else e.el.classList.remove('hidden-by-power');
    });
  }

  _isEnemyHidden(enemy){ if(!this.powerState) return false; return !this.powerState.preserve.includes(enemy.id); }
  _clearPowerVisuals(){ this.enemies.forEach(e => e.el && e.el.classList.remove('hidden-by-power')); this.powerState = null; }
  _clearPowerIfExpired(){ if(this.powerState && Date.now() >= this.powerState.expiresAt) this._clearPowerVisuals(); }

  _replenishEnemyAt(slot,row){
    if(this.bank.length === 0) this.bank = shuffle(BANKS[this.mode]).slice();
    const next = this.bank.shift();
    this._createEnemy(slot,row,POSITIONS_X[slot], row==='top' ? ENEMY_TOP_Y : ENEMY_BOTTOM_Y, next.q, next.a);
  }

  _maybeRoundUp(){
    // cada ROUNDS_EVERY_N_CORRECT correctos, sube 1 ronda
    const newRound = Math.floor(this.correctCount / ROUNDS_EVERY_N_CORRECT) + 1;
    if(newRound > this.round){
      this.round = newRound;
      this.difficultyMultiplier = 1 + (this.round - 1) * 0.18; // escala del 18% por ronda (ajustable)
      this._showRoundOverlay(this.round);
    }
  }

  _showRoundOverlay(roundNum){
    const ov = this.roundOverlay;
    const text = ov.querySelector('.round-text');
    text.textContent = `RONDA ${roundNum}`;
    ov.classList.remove('hidden');
    setTimeout(()=> ov.classList.add('hidden'), 1800);
    // small visual/audio hook could be added here
  }

  _updateLasers(deltaSec){
    for(let i=this.lasers.length-1;i>=0;i--){
      const L = this.lasers[i];
      // laser speed increases a little with difficulty
      const speed = 10 + Math.floor((this.round-1) * 1.6);
      L.y += (L.dir * speed);
      if(L.y < -50 || L.y > GAME_HEIGHT + 50){ L.el.remove(); this.lasers.splice(i,1); continue; }
      L.el.style.transform = `translate(${L.x}px, ${L.y}px)`;

      const targetRow = (L.dir === -1) ? 'top' : 'bottom';
      const target = this.enemies.find(e=>e.alive && e.slot === this.player.slot && e.row === targetRow);
      if(target){
        if(this._isEnemyHidden(target)){ L.el.remove(); this.lasers.splice(i,1); continue; }
        if(this.player.answer === target.answer){
          const slot = target.slot, row = target.row;
          target.alive = false; target.el.remove();
          L.el.remove(); this.lasers.splice(i,1);
          this._updateScore(1);

          // correcto: contadores
          this.correctCount += 1;
          // cada 4 correctos -> +1 poder
          if(this.correctCount % 4 === 0){
            this.player.powerUsesRemaining += 1;
            this._updatePowerBox();
            // mostrar mini notificación (opcional)
            this._flashTopMessage('PODER +1');
          }
          // en modo vidas: cada 7 correctos -> +1 vida
          if(this.gameType === 'lives' && this.correctCount % 7 === 0){
            this.player.lives += 1;
            this._updateLivesBox();
            this._flashTopMessage('VIDA +1');
          }

          // ajustes por ronda / dificultad
          this._maybeRoundUp();

          // tiempo (si timer)
          const added = Math.max(0.5, TIMER_ON_CORRECT_BASE - (this.round-1)*0.2); // reduce slightly each ronda
          if(this.gameType === 'timer'){ this.timeLeft += added; this._updateTimerBox(); }

          // reasignar respuesta y reponer enemigo en misma celda
          this._assignNewAnswer();
          this._replenishEnemyAt(slot,row);

          if(this.powerState) this._clearPowerVisuals();
        } else {
          // fallo
          if(this.gameType === 'lives'){
            this.player.lives -= 1;
            this._updateLivesBox();
            this._flashPlayerDamage();
            if(this.player.lives <= 0){
              this.player.alive = false;
              this.player.imgEl.classList.add('dead');
            }
          } else if(this.gameType === 'timer'){
            // penalidad según ronda: se vuelve más dura
            const penalty = Math.min(12, TIMER_ON_WRONG_BASE + Math.floor((this.round-1)*0.6));
            this.timeLeft -= penalty;
            this._updateTimerBox();
            this._flashPlayerDamage();
          }
          L.el.remove(); this.lasers.splice(i,1);
        }
      }
    }
  }

  _assignNewAnswer(){
    const alive = this.enemies.filter(e=>e.alive).map(e=>e.answer);
    if(alive.length === 0){
      if(this.bank.length === 0) this.bank = shuffle(BANKS[this.mode]).slice();
      const next = this.bank.shift();
      this.player.answer = next ? next.a : '—';
    } else this.player.answer = alive[Math.floor(Math.random()*alive.length)];
    const el = this.player.wrapEl.querySelector(`#inst-${this.index}-answer`); if(el) el.textContent = this.player.answer;
    this._updatePowerBox();
  }

  _flashPlayerDamage(){
    const wrap = this.player.wrapEl;
    wrap.classList.add('player-hit');
    setTimeout(()=> wrap.classList.remove('player-hit'), 700);
  }

  _flashTopMessage(txt){
    // small transient message at top-info
    const el = document.createElement('div'); el.className = 'top-temp-msg'; el.textContent = txt;
    this.dom.topInfo.appendChild(el);
    setTimeout(()=> { el.classList.add('out'); setTimeout(()=> el.remove(),900); }, 900);
  }

  _checkEnd(){
    if(this.gameType === 'timer'){
      if(this.timeLeft <= 0) { this._end('gameover'); return true; }
    } else {
      if(!this.player.alive) { this._end('gameover'); return true; }
    }
    const anyAlive = this.enemies.some(e=>e.alive);
    if(!anyAlive){ this._end('win'); return true; }
    return false;
  }

  _end(type){
    this.running = false;
    if(this.animationId) cancelAnimationFrame(this.animationId);
    // show end
    const esc = this.endScreen; esc.classList.remove('hidden');
    const title = esc.querySelector('.end-title'); title.textContent = (type==='gameover') ? 'GAME OVER' : 'YOU WIN!';
    // show enter-name form by default when gameover
    const enter = esc.querySelector('.enter-name');
    if(enter){
      // show only for game over (if win, still allow)
      enter.classList.remove('hidden');
    }
    // fill end-actions with basic controls (restart/backmenu)
    const actions = esc.querySelector('.end-actions');
    actions.innerHTML = `<div style="margin:8px 0"><button class="btn primary btn-playagain">Jugar de nuevo</button> <button class="btn btn-backmenu">Volver al menú</button></div>`;
    const btnPlay = actions.querySelector('.btn-playagain'); btnPlay.onclick = () => { esc.classList.add('hidden'); this._prepare(); this.start(); };
    const btnMenu = actions.querySelector('.btn-backmenu'); btnMenu.onclick = () => { this.stop(); goToMenu(); };
  }

  start(){
    this.running = true;
    this.blockInputShortly();
    this.lastFrameTime = performance.now();
    this.animationId = requestAnimationFrame((ts)=> this._loop(ts));
  }
  stop(){
    this.running = false;
    if(this.animationId) cancelAnimationFrame(this.animationId);
  }
  blockInputShortly(){ this.ignoreInputUntil = Date.now() + UNPAUSE_INPUT_BLOCK_MS; }

  _loop(timestamp){
    if(!this.running) return;
    const deltaMs = timestamp - (this.lastFrameTime || timestamp);
    const deltaSec = deltaMs/1000;
    this.lastFrameTime = timestamp;

    if(this.player.cooldown > 0) this.player.cooldown--;
    if(this.player.powerCooldown > 0) this.player.powerCooldown--;

    // wobble scaled by difficultyMultiplier
    this.enemies.forEach(e => { if(!e.alive) return; const dy = Math.sin((Date.now()+e.slot*100)/(700/this.difficultyMultiplier))*6*this.difficultyMultiplier; e.el.style.transform = `translate(${e.x}px, ${e.y + dy}px)`; });

    this._updateLasers(deltaSec);
    this._clearPowerIfExpired();

    if(this.gameType === 'timer'){ this.timeLeft -= deltaSec; this._updateTimerBox(); }

    if(this._checkEnd()) return;

    const cfg = controlsConfig[this.controlsOffset] || controlsConfig[0];
    if(cfg.inputType === 'gamepad' && cfg.gamepad.index !== null){
      const gp = navigator.getGamepads ? navigator.getGamepads()[cfg.gamepad.index] : null;
      if(gp) this.handleGamepad(gp);
    }

    this.animationId = requestAnimationFrame((ts)=> this._loop(ts));
  }
}

/* ---------- Host / UI ---------- */

/* única declaración instances */
let instances = [];

function buildInstances(){
  $gameWrapper.innerHTML = '';
  instances = [];
  const numPlayers = parseInt($playerCountSelect.value);
  const mode = $modeSelect.value || 'math';
  const gameType = $gameTypeSelect ? $gameTypeSelect.value : 'lives';
  if(numPlayers === 1){
    const inst = new GameInstance(0, mode, $gameWrapper, 0, gameType); instances.push(inst);
  } else {
    const instL = new GameInstance(0, mode, $gameWrapper, 0, gameType);
    const instR = new GameInstance(1, mode, $gameWrapper, 1, gameType);
    instances.push(instL, instR);
  }
  // auto focus: show leaderboard updated
  renderLeaderboard();
}

/* volver al menu sin recargar */
function goToMenu(){
  instances.forEach(i=>i.stop());
  $gameWrapper.innerHTML = '';
  instances = [];
  $menu.classList.remove('hidden');
  document.querySelectorAll('.board').forEach(b=>b.classList.remove('paused'));
}

/* global keyboard */
window.addEventListener('keydown', (e) => {
  instances.forEach(inst => {
    const cfg = controlsConfig[inst.controlsOffset];
    if(cfg.inputType === 'keyboard') inst.handleKeyDown(e.keyCode);
  });
  window._globalKeys = window._globalKeys || {}; window._globalKeys[e.keyCode] = true;

  // pausa por IZQ+DER en cualquier instancia
  const shouldPause = instances.some(inst => {
    const cfg = controlsConfig[inst.controlsOffset];
    if(cfg.inputType !== 'keyboard') return false;
    const kb = cfg.keyboard;
    return (!!window._globalKeys[kb.left] && !!window._global_keys_when_check || !!window._globalKeys[kb.right]) || (!!window._globalKeys[kb.left] && !!window._globalKeys[kb.right]);
  });
  // simpler: detect any instance where both its left & right keys pressed
  let pauseNow = false;
  for(const inst of instances){
    const cfg = controlsConfig[inst.controlsOffset];
    if(cfg.inputType !== 'keyboard') continue;
    const kb = cfg.keyboard;
    if(window._globalKeys[kb.left] && window._globalKeys[kb.right]) { pauseNow = true; break; }
  }
  if(pauseNow) togglePauseAll();
});

window.addEventListener('keyup', (e) => {
  window._globalKeys = window._globalKeys || {}; window._globalKeys[e.keyCode] = false;
  instances.forEach(inst => inst.handleKeyUp && inst.handleKeyUp(e.keyCode));
});

/* instance event pause (gamepad) */
window.addEventListener('instance-toggle-pause', (ev) => { togglePauseAll(); });

function togglePauseAll(){
  const anyRunning = instances.some(i=>i.running);
  if(anyRunning){
    instances.forEach(i=>i.stop());
    $pauseMenu.classList.remove('hidden');
    document.querySelectorAll('.board').forEach(b=>b.classList.add('paused'));
  } else {
    instances.forEach(i=>{ i.start(); i.blockInputShortly(); });
    $pauseMenu.classList.add('hidden');
    document.querySelectorAll('.board').forEach(b=>b.classList.remove('paused'));
  }
}

/* UI wiring */
$configure.addEventListener('click', ()=> { openConfigModal(parseInt($playerCountSelect.value)); $controlsModal.classList.remove('hidden'); });
$closeConfig.addEventListener('click', ()=> { $controlsModal.classList.add('hidden'); });
$saveConfig.addEventListener('click', ()=> { $controlsModal.classList.add('hidden'); alert('Controles guardados'); });

$start.addEventListener('click', ()=> { buildInstances(); instances.forEach(i=>i.start()); $menu.classList.add('hidden'); renderLeaderboard(); });
$resumeBtn.addEventListener('click', ()=> { instances.forEach(i=>{ if(!i._checkEnd()) i.start(); i.blockInputShortly(); }); $pauseMenu.classList.add('hidden'); document.querySelectorAll('.board').forEach(b=>b.classList.remove('paused')); });
$restartPause.addEventListener('click', ()=> location.reload());

/* config modal (remapeo) - misma lógica que antes */
function openConfigModal(numPlayers){
  $playersConfig.innerHTML = '';
  for(let p=0;p<numPlayers;p++){
    const cfg = controlsConfig[p];
    const div = document.createElement('div'); div.className='mapping';
    div.innerHTML = `<h3>Jugador ${p+1}</h3>
      <div>Input: <select id="input-type-${p}"><option value="keyboard">Teclado</option><option value="gamepad">Gamepad</option></select></div>
      <div style="margin-top:8px;"><strong>Teclado:</strong>
        <div>Izquierda: <span id="kb-left-${p}">${keyName(cfg.keyboard.left)}</span> <button data-action="kb-left" data-player="${p}" class="btn small">Asignar</button></div>
        <div>Derecha: <span id="kb-right-${p}">${keyName(cfg.keyboard.right)}</span> <button data-action="kb-right" data-player="${p}" class="btn small">Asignar</button></div>
        <div>Arriba: <span id="kb-up-${p}">${keyName(cfg.keyboard.up)}</span> <button data-action="kb-up" data-player="${p}" class="btn small">Asignar</button></div>
        <div>Abajo: <span id="kb-down-${p}">${keyName(cfg.keyboard.down)}</span> <button data-action="kb-down" data-player="${p}" class="btn small">Asignar</button></div>
        <div>Disparar: <span id="kb-shoot-${p}">${keyName(cfg.keyboard.shoot)}</span> <button data-action="kb-shoot" data-player="${p}" class="btn small">Asignar</button></div>
        <div>Poder: <span id="kb-power-${p}">${keyName(cfg.keyboard.power)}</span> <button data-action="kb-power" data-player="${p}" class="btn small">Asignar</button></div>
      </div>
      <div style="margin-top:8px;"><strong>Gamepad:</strong>
        <div>Asignar gamepad: <span id="gp-index-${p}">${cfg.gamepad.index===null ? 'ninguno' : cfg.gamepad.index}</span> <button data-action="assign-gamepad" data-player="${p}" class="btn small">Asignar</button></div>
      </div>`;
    $playersConfig.appendChild(div);
    const select = div.querySelector(`#input-type-${p}`);
    select.value = cfg.inputType;
    select.addEventListener('change', (ev)=> { controlsConfig[p].inputType = ev.target.value; });
    const assignButtons = div.querySelectorAll('button[data-action]');
    assignButtons.forEach(btn => {
      const action = btn.getAttribute('data-action');
      const player = parseInt(btn.getAttribute('data-player'));
      btn.addEventListener('click', () => {
        if(action.startsWith('kb-')) listenForKeyboardAssign(action.replace('kb-',''), player);
        else if(action === 'assign-gamepad') listenForGamepadAssign(player);
      });
    });
  }
}

function listenForKeyboardAssign(which, player){
  const span = document.getElementById(`kb-${which}-${player}`);
  span.textContent = 'Pulsar tecla...';
  function handlerAssign(e){ e.preventDefault(); controlsConfig[player].keyboard[which] = e.keyCode; span.textContent = keyName(e.keyCode); window.removeEventListener('keydown', handlerAssign); }
  window.addEventListener('keydown', handlerAssign);
}

function listenForGamepadAssign(player){
  const info = document.getElementById(`gp-index-${player}`);
  info.textContent = 'Esperando botón...';
  let listening = true;
  const poll = setInterval(()=>{
    const gps = navigator.getGamepads ? navigator.getGamepads() : [];
    for(let i=0;i<gps.length;i++){
      const gp = gps[i]; if(!gp) continue;
      for(let b=0;b<gp.buttons.length;b++){
        if(gp.buttons[b].pressed){
          controlsConfig[player].gamepad.index = i;
          controlsConfig[player].gamepad.shootButton = b;
          controlsConfig[player].gamepad.powerButton = Math.min(b+1, gp.buttons.length-1);
          info.textContent = `${i}`;
          listening = false; clearInterval(poll); return;
        }
      }
    }
  }, 150);
  setTimeout(()=>{ if(listening){ clearInterval(poll); info.textContent = 'tiempo agotado'; } }, 10000);
}

/* keep gamepad polling alive */
(function pollGP(){ requestAnimationFrame(pollGP); })();

/* initial render of leaderboard in menu */
renderLeaderboard();

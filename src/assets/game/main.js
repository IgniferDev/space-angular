import { parseHash, safeParseInt } from './js/utils.js';
import { gameSounds } from './js/audio.js';
import { GameInstance } from './js/game-instance.js';
import { renderLeaderboard } from './js/leaderboard.js';
import { controlsConfig, openConfigModal } from './js/controls.js';
import * as UI from './js/ui.js';
import { ESP32Controller } from "./esp32.js";

const esp32 = new ESP32Controller(procesarEventoESP32);
esp32.connect("192.168.4.1");

function procesarEventoESP32(data) {

    // ------------------------------
    // BOTONES DE MOVIMIENTO
    // ------------------------------
    if (data.move === "up") moverJugador("up");
    if (data.move === "down") moverJugador("down");
    if (data.move === "left") moverJugador("left");
    if (data.move === "right") moverJugador("right");

    // ------------------------------
    // DISPARO / ESPECIAL
    // ------------------------------
    if (data.shoot === true) disparar();
    if (data.special === true) ataqueEspecial();

    // ------------------------------
    // BATERÍA
    // ------------------------------
    if ("battery" in data) actualizarHUD_Bateria(data.battery);

    // ------------------------------
    // ESTADO DEL JUEGO
    // ------------------------------
    if (data.game === "active") iniciarJuego();
    if (data.game === "pause") pausarJuego();
    if (data.game === "over") gameOver();
}

// ===============================================
// 3. FUNCIONES DE CONTROL DEL JUEGO
// (estas ya existen en tu juego o las ajustamos)
// ===============================================

function moverJugador(dir) {
    console.log("Mover jugador →", dir);
    // implementar la lógica real del movimiento del juego
}

function disparar() {
    console.log("DISPARO!");
}

function ataqueEspecial() {
    console.log("ATAQUE ESPECIAL!");
}

// ===============================================
// 4. HUD - BATERÍA
// ===============================================

function actualizarHUD_Bateria(percent) {
    const el = document.getElementById("hud-bateria");
    if (!el) return;
    el.innerText = percent + "%";
}

// ===============================================
// 5. ESTADOS DEL JUEGO
// ===============================================

function iniciarJuego() {
    console.log("Juego iniciado");
}

function pausarJuego() {
    console.log("Pausa");
}

function gameOver() {
    console.log("Fin del juego");
}


// Inicialización
(function init() {
    window.__embedParams = parseHash();
    gameSounds.preload();
    renderLeaderboard(UI.$leaderboardContainer);

    // ESP32

    // Listeners
    UI.$start.addEventListener('click', startGame);
    UI.$configure.addEventListener('click', () => {
        openConfigModal(safeParseInt(UI.$playerCountSelect ? UI.$playerCountSelect.value : 1), UI.$playersConfig);
        UI.$controlsModal.classList.remove('hidden');
    });
    UI.$closeConfig.addEventListener('click', () => UI.$controlsModal.classList.add('hidden'));
    UI.$saveConfig.addEventListener('click', () => { UI.$controlsModal.classList.add('hidden'); alert('Controles guardados'); });
    UI.$resumeBtn.addEventListener('click', resumeAll);
    UI.$restartPause.addEventListener('click', () => location.reload());

    // Audio unlock
    window.addEventListener('click', function _enableAudioOnce() {
        if (gameSounds.available) {
            const bg = gameSounds.items['bg'];
            if (bg && bg.paused) try { bg.play().then(() => bg.pause()); } catch (e) { }
        }
        window.removeEventListener('click', _enableAudioOnce);
    });
})();

let instances = [];

function startGame() {
    buildInstances();
    instances.forEach(i => i.start());
    UI.$menu.classList.add('hidden');
    renderLeaderboard(UI.$leaderboardContainer);
    try { if (gameSounds.available) gameSounds.playLoop('bg'); } catch (e) { }
}

function buildInstances() {
    UI.$gameWrapper.innerHTML = '';
    instances = [];
    const numPlayers = safeParseInt(UI.$playerCountSelect ? UI.$playerCountSelect.value : 1, 1);
    const mode = (UI.$modeSelect && UI.$modeSelect.value) ? UI.$modeSelect.value : (window.__embedParams && window.__embedParams.mode) || 'math';
    const gameType = (UI.$gameTypeSelect && UI.$gameTypeSelect.value) ? UI.$gameTypeSelect.value : (window.__embedParams && window.__embedParams.type) || 'lives';

    if (numPlayers === 1) {
        instances.push(new GameInstance(0, mode, UI.$gameWrapper, 0, gameType));
    } else {
        instances.push(
            new GameInstance(0, mode, UI.$gameWrapper, 0, gameType),
            new GameInstance(1, mode, UI.$gameWrapper, 1, gameType)
        );
    }
}

function goToMenu() {
    instances.forEach(i => i.stop());
    gameSounds.stop('bg');
    gameSounds.stopLoop();
    UI.$gameWrapper.innerHTML = '';
    instances = [];
    UI.$menu.classList.remove('hidden');
    document.querySelectorAll('.board').forEach(b => b.classList.remove('paused'));
}

// Event listener para el botón "Volver al menú" desde GameInstance
window.addEventListener('game-go-menu', goToMenu);

// Global Input (prevent scroll & pause)
window.addEventListener('keydown', (e) => {
    const blockedKeys = new Set([37, 38, 39, 40, 32, 65, 68, 83, 87]);
    const code = e.keyCode || e.which;
    if (blockedKeys.has(code)) {
        const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : null;
        if (tag !== 'input' && tag !== 'textarea') {
            e.preventDefault();
            e.stopPropagation();
        }
    }
    instances.forEach(inst => {
        const cfg = controlsConfig[inst.controlsOffset];
        if (cfg && cfg.inputType === 'keyboard') inst.handleKeyDown(code);
    });
    
    // Check Pause combo
    window._globalKeys = window._globalKeys || {};
    window._globalKeys[code] = true;
    let pauseNow = false;
    for(const inst of instances){
        const cfg = controlsConfig[inst.controlsOffset];
        if(!cfg || cfg.inputType !== 'keyboard') continue;
        const kb = cfg.keyboard;
        if(window._globalKeys[kb.left] && window._globalKeys[kb.right]) { pauseNow = true; break; }
    }
    if(pauseNow) togglePauseAll();
});

window.addEventListener('keyup', (e) => {
    const code = e.keyCode || e.which;
    window._globalKeys = window._globalKeys || {};
    window._globalKeys[code] = false;
    instances.forEach(inst => inst.handleKeyUp && inst.handleKeyUp(code));
});

window.addEventListener('instance-toggle-pause', () => togglePauseAll());

function togglePauseAll() {
    const anyRunning = instances.some(i => i.running);
    if (anyRunning) {
        instances.forEach(i => i.stop());
        UI.$pauseMenu.classList.remove('hidden');
        document.querySelectorAll('.board').forEach(b => b.classList.add('paused'));
        gameSounds.stop('bg');
    } else {
        resumeAll();
    }
}

function resumeAll() {
    instances.forEach(i => { 
        if (!i._checkEnd()) {
            i.start(); 
            i.blockInputShortly(); 
        }
    });
    UI.$pauseMenu.classList.add('hidden');
    document.querySelectorAll('.board').forEach(b => b.classList.remove('paused'));
    try { if (gameSounds.available) gameSounds.playLoop('bg'); } catch (e) { }
}

// Gamepad polling loop
(function pollGP() {
    requestAnimationFrame(pollGP);
})();
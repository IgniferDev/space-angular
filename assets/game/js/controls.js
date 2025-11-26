import { keyName } from './utils.js';

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

export let controlsConfig = JSON.parse(JSON.stringify(defaultControls));

// Lógica del modal de configuración
export function openConfigModal(numPlayers, container) {
    container.innerHTML = '';
    for (let p = 0; p < numPlayers; p++) {
        const cfg = controlsConfig[p] || JSON.parse(JSON.stringify(defaultControls[0]));
        controlsConfig[p] = cfg; 
        const div = document.createElement('div'); div.className = 'mapping';
        div.innerHTML = `<h3>Jugador ${p + 1}</h3>
      <div>Input: <select id="input-type-${p}"><option value="keyboard">Teclado</option><option value="gamepad">Gamepad</option></select></div>
      <div style="margin-top:8px;"><strong>Teclado:</strong>
        <div>Izquierda: <span id="kb-left-${p}">${keyName(cfg.keyboard.left)}</span> <button data-action="kb-left" data-player="${p}" class="btn small">Asignar</button></div>
        <div>Derecha: <span id="kb-right-${p}">${keyName(cfg.keyboard.right)}</span> <button data-action="kb-right" data-player="${p}" class="btn small">Asignar</button></div>
        <div>Arriba: <span id="kb-up-${p}">${keyName(cfg.keyboard.up)}</span> <button data-action="kb-up" data-player="${p}" class="btn small">Asignar</button></div>
        <div>Abajo: <span id="kb-down-${p}">${keyName(cfg.keyboard.down)}</span> <button data-action="kb-down" data-player="${p}" class="btn small">Asignar</button></div>
        <div>Disparar: <span id="kb-shoot-${p}">${keyName(cfg.keyboard.shoot)}</span> <button data-action="kb-shoot" data-player="${p}" class="btn small">Asignar</button></div>
        <div>Poder: <span id="kb-power-${p}">${keyName(cfg.keyboard.power)}</span> <button data-action="kb-power" data-player="${p}" class="btn small">Asignar</button></div>
      </div>
      <hr margin="15 px 0" style="border-color:#444;">
      <div style="margin-top:8px;"><strong>Gamepad:</strong>
        <div>Asignar gamepad: <span id="gp-index-${p}">${cfg.gamepad.index === null ? 'ninguno' : cfg.gamepad.index}</span> <button data-action="assign-gamepad" data-player="${p}" class="btn small">Asignar</button></div>
      </div>`;
        container.appendChild(div);
        
        const select = div.querySelector(`#input-type-${p}`);
        select.value = cfg.inputType;
        select.addEventListener('change', (ev) => { controlsConfig[p].inputType = ev.target.value; });
        
        const assignButtons = div.querySelectorAll('button[data-action]');
        assignButtons.forEach(btn => {
            const action = btn.getAttribute('data-action');
            const player = parseInt(btn.getAttribute('data-player'));
            btn.addEventListener('click', () => {
                if (action.startsWith('kb-')) listenForKeyboardAssign(action.replace('kb-', ''), player);
                else if (action === 'assign-gamepad') listenForGamepadAssign(player);
            });
        });
    }

    const hr = document.createElement('hr');
    hr.style.margin = "15px 0";
    hr.style.borderColor = "#444";
    container.appendChild(hr);

    const divEsp = document.createElement('div');
    divEsp.className = 'mapping';
    divEsp.innerHTML = `
        <h3>Mando WiFi ESP32</h3>
        <div style="display: flex; gap: 10px; align-items: center; margin-top: 10px;">
            <label>IP del ESP32:</label>
            <input type="text" id="esp-ip-input" placeholder="Ej: 192.168.1.50" style="padding: 5px; width: 140px;">
            <button id="btn-conectar-esp" class="btn primary small">Conectar</button>
        </div>
        <p style="font-size: 0.8em; color: #aaa; margin-top: 5px;">
            Asegúrate de que tu PC y el ESP32 estén en la misma red WiFi.
        </p>
    `;
    container.appendChild(divEsp);

    const btnConnect = divEsp.querySelector('#btn-conectar-esp');
    const inputIp = divEsp.querySelector('#esp-ip-input');

    const savedIp = localStorage.getItem('last_esp_ip');
    if(savedIp) inputIp.value = savedIp;

    btnConnect.addEventListener('click', () => {
        const ip = inputIp.value.trim();
        if (!ip) {
            alert("Por favor escribe una IP válida");
            return;
        }
        
        localStorage.setItem('last_esp_ip', ip);

        window.dispatchEvent(new CustomEvent('request-esp-connect', { detail: { ip: ip } }));
    });
}

function listenForKeyboardAssign(which, player) {
    const span = document.getElementById(`kb-${which}-${player}`);
    if (span) span.textContent = 'Pulsar tecla...';
    function handlerAssign(e) {
        e.preventDefault();
        controlsConfig[player].keyboard[which] = e.keyCode;
        if (span) span.textContent = keyName(e.keyCode);
        window.removeEventListener('keydown', handlerAssign);
    }
    window.addEventListener('keydown', handlerAssign);
}

function listenForGamepadAssign(player) {
    const info = document.getElementById(`gp-index-${player}`);
    if (info) info.textContent = 'Esperando botón...';
    let listening = true;
    const poll = setInterval(() => {
        const gps = navigator.getGamepads ? navigator.getGamepads() : [];
        for (let i = 0; i < gps.length; i++) {
            const gp = gps[i]; if (!gp) continue;
            for (let b = 0; b < gp.buttons.length; b++) {
                if (gp.buttons[b].pressed) {
                    controlsConfig[player].gamepad.index = i;
                    controlsConfig[player].gamepad.shootButton = b;
                    controlsConfig[player].gamepad.powerButton = Math.min(b + 1, gp.buttons.length - 1);
                    if (info) info.textContent = `${i}`;
                    listening = false; clearInterval(poll); return;
                }
            }
        }
    }, 150);
    setTimeout(() => { if (listening) { clearInterval(poll); if (info) info.textContent = 'tiempo agotado'; } }, 10000);
}
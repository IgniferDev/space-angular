// /js/esp32.js
// Conexión ESP32 vía WebServer.h usando polling HTTP
// Controla botones, batería y LEDs del juego.

export const ESPEvents = new EventTarget();

const ESP_IP = "http://192.168.1.120";

// Mapeo ESP32 → keyCodes usados por el juego
const btnToKey = {
    "U": 38, // up
    "D": 40, // down
    "L": 37, // left
    "R": 39, // right
    "A": 32, // disparo
    "B": 69  // ataque especial
};

let lastButton = "none";

// Dispara eventos de teclado falsos
function fakeKeyEvent(type, keyCode) {
    const ev = new KeyboardEvent(type, { keyCode, which: keyCode });
    Object.defineProperty(ev, "keyCode", { get: () => keyCode });
    Object.defineProperty(ev, "which", { get: () => keyCode });
    window.dispatchEvent(ev);
}

// Poll de botones cada 50ms
function pollButtons() {
    setInterval(async () => {
        try {
            const res = await fetch(`${ESP_IP}/btn`);
            if (!res.ok) return;

            const btn = (await res.text()).trim();

            // Ningún botón presionado
            if (btn === "none") {
                if (lastButton !== "none") {
                    const k = btnToKey[lastButton];
                    if (k) fakeKeyEvent("keyup", k);
                }
                lastButton = "none";
                return;
            }

            // Cambio de botón
            if (btn !== lastButton) {
                // suelta anterior
                if (lastButton !== "none") {
                    const up = btnToKey[lastButton];
                    if (up) fakeKeyEvent("keyup", up);
                }

                // presiona nuevo
                const down = btnToKey[btn];
                if (down) fakeKeyEvent("keydown", down);

                lastButton = btn;
            }

        } catch (e) {
            console.warn("ESP32 desconectado");
        }
    }, 50);
}

// Poll de nivel de batería cada 5s
function pollBattery() {
    setInterval(async () => {
        try {
            const res = await fetch(`${ESP_IP}/battery`);
            const nivel = parseInt(await res.text());

            ESPEvents.dispatchEvent(
                new CustomEvent("esp-battery", { detail: { nivel } })
            );
        } catch {}
    }, 5000);
}

// Cambiar estado de LED juego
export async function setGameLED(state) {
    try {
        await fetch(`${ESP_IP}/led/game?state=${state}`);
    } catch (e) {
        console.warn("No se pudo enviar LED:", e);
    }
}

// Iniciar todo
export function startESPReceiver() {
    pollButtons();
    pollBattery();
}

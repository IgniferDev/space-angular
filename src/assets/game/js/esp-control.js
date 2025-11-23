// js/esp-bridge.js

// ⚠️ PON AQUÍ LA IP DE TU ESP32
const ESP_IP = "10.221.12.20"; 

let loopId = null;

export function conectarMandoESP(instances) {
    console.log("📡 Intentando conectar con Mando ESP32...");

    // 1. Mandamos señal de inicio para encender el LED VERDE
    fetch(`http://${ESP_IP}/inicio`)
        .then(() => console.log("✅ LED Verde encendido en ESP32"))
        .catch(e => console.error("Error conectando (Revisa la IP o CORS):", e));

    // 2. Iniciamos el bucle que lee los botones cada 50ms
    if (loopId) clearInterval(loopId);
    
    loopId = setInterval(async () => {
        // Si no hay partida corriendo, no hacemos nada
        if (!instances || !instances[0] || !instances[0].running) return;

        try {
            // Pedimos el estado al ESP32
            const response = await fetch(`http://${ESP_IP}/estado`);
            const data = await response.json();
            const btn = data.botones; // {u: 1, d: 0, ...}
            
            // Controlamos directamente al Jugador 1 (instances[0])
            const player = instances[0];

            // Mapeo de tus botones a las funciones del juego 
            if (btn.l === 1) player.moveLeft();
            if (btn.r === 1) player.moveRight();
            if (btn.u === 1) player.setFacingUp();
            if (btn.d === 1) player.setFacingDown();
            
            // Botón A disparar, Botón B poder
            if (btn.a === 1) player.tryShoot();
            if (btn.b === 1) player.tryPower();

        } catch (err) {
            // Si falla la conexión momentáneamente, no saturamos la consola
        }
    }, 50); // 50ms es una buena velocidad de respuesta
}

export function desconectarMandoESP() {
    if (loopId) clearInterval(loopId);
    // Mandamos señal para apagar LED Verde y poner ROJO
    fetch(`http://${ESP_IP}/fin`).catch(() => {});
}
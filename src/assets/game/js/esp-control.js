// js/esp-control.js

let ESP_IP = ""; // Ahora es variable, se llena desde la interfaz
let loopId = null;

// Ahora la función recibe la IP y las instancias del juego
export function conectarMandoESP(ipIngresada, instances) {
    ESP_IP = ipIngresada; // Guardamos la IP

    console.log(`Intentando conectar con Mando ESP32 en ${ESP_IP}...`);

    // 1. Mandamos señal de inicio para encender el LED VERDE
    fetch(`http://${ESP_IP}/inicio`)
        .then(res => {
            if (res.ok) {
                console.log("Conexión Exitosa: LED Verde encendido");
                alert("¡Conectado al ESP32! LED Verde activo.");
            }
        })
        .catch(e => {
            console.error("Error conectando:", e);
            alert("Error: No se pudo conectar. Revisa la IP y que el ESP32 esté encendido.");
        });

    // 2. Iniciamos el bucle de lectura
    if (loopId) clearInterval(loopId);
    
    loopId = setInterval(async () => {
        // Si no hay partida corriendo, no hacemos nada
        if (!instances || !instances.length || !instances[0].running) return;

        try {
            // Usamos la variable ESP_IP dinámica
            const response = await fetch(`http://${ESP_IP}/estado`);
            const data = await response.json();
            const btn = data.botones; 
            
            const player = instances[0];

            if (btn.l === 1) player.moveLeft();
            if (btn.r === 1) player.moveRight();
            if (btn.u === 1) player.setFacingUp();
            if (btn.d === 1) player.setFacingDown();
            if (btn.a === 1) player.tryShoot();
            if (btn.b === 1) player.tryPower();

        } catch (err) {
            // Silencioso
        }
    }, 50);
}

export function desconectarMandoESP() {
    if (loopId) clearInterval(loopId);
    if (ESP_IP) {
        fetch(`http://${ESP_IP}/fin`).catch(() => {});
    }
}
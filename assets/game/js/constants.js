/* constants.js */

// Dimensiones y posiciones
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;
export const POSITIONS_X = [120, 360, 600];
export const ENEMY_TOP_Y = 40;
export const ENEMY_BOTTOM_Y = 300;
export const PLAYER_Y_MIDDLE = 420 - 220; // Posición vertical del jugador

// Tiempos y mecánicas
export const POWER_DURATION_MS = 7000;       // Duración del poder "ocultar enemigos"
export const UNPAUSE_INPUT_BLOCK_MS = 300;   // Pequeño bloqueo al reanudar para no disparar por error
export const TIMER_START_SECONDS = 25;       // Tiempo inicial en modo Contra Reloj
export const TIMER_ON_CORRECT_BASE = 3;      // Segundos ganados por acierto
export const TIMER_ON_WRONG_BASE = 5;        // Segundos perdidos por error
export const ROUNDS_EVERY_N_CORRECT = 8;     // Aciertos para subir de ronda

// Claves de almacenamiento
export const LEADERBOARD_KEY = 'si_leaderboard_v1';

// NOTA: La constante 'BANKS' se ha eliminado porque ahora
// las preguntas se cargan dinámicamente desde question-manager.js
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;
export const POSITIONS_X = [120, 360, 600];
export const ENEMY_TOP_Y = 40;
export const ENEMY_BOTTOM_Y = 300;
export const PLAYER_Y_MIDDLE = 420 - 220; // mantiene el área visible original
export const POWER_DURATION_MS = 7000;
export const UNPAUSE_INPUT_BLOCK_MS = 300;
export const TIMER_START_SECONDS = 25;
export const TIMER_ON_CORRECT_BASE = 3;
export const TIMER_ON_WRONG_BASE = 5;
export const ROUNDS_EVERY_N_CORRECT = 8;
export const LEADERBOARD_KEY = 'si_leaderboard_v1';

export const BANKS = {
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
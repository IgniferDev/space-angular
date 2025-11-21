import { ensureDom } from './utils.js';

export const $menu = ensureDom(document.getElementById('menu'), 'menu');
export const $start = ensureDom(document.getElementById('start-game'), 'start-game');
export const $configure = ensureDom(document.getElementById('configure-controls'), 'configure-controls');
export const $controlsModal = ensureDom(document.getElementById('controls-config'), 'controls-config');
export const $playersConfig = ensureDom(document.getElementById('players-config'), 'players-config');
export const $closeConfig = ensureDom(document.getElementById('close-config'), 'close-config');
export const $saveConfig = ensureDom(document.getElementById('save-config'), 'save-config');
export const $playerCountSelect = document.getElementById('player-count');
export const $modeSelect = document.getElementById('mode-select');
export const $gameTypeSelect = document.getElementById('game-type-select');
export const $gameWrapper = ensureDom(document.getElementById('game-wrapper'), 'game-wrapper');
export const $pauseMenu = ensureDom(document.getElementById('pause-menu'), 'pause-menu');
export const $resumeBtn = ensureDom(document.getElementById('resume'), 'resume');
export const $restartPause = ensureDom(document.getElementById('restart-pause'), 'restart-pause');
export const $leaderboardContainer = ensureDom(document.getElementById('leaderboard'), 'leaderboard');
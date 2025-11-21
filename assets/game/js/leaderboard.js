import { LEADERBOARD_KEY } from './constants.js';
import { escapeHtml } from './utils.js';

export function loadLeaderboard() {
    try {
        const raw = localStorage.getItem(LEADERBOARD_KEY);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch (e) {
        console.warn('leaderboard read error', e);
        return [];
    }
}

export function saveLeaderboard(arr) {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(arr.slice(0, 100)));
}

export function addScoreToLeaderboard(entry) {
    const arr = loadLeaderboard();
    arr.push(entry);
    arr.sort((a, b) => (b.score - a.score) || (b.rounds - a.rounds) || (new Date(b.date) - new Date(a.date)));
    saveLeaderboard(arr);
    // renderLeaderboard se llama desde UI o Main, no aquí para evitar dependencias circulares si es posible, 
    // pero para mantener la lógica original, lo exportaremos y llamaremos desde fuera.
}

export function clearLeaderboard() {
    localStorage.removeItem(LEADERBOARD_KEY);
}

export function renderLeaderboard(container) {
    if (!container) return;
    const arr = loadLeaderboard();
    const top = arr.slice(0, 10);
    let html = `<div class="leaderboard-inner"><h3>Top 10</h3>`;
    if (top.length === 0) html += `<div class="empty">Aún no hay puntajes</div>`;
    else {
        html += `<table class="lb-table"><thead><tr><th>#</th><th>Nombre</th><th>Pts</th><th>Modo</th><th>Tipo</th><th>Rondas</th><th>Fecha</th></tr></thead><tbody>`;
        top.forEach((r, i) => {
            html += `<tr><td>${i + 1}</td><td>${escapeHtml(r.name || '---')}</td><td>${r.score}</td><td>${escapeHtml(r.mode)}</td><td>${escapeHtml(r.gameType)}</td><td>${r.rounds}</td><td>${new Date(r.date).toLocaleString()}</td></tr>`;
        });
        html += `</tbody></table>`;
    }
    html += `<div style="margin-top:8px"><button id="clear-lb" class="btn small">Borrar tabla</button></div></div>`;
    container.innerHTML = html;
    
    const btn = container.querySelector('#clear-lb');
    if (btn) btn.addEventListener('click', () => {
        if (confirm('Borrar tabla de puntajes?')) {
            clearLeaderboard();
            renderLeaderboard(container);
        }
    });
}
export function shuffle(arr) {
    return arr && arr.length ? arr.slice().sort(() => Math.random() - 0.5) : [];
}

export function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
}

export function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[c]);
}

export function keyName(code) {
    if (code === null || code === undefined) return 'ninguno';
    const map = {
        32: 'Space', 37: 'Left', 38: 'Up', 39: 'Right', 40: 'Down',
        65: 'A', 68: 'D', 70: 'F', 71: 'G', 69: 'E', 83: 'S', 87: 'W'
    };
    return map[code] || ('KeyCode ' + code);
}

export function safeParseInt(v, fallback = 1) {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : fallback;
}

export function parseHash() {
    const h = location.hash.replace(/^#/, '');
    const obj = {};
    h.split('&').forEach(part => {
        if (!part) return;
        const [k, v] = part.split('=');
        if (k) obj[k] = decodeURIComponent(v || '');
    });
    return obj;
}

export function ensureDom(elem, id, parent = document.body) {
    if (elem) return elem;
    const node = document.createElement('div');
    node.id = id;
    parent.appendChild(node);
    return node;
}
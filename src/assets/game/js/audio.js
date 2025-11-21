export const gameSounds = {
    available: false,
    items: {},
    base: 'audio/',

    preload() {
        try {
            const make = (name, file, opts = {}) => {
                try {
                    const a = new Audio(this.base + file);
                    a.preload = 'auto';
                    if (opts.loop) a.loop = true;
                    if (opts.volume !== undefined) a.volume = opts.volume;
                    this.items[name] = a;
                } catch (e) {
                    console.warn('Audio create fail', name, e);
                }
            };
            make('shoot', 'shoot.wav', { volume: 0.6 });
            make('explosion', 'explosion.wav', { volume: 0.5 });
            make('correct', 'correct.wav', { volume: 0.7 });
            make('wrong', 'wrong.wav', { volume: 0.7 });
            make('bg', 'music.wav', { loop: true, volume: 0.14 });
            this.available = true;
        } catch (e) {
            console.warn('gameSounds preload failed', e);
            this.available = false;
        }
    },

    play(name) {
        try {
            if (!this.available) return;
            const a = this.items[name];
            if (!a) return;
            try { a.pause(); } catch (e) { }
            try { a.currentTime = 0; } catch (e) { }
            a.play().catch(() => { /* blocked until interaction */ });
        } catch (e) { }
    },

    playLoop(name) {
        try {
            if (!this.available) return;
            const a = this.items[name];
            if (!a) return;
            if (!a.loop) a.loop = true;
            a.play().catch(() => { });
            this._loopRef = a;
        } catch (e) { }
    },

    stopLoop() {
        try {
            if (this._loopRef) {
                this._loopRef.pause();
                this._loopRef.currentTime = 0;
                this._loopRef = null;
            }
        } catch (e) { }
    },

    stop(name) {
        try {
            const a = this.items[name];
            if (a) { a.pause(); a.currentTime = 0; }
        } catch (e) { }
    }
};
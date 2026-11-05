/* In-memory session. Editing or clearing a key invalidates pending calculations. */
(function () {
  'use strict';
  class AuthSession {
    constructor(core = TotpCore, now = () => Date.now() / 1000) {
      this.core = core; this.now = now; this.version = 0; this.clear();
    }
    clear() {
      this.version++; this.key = null; this.code = ''; this.counter = null;
      this.config = null; this.pending = null;
    }
    async start(secret) {
      this.clear(); const version = this.version; let config;
      try {
        config = this.core.parse(secret);
        const key = await this.core.key(config);
        if (version !== this.version) return false;
        this.key = key;
        this.config = {period: config.period, digits: config.digits, algorithm: config.algorithm};
        await this.refresh();
        return version === this.version && Boolean(this.key);
      } finally { config?.bytes?.fill(0); }
    }
    get snapshot() {
      if (!this.config) return {active: false, code: '', remaining: 0, period: 30};
      const now = this.now(), counter = Math.floor(now / this.config.period);
      return {active: true, code: this.counter === counter ? this.code : '',
        remaining: Math.ceil(this.config.period - now % this.config.period), ...this.config};
    }
    async refresh() {
      if (!this.key) return;
      const now = this.now(), counter = Math.floor(now / this.config.period);
      if (this.counter === counter && this.code) return;
      if (this.pending) return this.pending;
      const version = this.version, key = this.key, {period, digits} = this.config;
      this.code = ''; this.counter = null;
      const work = (async () => {
        const code = await this.core.generate(key, now, period, digits);
        if (version !== this.version || Math.floor(this.now() / period) !== counter) return;
        this.code = code; this.counter = counter;
      })();
      this.pending = work;
      try { await work; } finally { if (this.pending === work) this.pending = null; }
    }
  }
  globalThis.AuthSession = AuthSession;
})();

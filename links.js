(function () {
  'use strict';
  function read(hash) {
    const fragment = hash.replace(/^#/, '');
    if (fragment.length > 12000) throw new Error('Link too long');
    if (!fragment) return {key: '', lang: ''};
    if (!fragment.includes('=')) return {key: decodeURIComponent(fragment), lang: ''};
    const params = new URLSearchParams(fragment);
    return {key: params.get('key') || params.get('secret') || '', lang: params.get('lang') || ''};
  }
  function create(base, key, lang) {
    if (!key.trim() || key.length > 4096) throw new Error('Invalid key');
    const url = new URL(base); url.search = ''; url.hash = '';
    const params = new URLSearchParams({key: key.trim(), lang});
    url.hash = params.toString(); return url.href;
  }
  function language(preferences, supported, fallback='en') {
    const exact = new Map(supported.map(code => [code.toLowerCase(), code]));
    const aliases = {nb: 'no', nn: 'no', tl: 'fil', iw: 'he'};
    for (const p of preferences) {
      const parts = String(p || '').toLowerCase().replace(/_/g, '-').split('-');
      let variant;
      if (parts[0] === 'zh') {
        variant = parts.includes('hant') ? 'zh-Hant' : parts.includes('hans') ? 'zh' : parts.some(part => ['tw','hk','mo'].includes(part)) ? 'zh-Hant' : null;
      } else if (parts[0] === 'pa') {
        variant = parts.includes('arab') ? 'pa-Arab' : parts.includes('guru') ? 'pa' : parts.includes('pk') ? 'pa-Arab' : null;
      }
      if (variant && supported.includes(variant)) return variant;
      while (parts.length) {
        const candidate = parts.join('-');
        if (exact.has(candidate)) return exact.get(candidate);
        if (parts.length === 1 && aliases[candidate] && exact.has(aliases[candidate])) return exact.get(aliases[candidate]);
        parts.pop();
      }
    }
    return fallback;
  }
  globalThis.AuthLinks = {read, create, language};
})();

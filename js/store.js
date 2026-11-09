// Persistence: everything lives in localStorage on her phone.
const KEY = 'momentum.v1';

export function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && s.version === 1) return migrate(s);
  } catch (e) {
    console.warn('Could not read saved data', e);
  }
  return null;
}

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Could not save', e);
  }
}

export function clear() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

export function fresh(profile) {
  return migrate({ version: 1, profile, createdAt: Date.now() });
}

function migrate(s) {
  s.rotation ??= 0;
  s.ex ??= {};
  s.sessions ??= [];
  s.weights ??= [];
  s.medals ??= {};
  s.stats ??= {};
  s.stats.prs ??= 0;
  s.stats.weightUps ??= 0;
  s.stats.finishers ??= 0;
  s.stats.perfect ??= 0;
  s.stats.bestPlank ??= 0;
  s.settings ??= { sound: true };
  s.settings.sets ??= 3;
  s.active ??= null;
  return s;
}

export function exportJSON(state) {
  return JSON.stringify(state, null, 2);
}

export function importJSON(text) {
  const s = JSON.parse(text);
  if (!s || s.version !== 1 || !s.profile) throw new Error('This doesn’t look like a backup file from this app.');
  return migrate(s);
}

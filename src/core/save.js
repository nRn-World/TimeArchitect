// Versioned local persistence with a rolling backup and corruption recovery.
const STORAGE_KEY = 'time-architect.save.v2';
const BACKUP_KEY = 'time-architect.save.v2.backup';
export const SAVE_VERSION = 2;
export const LEVEL_COUNT = 12;

export const DEFAULT_SETTINGS = Object.freeze({
  music: 0.55,
  sfx: 0.7,
  reducedMotion: false,
  highContrast: false,
  largeTargets: false,
  haptics: true,
  ghosts: true,
  hints: true,
  quality: 'high'
});

function memoryStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key)
  };
}

function resolveStorage() {
  try {
    const storage = window.localStorage;
    const probe = '__time_architect_probe__';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    return memoryStorage();
  }
}

export function defaultProgress() {
  return {
    completed: {},
    best: {},
    unlocked: 0,
    seenHints: {},
    lastLevel: 'c01',
    seenHowto: false,
    seenEnding: false
  };
}

export function defaultSave() {
  return { version: SAVE_VERSION, locale: null, settings: { ...DEFAULT_SETTINGS }, progress: defaultProgress() };
}

function asRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? { ...value } : {};
}

function normalize(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const settingsRaw = asRecord(raw.settings);
  const progressRaw = asRecord(raw.progress);
  const settings = { ...DEFAULT_SETTINGS };
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    const fallback = DEFAULT_SETTINGS[key];
    const value = settingsRaw[key];
    if (typeof fallback === 'boolean') settings[key] = typeof value === 'boolean' ? value : fallback;
    else if (typeof fallback === 'number') settings[key] = typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback;
    else if (key === 'quality') settings[key] = ['low', 'medium', 'high'].includes(value) ? value : fallback;
  }
  const completed = {};
  for (const [id, value] of Object.entries(asRecord(progressRaw.completed))) {
    if (value) completed[id] = true;
  }
  const best = {};
  for (const [id, value] of Object.entries(asRecord(progressRaw.best))) {
    if (Number.isFinite(value) && value > 0) best[id] = Math.round(value);
  }
  let unlocked = Number.isInteger(progressRaw.unlocked) ? progressRaw.unlocked : Object.keys(completed).length;
  unlocked = Math.max(0, Math.min(LEVEL_COUNT - 1, unlocked));

  return {
    version: SAVE_VERSION,
    locale: typeof raw.locale === 'string' ? raw.locale : null,
    settings,
    progress: {
      completed,
      best,
      unlocked,
      seenHints: asRecord(progressRaw.seenHints),
      lastLevel: typeof progressRaw.lastLevel === 'string' ? progressRaw.lastLevel : 'c01',
      seenHowto: Boolean(progressRaw.seenHowto),
      seenEnding: Boolean(progressRaw.seenEnding)
    }
  };
}

/**
 * Loads the save, falling back to the rolling backup and finally to defaults.
 * @returns {{save: object, recovered: boolean, fresh: boolean}}
 */
export function loadSave() {
  const storage = resolveStorage();
  const read = (key) => {
    try {
      const raw = storage.getItem(key);
      if (!raw) return null;
      return normalize(JSON.parse(raw));
    } catch {
      return null;
    }
  };

  const primary = read(STORAGE_KEY);
  if (primary) return { save: primary, recovered: false, fresh: false };

  const backup = read(BACKUP_KEY);
  if (backup) return { save: backup, recovered: true, fresh: false };

  const existed = storage.getItem(STORAGE_KEY) !== null || storage.getItem(BACKUP_KEY) !== null;
  return { save: defaultSave(), recovered: existed, fresh: !existed };
}

export function persistSave(save) {
  const storage = resolveStorage();
  try {
    const previous = storage.getItem(STORAGE_KEY);
    if (previous) {
      try {
        JSON.parse(previous);
        storage.setItem(BACKUP_KEY, previous);
      } catch {
        /* corrupt primary: do not copy it over a good backup */
      }
    }
    storage.setItem(STORAGE_KEY, JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
}

export function resetProgress(save) {
  return { ...save, progress: defaultProgress() };
}

export function markCompleted(save, levelId, moves) {
  const progress = save.progress;
  progress.completed[levelId] = true;
  const best = progress.best[levelId];
  progress.best[levelId] = Number.isFinite(best) ? Math.min(best, moves) : moves;
  const index = Number(levelId.replace('c', '')) - 1;
  progress.unlocked = Math.min(LEVEL_COUNT - 1, Math.max(progress.unlocked, index + 1));
  return save;
}

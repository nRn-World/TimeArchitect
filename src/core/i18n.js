import en from '../data/locales/en.js';
import sv from '../data/locales/sv.js';
import tr from '../data/locales/tr.js';
import es from '../data/locales/es.js';
import ar from '../data/locales/ar.js';
import fr from '../data/locales/fr.js';
import ja from '../data/locales/ja.js';

export const LOCALES = Object.freeze([
  { code: 'en', name: 'English', flag: 'gb', dir: 'ltr' },
  { code: 'sv', name: 'Svenska', flag: 'se', dir: 'ltr' },
  { code: 'tr', name: 'Türkçe', flag: 'tr', dir: 'ltr' },
  { code: 'es', name: 'Español', flag: 'es', dir: 'ltr' },
  { code: 'ar', name: 'العربية', flag: 'sa', dir: 'rtl' },
  { code: 'fr', name: 'Français', flag: 'fr', dir: 'ltr' },
  { code: 'ja', name: '日本語', flag: 'jp', dir: 'ltr' }
]);

export const DICTS = Object.freeze({ en, sv, tr, es, ar, fr, ja });
export const DEFAULT_LOCALE = 'en';

export function localeInfo(code) {
  return LOCALES.find((locale) => locale.code === code) || LOCALES[0];
}

export function detectLocale(candidates = []) {
  for (const raw of candidates) {
    if (!raw) continue;
    const base = String(raw).toLowerCase().split('-')[0];
    if (DICTS[base]) return base;
  }
  return DEFAULT_LOCALE;
}

function interpolate(template, params) {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => (Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : match));
}

/**
 * Creates a translate function. Missing keys fall back to English, then to the key itself.
 */
export function makeT(code) {
  const dict = DICTS[code] || DICTS[DEFAULT_LOCALE];
  return function translate(key, params) {
    const value = dict[key] ?? en[key] ?? key;
    return interpolate(value, params);
  };
}

/** Keys that appear in all locales, used by the localization tests. */
export function localeKeys() {
  return Object.keys(en);
}

export function placeholdersOf(value) {
  return (String(value).match(/\{(\w+)\}/g) || []).sort();
}

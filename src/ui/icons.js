// Inline SVG icon set. All icons are drawn on a 24px grid with a 1.75 stroke so
// they stay legible next to the game's serif/display type at small sizes.
const PATHS = {
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  restart: '<path d="M20 11a8 8 0 1 0-2.35 6.35"/><path d="M20 4v7h-7"/>',
  hint: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4.2 12.6c.75.56 1.2 1.35 1.2 2.4h6c0-1.05.45-1.84 1.2-2.4A7 7 0 0 0 12 2Z"/>',
  pause: '<rect x="7" y="5" width="3.6" height="14" rx="1.3"/><rect x="13.4" y="5" width="3.6" height="14" rx="1.3"/>',
  play: '<path d="M8 5.4v13.2L19 12z" fill="currentColor" stroke="none"/>',
  rewind: '<path d="M11 6.2v11.6L2.6 12z" fill="currentColor" stroke="none"/><path d="M21.4 6.2v11.6L13 12z" fill="currentColor" stroke="none"/>',
  fast: '<path d="M2.6 6.2v11.6L11 12z" fill="currentColor" stroke="none"/><path d="M13 6.2v11.6L21.4 12z" fill="currentColor" stroke="none"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  chevronLeft: '<path d="M15 18l-6-6 6-6"/>',
  chevronRight: '<path d="M9 18l6-6-6-6"/>',
  arrowUp: '<path d="M12 19V5"/><path d="M5 12l7-7 7 7"/>',
  arrowDown: '<path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/>',
  arrowLeft: '<path d="M19 12H5"/><path d="M12 5l-7 7 7 7"/>',
  arrowRight: '<path d="M5 12h14"/><path d="M12 19l7-7-7-7"/>',
  wait: '<circle cx="12" cy="12" r="8" opacity="0.32"/><circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none"/>',
  dial: '<circle cx="12" cy="12" r="8.2"/><path d="M12 7.2V12l3 1.9"/>',
  drone: '<path d="M12 2.8l7.4 4.3v9.8L12 21.2l-7.4-4.3V7.1z"/><circle cx="12" cy="12" r="2.6"/>',
  lock: '<rect x="4.8" y="10" width="14.4" height="10.2" rx="2.2"/><path d="M8.2 10V7.4a3.8 3.8 0 0 1 7.6 0V10"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  clock: '<circle cx="12" cy="12" r="8.6"/><path d="M12 6.6V12l3.4 2.2"/>',
  globe: '<circle cx="12" cy="12" r="8.6"/><path d="M3.4 12h17.2"/><path d="M12 3.4c2.6 2.4 4 5.4 4 8.6s-1.4 6.2-4 8.6c-2.6-2.4-4-5.4-4-8.6s1.4-6.2 4-8.6Z"/>'
};

export function icon(name, className = '') {
  const body = PATHS[name] || '';
  return `<svg class="icon${className ? ` ${className}` : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
}

export const ICON_NAMES = Object.keys(PATHS);

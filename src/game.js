import { LEVEL_DEFS } from './data/levels.js';
import { parseLevel } from './core/level.js';
import { applyAction, createState, previewTick } from './core/sim.js';
import { loadSave, persistSave, markCompleted, resetProgress, LEVEL_COUNT } from './core/save.js';
import { LOCALES, detectLocale, localeInfo, makeT } from './core/i18n.js';
import { Sound } from './core/audio.js';
import { createInput } from './core/input.js';
import { Scene } from './render/scene.js';
import * as UI from './ui/screens.js';

const TAP_SLOP = 16;

export function boot() {
  const canvas = document.getElementById('stage');
  const hud = document.getElementById('hud');
  const ui = document.getElementById('ui');
  const dom = {
    level: document.getElementById('hud-level'),
    sub: document.getElementById('hud-sub'),
    moves: document.getElementById('hud-moves'),
    par: document.getElementById('hud-par'),
    anchors: document.getElementById('hud-anchors'),
    undo: document.getElementById('hud-undo'),
    restart: document.getElementById('hud-restart'),
    pause: document.getElementById('hud-pause'),
    hintButton: document.getElementById('hud-hint'),
    objects: document.getElementById('objects'),
    rates: document.getElementById('rates'),
    hint: document.getElementById('hint'),
    hintText: document.getElementById('hint-text'),
    toast: document.getElementById('toast'),
    banner: document.getElementById('banner')
  };

  const { save, recovered } = loadSave();
  const app = {
    save,
    levels: LEVEL_DEFS.map((def, index) => parseLevel({ ...def, index })),
    locale: null,
    t: null,
    screen: 'title',
    level: null,
    state: null,
    history: [],
    selected: null,
    modal: null,
    confirmReset: false,
    returnTo: 'title',
    scene: new Scene(canvas),
    audio: new Sound(),
    recovered
  };

  app.locale = save.locale || detectLocale([navigator.language, ...(navigator.languages || [])]);
  app.t = makeT(app.locale);
  applyLocale(app);
  applySettings(app);

  app.scene.load(app.levels[0], createState(app.levels[0]));
  app.scene.start();

  window.addEventListener('orientationchange', () => app.scene.resize());

  let toastTimer = 0;

  /* ---------- helpers ---------- */

  function toast(message) {
    dom.toast.textContent = message;
    dom.toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      dom.toast.hidden = true;
    }, 2400);
  }

  function banner(message) {
    dom.banner.textContent = message;
    dom.banner.hidden = false;
    window.setTimeout(() => {
      dom.banner.hidden = true;
    }, 1600);
  }

  function persist() {
    persistSave(app.save);
  }

  function applyLocale() {
    document.documentElement.lang = app.locale;
    document.documentElement.dir = localeInfo(app.locale).dir;
    app.t = makeT(app.locale);
  }

  function applySettings() {
    const settings = app.save.settings;
    document.body.classList.toggle('large-targets', settings.largeTargets);
    document.body.classList.toggle('high-contrast', settings.highContrast);
    app.scene.setOptions({
      reducedMotion: settings.reducedMotion,
      highContrast: settings.highContrast,
      quality: settings.quality,
      ghosts: settings.ghosts
    });
    app.audio.setVolumes({ music: settings.music, sfx: settings.sfx });
    if (settings.music <= 0.001) app.audio.stopAmbient();
    else if (app.audio.ambientOn) app.audio.startAmbient();
  }

  function unlockAudio() {
    app.audio.unlock();
    if (app.save.settings.music > 0.001) app.audio.startAmbient();
  }
  window.addEventListener('pointerdown', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });

  /* ---------- screens ---------- */

  function screenHTML() {
    switch (app.screen) {
      case 'language':
        return UI.languageScreen(app);
      case 'levels':
        return UI.levelsScreen(app);
      case 'howto':
        return UI.howtoScreen(app);
      case 'settings':
        return UI.settingsScreen(app);
      case 'credits':
        return UI.creditsScreen(app);
      case 'privacy':
        return UI.privacyScreen(app);
      case 'ending':
        return UI.endingScreen(app);
      case 'title':
      default:
        return UI.titleScreen(app);
    }
  }

  function modalHTML() {
    if (app.modal === 'pause') return UI.modalPause(app);
    if (app.modal === 'win') return UI.modalWin(app);
    if (app.modal === 'fail') return UI.modalFail(app);
    return '';
  }

  function render() {
    ui.dataset.modal = app.modal ? 'true' : 'false';
    if (app.screen === 'play') {
      hud.hidden = false;
      ui.innerHTML = modalHTML();
      updateHud();
    } else {
      hud.hidden = true;
      ui.innerHTML = screenHTML();
    }
    document.body.dataset.screen = app.screen;
  }

  function showScreen(name, { returnTo = null } = {}) {
    if (returnTo) app.returnTo = returnTo;
    if (name === 'title' || name === 'language') app.returnTo = name;
    app.screen = name;
    app.modal = null;
    app.confirmReset = false;
    render();
    ui.scrollTop = 0;
  }

  function openModal(name) {
    app.modal = name;
    render();
  }

  function closeModal() {
    app.modal = null;
    render();
  }

  /* ---------- HUD ---------- */

  function updateHud() {
    const chrome = UI.hudChrome(app);
    if (!chrome.level) return;
    dom.level.textContent = chrome.level;
    dom.sub.textContent = chrome.sub;
    dom.moves.textContent = chrome.moves;
    dom.par.textContent = chrome.par;
    dom.anchors.textContent = chrome.anchors;
    dom.undo.disabled = chrome.undoDisabled;
    dom.pause.setAttribute('aria-label', chrome.pauseLabel);
    dom.undo.setAttribute('aria-label', chrome.undoLabel);
    dom.restart.setAttribute('aria-label', chrome.restartLabel);
    dom.hintButton.setAttribute('aria-label', chrome.hintLabel);

    const objects = UI.hudObjects(app);
    if (dom.objects.dataset.signature !== objects) {
      // Re-rendering the strip must not throw the player back to the first chip
      // when a chamber has more mechanisms than fit on screen.
      const scroll = dom.objects.scrollLeft;
      dom.objects.innerHTML = objects;
      dom.objects.dataset.signature = objects;
      dom.objects.scrollLeft = scroll;
      dom.objects.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    const rates = UI.hudRates(app);
    if (dom.rates.dataset.signature !== rates) {
      dom.rates.innerHTML = rates;
      dom.rates.dataset.signature = rates;
    }
  }

  function controlKeysFor(obj) {
    if (!obj || obj.kind !== 'dial') return [];
    return obj.controls.map((control) => control.y * app.level.w + control.x);
  }

  function selectObject(id) {
    if (!app.level) return;
    const obj = app.level.objects.find((candidate) => candidate.id === id);
    app.selected = obj ? obj.id : null;
    app.scene.setSelection(app.selected);
    app.scene.setHighlight(controlKeysFor(obj));
    app.audio.play('select');
    updateHud();
  }

  function cycleSelection(delta) {
    if (!app.level) return;
    const objects = app.level.objects;
    if (objects.length === 0) return;
    const current = objects.findIndex((obj) => obj.id === app.selected);
    const next = (current + delta + objects.length) % objects.length;
    selectObject(objects[next].id);
  }

  function syncGhosts() {
    if (!app.level || !app.state) return;
    if (!app.save.settings.ghosts) {
      app.scene.setGhosts(null);
      return;
    }
    const next = previewTick(app.level, app.state);
    const closing = [];
    app.level.controlMap.forEach((control, key) => {
      const obj = app.level.objects[control.index];
      const nowOpen = obj.openWhen.includes(app.state.phases[control.index]);
      const nextOpen = obj.openWhen.includes(next.phases[control.index]);
      if (nowOpen && !nextOpen) closing.push({ x: key % app.level.w, y: Math.floor(key / app.level.w) });
    });
    app.scene.setGhosts({ drones: next.drones, closing });
  }

  function showHint(force = false) {
    if (!app.level) return;
    if (!force && !app.save.settings.hints) return;
    dom.hintText.textContent = app.t(app.level.hintKey);
    dom.hint.hidden = false;
  }

  function hideHint() {
    dom.hint.hidden = true;
  }

  /* ---------- gameplay ---------- */

  function startLevel(id) {
    const level = app.levels.find((candidate) => candidate.id === id) || app.levels[0];
    app.level = level;
    app.state = createState(level);
    app.history = [];
    app.modal = null;
    app.screen = 'play';
    app.selected = level.objects[0]?.id ?? null;
    app.save.progress.lastLevel = level.id;
    persist();
    app.scene.load(level, app.state);
    app.scene.setSelection(app.selected);
    app.scene.setHighlight(controlKeysFor(level.objects.find((obj) => obj.id === app.selected)));
    syncGhosts();
    app.returnTo = 'title';
    showScreen('play');
    hideHint();
    if (app.save.settings.hints && !app.save.progress.seenHints[level.id]) showHint(true);
    app.audio.play('enter');
    updateHud();
  }

  function restartLevel({ keepModal = false } = {}) {
    if (!app.level) return;
    app.state = createState(app.level);
    app.history = [];
    app.scene.load(app.level, app.state);
    app.scene.setSelection(app.selected);
    app.scene.setHighlight(controlKeysFor(app.level.objects.find((obj) => obj.id === app.selected)));
    syncGhosts();
    if (!keepModal) app.modal = null;
    hideHint();
    app.audio.play('enter');
    render();
  }

  function undo() {
    if (!app.level || app.history.length === 0) return;
    app.state = app.history.pop();
    app.modal = null;
    app.scene.sync(app.state);
    syncGhosts();
    app.audio.play('rewind');
    vibrate(10);
    render();
  }

  function setRate(rate) {
    if (!app.level || !app.state || app.state.won || app.state.dead) return;
    const obj = app.level.objects.find((candidate) => candidate.id === app.selected);
    if (!obj) {
      toast(app.t('hud.noSelection'));
      return;
    }
    const result = applyAction(app.level, app.state, { type: 'setRate', id: obj.id, rate });
    if (!result.ok) {
      const rejection = result.events.find((event) => event.type === 'reject');
      if (rejection && rejection.reason === 'singleFreeze') toast(app.t('hud.freezeOnly'));
      else app.audio.play('bump');
      return;
    }
    app.state = result.state;
    app.scene.sync(app.state);
    syncGhosts();
    app.audio.play(rate === -1 ? 'rewind' : rate === 0 ? 'pause' : rate === 2 ? 'fast' : 'play');
    vibrate(8);
    updateHud();
  }

  function vibrate(pattern) {
    if (!app.save.settings.haptics) return;
    if (typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(pattern);
      } catch {
        /* unsupported */
      }
    }
  }

  function handleEvents(events) {
    for (const event of events) {
      switch (event.type) {
        case 'step':
          app.scene.effectStep(event.from, event.to);
          app.audio.play('step');
          vibrate(6);
          break;
        case 'collect':
          app.scene.effectCollect(event.x, event.y);
          app.audio.play('collect');
          vibrate([10, 30, 16]);
          break;
        case 'fail':
          app.scene.effectFail(app.state.px, app.state.py);
          app.audio.play('fail');
          vibrate([30, 40, 60]);
          break;
        case 'win':
          app.scene.effectWin();
          app.audio.play('win');
          vibrate([12, 30, 12, 30, 24]);
          break;
        default:
          break;
      }
    }
  }

  function finishLevel() {
    const level = app.level;
    const moves = app.state.moves;
    markCompleted(app.save, level.id, moves);
    const next = app.levels[level.index + 1];
    if (next) app.save.progress.lastLevel = next.id;
    persist();
    banner(app.t('win.title'));
  }

  function perform(action) {
    if (app.screen !== 'play' || !app.level || !app.state) return;
    if (app.modal && action.type !== 'escape') return;
    if (app.state.won || app.state.dead) return;

    switch (action.type) {
      case 'move':
      case 'wait': {
        const previous = app.state;
        const result = applyAction(app.level, app.state, action);
        if (!result.ok) {
          app.audio.play('bump');
          return;
        }
        app.history.push(previous);
        if (app.history.length > 300) app.history.shift();
        app.state = result.state;
        app.scene.sync(app.state);
        handleEvents(result.events);
        syncGhosts();
        updateHud();
        if (app.state.won) {
          finishLevel();
          window.setTimeout(() => {
            if (app.screen === 'play' && app.state?.won && !app.modal) openModal('win');
          }, 700);
        } else if (app.state.dead) {
          window.setTimeout(() => {
            if (app.screen === 'play' && app.state?.dead && !app.modal) openModal('fail');
          }, 450);
        }
        break;
      }
      case 'select':
        selectObject(action.id);
        break;
      case 'cycle':
        cycleSelection(action.delta);
        break;
      case 'rate':
        setRate(action.rate);
        break;
      case 'undo':
        undo();
        break;
      case 'restart':
        restartLevel();
        break;
      case 'pause':
        openModal('pause');
        break;
      case 'hint':
        showHint(true);
        break;
      case 'escape':
        if (app.modal) closeModal();
        break;
      default:
        break;
    }
  }

  /* ---------- settings ---------- */

  function setLocale(code) {
    if (!LOCALES.some((locale) => locale.code === code)) return;
    app.locale = code;
    app.save.locale = code;
    applyLocale();
    persist();
    render();
    app.audio.play('ui');
  }

  /* ---------- event delegation ---------- */

  ui.addEventListener('click', (event) => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const [verb, ...rest] = target.dataset.action.split(':');
    const value = rest.join(':');
    if (target.disabled) return;

    switch (verb) {
      case 'lang':
        setLocale(value);
        if (app.screen === 'language') showScreen('title');
        break;
      case 'set-lang':
        setLocale(value);
        break;
      case 'screen':
        app.audio.play('ui');
        if (app.screen === 'play' && ['settings', 'howto'].includes(value)) {
          showScreen(value, { returnTo: 'play' });
        } else {
          showScreen(value);
        }
        break;
      case 'play':
        if (value === 'last') startLevel(app.save.progress.lastLevel || 'c01');
        else startLevel(value);
        break;
      case 'next-level': {
        const next = app.levels[(app.level?.index ?? 0) + 1];
        if (next) startLevel(next.id);
        else {
          app.save.progress.seenEnding = true;
          persist();
          showScreen('ending');
        }
        break;
      }
      case 'replay':
        restartLevel();
        break;
      case 'resume':
        closeModal();
        break;
      case 'restart':
        restartLevel();
        break;
      case 'undo':
        undo();
        break;
      case 'pause':
        openModal('pause');
        break;
      case 'hint':
        showHint(true);
        break;
      case 'dismiss-hint':
        hideHint();
        if (app.level) {
          app.save.progress.seenHints[app.level.id] = true;
          persist();
        }
        break;
      case 'toggle': {
        app.save.settings[value] = !app.save.settings[value];
        applySettings();
        persist();
        render();
        app.audio.play('ui');
        break;
      }
      case 'quality':
        app.save.settings.quality = value;
        applySettings();
        persist();
        render();
        app.audio.play('ui');
        break;
      case 'reset-progress':
        if (!app.confirmReset) {
          app.confirmReset = true;
          render();
        } else {
          app.save = resetProgress(app.save);
          app.confirmReset = false;
          persist();
          toast(app.t('settings.resetDone'));
          render();
        }
        break;
      case 'back':
        app.audio.play('ui');
        if (app.returnTo === 'play' && app.level) {
          app.screen = 'play';
          render();
        } else {
          showScreen('title');
        }
        break;
      case 'select':
        selectObject(value);
        break;
      case 'rate':
        setRate(Number(value));
        break;
      default:
        break;
    }
  });

  // range sliders (settings) — update on input without re-rendering the page
  ui.addEventListener('input', (event) => {
    const range = event.target.closest('[data-range]');
    if (!range) return;
    const key = range.dataset.range;
    app.save.settings[key] = Math.max(0, Math.min(1, Number(range.value) / 100));
    app.audio.setVolumes({ music: app.save.settings.music, sfx: app.save.settings.sfx });
    if (key === 'music' && app.save.settings.music > 0) app.audio.startAmbient();
    persist();
  });

  hud.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const [verb, ...rest] = button.dataset.action.split(':');
    const value = rest.join(':');
    if (verb === 'select') selectObject(value);
    else if (verb === 'rate') setRate(Number(value));
    else if (verb === 'dismiss-hint') {
      hideHint();
      if (app.level) {
        app.save.progress.seenHints[app.level.id] = true;
        persist();
      }
    } else if (['pause', 'undo', 'restart', 'hint'].includes(verb)) perform({ type: verb });
  });

  hud.addEventListener('pointerdown', (event) => {
    const button = event.target.closest('[data-move]');
    if (!button) return;
    event.preventDefault();
    const move = button.dataset.move;
    if (move === 'wait') perform({ type: 'wait' });
    else perform({ type: 'move', dir: move });
  });

  canvas.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    canvas.dataset.startX = event.clientX;
    canvas.dataset.startY = event.clientY;
    canvas.dataset.startTime = String(performance.now());
    try {
      canvas.setPointerCapture?.(event.pointerId);
    } catch {
      /* some input sources cannot capture */
    }
  });

  canvas.addEventListener('pointerup', (event) => {
    if (app.screen !== 'play' || app.modal) return;
    const startX = Number(canvas.dataset.startX);
    const startY = Number(canvas.dataset.startY);
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    const distance = Math.hypot(dx, dy);
    if (distance < TAP_SLOP) {
      const id = app.scene.hitTest(event.clientX, event.clientY);
      if (id) selectObject(id);
      return;
    }
    if (Math.abs(dx) > Math.abs(dy)) perform({ type: 'move', dir: dx > 0 ? 'right' : 'left' });
    else perform({ type: 'move', dir: dy > 0 ? 'down' : 'up' });
  });

  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  // keyboard + gamepad
  const input = createInput({
    onAction: (action) => {
      if (action.type === 'escape') {
        if (app.modal) closeModal();
        return;
      }
      if (app.screen !== 'play' || app.modal) return;
      if (!['move', 'wait', 'undo', 'restart', 'pause', 'cycle', 'rate', 'hint'].includes(action.type)) return;
      perform(action);
    },
    isActive: () => app.screen === 'play' && !app.modal && Boolean(app.state) && !app.state.won && !app.state.dead
  });
  app.input = input;

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && app.screen === 'play' && !app.modal && app.state && !app.state.won && !app.state.dead) {
      openModal('pause');
    }
  });

  // Android back: close a dialog, pause a chamber, or leave the menus — never
  // drop the player straight out of a run and lose their place.
  const nativeApp = window.Capacitor?.Plugins?.App;
  if (nativeApp?.addListener) {
    const onBack = () => {
      if (app.modal) {
        closeModal();
        return;
      }
      if (app.screen === 'play') {
        if (app.state && !app.state.won && !app.state.dead) openModal('pause');
        else showScreen('title');
        return;
      }
      if (app.screen === 'title' || app.screen === 'language') {
        nativeApp.minimizeApp?.();
        return;
      }
      showScreen('title');
    };
    try {
      const handle = nativeApp.addListener('backButton', onBack);
      // Capacitor 7 returns a handle synchronously; older wrappers returned a promise.
      handle?.catch?.(() => {});
    } catch {
      /* no native shell: the web build uses the browser's own back button */
    }
  }

  if (recovered) {
    persistSave(app.save);
    window.setTimeout(() => toast(app.t('save.recovered')), 300);
  }

  if (!app.save.locale) {
    // Show the selector until the player makes a choice; do not persist a guess.
    showScreen('language');
  } else {
    showScreen('title');
  }

  // expose for diagnostics and the automated smoke test
  window.__timeArchitect = {
    app,
    startLevel,
    perform,
    showScreen,
    selectObject,
    setRate
  };

  return app;
}

import { LOCALES, localeInfo } from '../core/i18n.js';
import { icon } from './icons.js';
import { LEVEL_COUNT } from '../core/save.js';

const esc = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

const flag = (code, alt) =>
  `<img class="flag" src="assets/flags/${code}.svg" alt="${alt ? esc(alt) : ''}" width="34" height="23" />`;

const progressCount = (save) => Object.keys(save.progress.completed).length;

const mark = (extra = '') => `
  <svg class="hero__mark" viewBox="0 0 120 120" role="img" aria-hidden="true" ${extra}>
    <defs>
      <linearGradient id="mark-brass" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fff3d2" />
        <stop offset="0.55" stop-color="#ffc76b" />
        <stop offset="1" stop-color="#8a5a24" />
      </linearGradient>
      <radialGradient id="mark-core" cx="0.5" cy="0.45" r="0.6">
        <stop offset="0" stop-color="#bff7ff" />
        <stop offset="0.5" stop-color="#6fe6ff" />
        <stop offset="1" stop-color="#0e3a49" />
      </radialGradient>
    </defs>
    <circle cx="60" cy="60" r="52" fill="none" stroke="url(#mark-brass)" stroke-width="2.4" />
    <circle cx="60" cy="60" r="41" fill="none" stroke="rgba(111,230,255,0.32)" stroke-width="1" stroke-dasharray="3 7" />
    <rect x="54" y="26" width="12" height="34" rx="3" fill="url(#mark-brass)" opacity="0.9" />
    <circle cx="60" cy="60" r="15" fill="url(#mark-core)" />
    <path d="M60 19v7M60 94v7M19 60h7M94 60h7" stroke="url(#mark-brass)" stroke-width="2.2" stroke-linecap="round" />
  </svg>
`;

export function languageScreen(app) {
  const { t, save } = app;
  const chips = LOCALES.map(
    (locale) => `
      <button class="lang" data-action="lang:${locale.code}" aria-pressed="${save.locale === locale.code}">
        ${flag(locale.flag)}
        <span class="lang__name" dir="auto" lang="${locale.code}">${esc(locale.name)}</span>
      </button>`
  ).join('');
  return `
    <section class="screen language-welcome">
      <header class="home__header">
        <div class="home__brand">${mark()}<span>TIME <strong>ARCHITECT</strong><small>${esc(t('app.studio'))}</small></span></div>
      </header>
      <div class="language-welcome__content">
        <div class="language-welcome__intro">
          <p class="home__kicker"><span></span>${esc(t('new.eyebrow'))}</p>
          <h1 class="home__title">${esc(t('new.headline'))}</h1>
          <p class="home__intro">${esc(t('new.intro'))}</p>
        </div>
        <div class="language-welcome__card">
          <span class="language-welcome__globe">${icon('globe')}</span>
          <h2 class="display">${esc(t('language.title'))}</h2>
          <p>${esc(t('language.subtitle'))}</p>
          <div class="langgrid">${chips}</div>
        </div>
      </div>
      <footer class="home__footer"><span>${esc(t('new.offline'))}</span><span>${esc(t('app.studio'))} · v1.1</span></footer>
    </section>`;
}

export function titleScreen(app) {
  const { t, save } = app;
  const done = progressCount(save);
  const total = LEVEL_COUNT;
  const started = done > 0 || save.progress.unlocked > 0 || Object.keys(save.progress.seenHints).length > 0;
  const width = Math.round((done / total) * 100);
  return `
    <section class="screen home">
      <header class="home__header">
        <div class="home__brand">${mark()}<span>TIME <strong>ARCHITECT</strong><small>${esc(t('app.studio'))}</small></span></div>
        <button class="home__settings" data-action="screen:settings">${icon('globe')} <span>${esc(localeLabel(app.locale))}</span></button>
      </header>
      <div class="home__content">
        <div class="home__copy">
          <p class="home__kicker"><span></span>${esc(t('new.eyebrow'))}</p>
          <h1 class="home__title">${esc(t('new.headline'))}</h1>
          <p class="home__intro">${esc(t('new.intro'))}</p>
          <div class="home__actions">
            <button class="btn btn--primary home__play" data-action="${started ? 'play:last' : 'play:c01'}">${icon('play')} ${esc(t(started ? 'new.resume' : 'new.begin'))} ${icon('chevronRight')}</button>
            <button class="btn home__map" data-action="screen:levels">${esc(t('new.explore'))} ${icon('chevronRight')}</button>
          </div>
          <button class="home__guide" data-action="screen:howto"><span>?</span> ${esc(t('new.guide'))} ${icon('chevronRight')}</button>
        </div>
        <aside class="home__journey" aria-label="${esc(t('new.collection'))}">
          <div class="home__journey-head"><span>${esc(t('new.collection'))}</span><span>✦</span></div>
          <div class="home__journey-number">${String(done).padStart(2, '0')} <span>/ ${total}</span></div>
          <div class="home__journey-label">${esc(t('new.complete'))}</div>
          <div class="progress__bar" role="progressbar" aria-label="${esc(t('new.collection'))}" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}"><div class="progress__fill" style="width:${width}%"></div></div>
          <button data-action="screen:levels">${esc(t('new.explore'))} →</button>
        </aside>
      </div>
      <footer class="home__footer"><span>${esc(t('new.offline'))}</span><div><button data-action="screen:credits">${esc(t('menu.credits'))}</button><button data-action="screen:privacy">${esc(t('menu.privacy'))}</button><span>v1.1</span></div></footer>
    </section>`;
}

export function levelsScreen(app) {
  const { t, save } = app;
  const cards = app.levels
    .map((level, index) => {
      const done = Boolean(save.progress.completed[level.id]);
      const locked = index > save.progress.unlocked;
      const best = save.progress.best[level.id];
      const meta = done
        ? `${t('ui.completed')}${best ? ` · ${t('win.best', { moves: best })}` : ''}`
        : locked
          ? t('ui.locked')
          : t('new.available');
      return `
        <button class="levelcard ${done ? 'levelcard--done' : ''}" data-action="play:${level.id}" ${locked ? 'disabled' : ''}>
          <span class="levelcard__chapter">${esc(t('new.chamber'))}</span><span class="levelcard__num">${String(index + 1).padStart(2, '0')}</span>
          <span class="levelcard__title">${esc(t(level.titleKey))}</span>
          <span class="levelcard__sub">${esc(t(level.subtitleKey))}</span>
          <span class="levelcard__meta">${esc(meta)}</span>
          ${locked ? `<span class="levelcard__lock" aria-hidden="true">${icon('lock')}</span>` : ''}
        </button>`;
    })
    .join('');
  return `
    <section class="screen">
      <div class="screen__head">
        <button class="btn btn--ghost" data-action="screen:title">${icon('chevronLeft', 'icon--back')} ${esc(t('ui.back'))}</button>
        <p class="eyebrow">${esc(t('app.studio'))}</p>
      </div>
      <div class="stack" style="gap:6px">
        <h1 class="screen__title display">${esc(t('menu.play'))}</h1>
        <p class="screen__lead">${esc(t('menu.progress', { done: progressCount(save), total: LEVEL_COUNT }))}</p>
      </div>
      <div class="levels">${cards}</div>
    </section>`;
}

export function howtoScreen(app) {
  const { t } = app;
  const steps = ['step1', 'step2', 'step3', 'step4', 'step5']
    .map((key) => `<div class="step"><p style="margin:0">${esc(t(`howto.${key}`))}</p></div>`)
    .join('');
  return `
    <section class="screen">
      <div class="screen__head">
        <button class="btn btn--ghost" data-action="back">${icon('chevronLeft', 'icon--back')} ${esc(t('ui.back'))}</button>
        <p class="eyebrow">${esc(t('app.title'))}</p>
      </div>
      <h1 class="screen__title display">${esc(t('howto.title'))}</h1>
      <p class="screen__lead">${esc(t('new.guideIntro'))}</p>
      <p class="guide-note">${esc(t('new.free'))}</p>
      <div class="guide-keys"><span><kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd> ${esc(t('hud.keys').split('·')[0])}</span><span><kbd>1</kbd>–<kbd>4</kbd> ${esc(t('new.time'))}</span><span><kbd>Z</kbd> ${esc(t('hud.undo'))}</span></div>
      <div class="panel steps">${steps}</div>
      <div class="panel guide-legend"><p>${esc(t('new.boardGuide'))}</p><p>◉ &nbsp;${esc(t('new.legendPhase'))}</p><p>! &nbsp;${esc(t('new.legendMove'))}</p></div>
      <div class="screen__foot">
        <button class="btn btn--primary" data-action="back">${esc(t('ui.close'))}</button>
      </div>
    </section>`;
}

export function settingsScreen(app) {
  const { t, save } = app;
  const s = save.settings;
  const toggle = (key, label) => `
    <div class="row">
      <span class="row__label"><strong>${esc(label)}</strong></span>
      <button class="toggle" role="switch" aria-checked="${Boolean(s[key])}" aria-label="${esc(label)}" data-action="toggle:${key}"></button>
    </div>`;
  const langs = LOCALES.map(
    (locale) => `
      <button class="langchip" data-action="set-lang:${locale.code}" aria-pressed="${save.locale === locale.code}">
        ${flag(locale.flag)}
        <span dir="auto" lang="${locale.code}">${esc(locale.name)}</span>
      </button>`
  ).join('');
  return `
    <section class="screen">
      <div class="screen__head">
        <button class="btn btn--ghost" data-action="back">${icon('chevronLeft', 'icon--back')} ${esc(t('ui.back'))}</button>
        <p class="eyebrow">${esc(t('app.title'))}</p>
      </div>
      <h1 class="screen__title display">${esc(t('settings.title'))}</h1>

      <div class="panel stack">
        <h2 class="eyebrow">${esc(t('settings.language'))}</h2>
        <div class="langrow">${langs}</div>
      </div>

      <div class="panel stack">
        <h2 class="eyebrow">${esc(t('settings.audio'))}</h2>
        <div class="row">
          <span class="row__label"><strong>${esc(t('settings.music'))}</strong></span>
          <input class="slider" type="range" min="0" max="100" step="1" value="${Math.round(s.music * 100)}" data-range="music" aria-label="${esc(t('settings.music'))}" />
        </div>
        <div class="row">
          <span class="row__label"><strong>${esc(t('settings.sfx'))}</strong></span>
          <input class="slider" type="range" min="0" max="100" step="1" value="${Math.round(s.sfx * 100)}" data-range="sfx" aria-label="${esc(t('settings.sfx'))}" />
        </div>
      </div>

      <div class="panel stack">
        <h2 class="eyebrow">${esc(t('settings.accessibility'))}</h2>
        ${toggle('reducedMotion', t('settings.reducedMotion'))}
        ${toggle('highContrast', t('settings.highContrast'))}
        ${toggle('largeTargets', t('settings.largeTargets'))}
        ${toggle('haptics', t('settings.haptics'))}
        ${toggle('ghosts', t('settings.ghosts'))}
        ${toggle('hints', t('settings.hints'))}
        <div class="row">
          <span class="row__label"><strong>${esc(t('settings.quality'))}</strong></span>
          <span class="seg">
            ${['low', 'medium', 'high']
              .map(
                (quality) =>
                  `<button data-action="quality:${quality}" aria-pressed="${s.quality === quality}">${esc(t(`settings.quality${quality[0].toUpperCase()}${quality.slice(1)}`))}</button>`
              )
              .join('')}
          </span>
        </div>
      </div>

      <div class="panel stack">
        <div class="row">
          <span class="row__label">
            <strong>${esc(t('settings.reset'))}</strong>
            <span class="row__hint">${esc(t('settings.data'))}</span>
          </span>
          <button class="btn btn--ghost" data-action="reset-progress">${esc(app.confirmReset ? t('settings.resetConfirm') : t('settings.reset'))}</button>
        </div>
      </div>

      <div class="screen__foot">
        <button class="btn btn--primary" data-action="back">${esc(t('ui.close'))}</button>
      </div>
    </section>`;
}

export function creditsScreen(app) {
  const { t } = app;
  const rows = [
    ['credits.role1', 'nRnWorld'],
    ['credits.role2', 'nRnWorld'],
    ['credits.role3', 'nRnWorld'],
    ['credits.role4', 'nRnWorld'],
    ['credits.role5', 'Time Architect'],
    ['credits.role6', 'Wikimedia Commons']
  ]
    .map(
      ([role, value]) => `
      <div class="row">
        <span class="row__label"><strong>${esc(t(role))}</strong></span>
        <span class="row__hint" style="font-size:0.86rem">${esc(value)}</span>
      </div>`
    )
    .join('');
  return `
    <section class="screen">
      <div class="screen__head">
        <button class="btn btn--ghost" data-action="back">${icon('chevronLeft', 'icon--back')} ${esc(t('ui.back'))}</button>
        <p class="eyebrow">${esc(t('app.title'))}</p>
      </div>
      <h1 class="screen__title display">${esc(t('credits.title'))}</h1>
      <div class="studio">
        <img class="studio__logo" src="assets/brand/nrnworld-logo.webp" alt="nRnWorld" width="88" height="88" />
        <div class="studio__copy">
          <p class="eyebrow">${esc(t('app.studio'))}</p>
          <p class="note" style="margin:0">nrnworld.one</p>
        </div>
      </div>
      <div class="panel stack">${rows}</div>
      <p class="note">${esc(t('credits.audioNote'))}</p>
      <p class="note">${esc(t('credits.licenseNote'))}</p>
      <div class="screen__foot">
        <a class="btn btn--ghost" href="LICENSE" target="_blank" rel="noopener">LICENSE</a>
        <button class="btn btn--primary" data-action="back">${esc(t('ui.close'))}</button>
      </div>
    </section>`;
}

export function privacyScreen(app) {
  const { t } = app;
  return `
    <section class="screen">
      <div class="screen__head">
        <button class="btn btn--ghost" data-action="back">${icon('chevronLeft', 'icon--back')} ${esc(t('ui.back'))}</button>
        <p class="eyebrow">${esc(t('app.title'))}</p>
      </div>
      <h1 class="screen__title display">${esc(t('privacy.title'))}</h1>
      <div class="panel stack">
        <p class="screen__lead">${esc(t('privacy.p1'))}</p>
        <p class="screen__lead">${esc(t('privacy.p2'))}</p>
        <p class="screen__lead">${esc(t('privacy.p3'))}</p>
        <p class="screen__lead">${esc(t('privacy.p4'))}</p>
      </div>
      <div class="screen__foot">
        <button class="btn btn--primary" data-action="back">${esc(t('ui.close'))}</button>
      </div>
    </section>`;
}

export function endingScreen(app) {
  const { t } = app;
  const done = progressCount(app.save);
  return `
    <section class="screen screen--center">
      <div class="hero" style="padding-top:0">
        ${mark()}
        <p class="eyebrow">${esc(t('app.studio'))}</p>
        <h1 class="display hero__title" style="font-size:clamp(2.2rem,7vw,4rem)">${esc(t('ending.title'))}</h1>
      </div>
      <div class="panel stack" style="max-width:620px;text-align:start">
        <p class="screen__lead">${esc(t('ending.p1'))}</p>
        <p class="screen__lead">${esc(t('ending.p2'))}</p>
        <p class="screen__lead" style="color:var(--brass)">${esc(t('ending.p3'))}</p>
        <p class="note">${esc(t('menu.progress', { done, total: LEVEL_COUNT }))}</p>
      </div>
      <div class="menu">
        <button class="btn btn--primary btn--wide" data-action="play:c01">${esc(t('ending.replay'))}</button>
        <button class="btn btn--wide" data-action="screen:title">${esc(t('ending.menu'))}</button>
      </div>
    </section>`;
}

export function modalPause(app) {
  const { t } = app;
  return `
    <div class="modal" role="dialog" aria-modal="true" aria-label="${esc(t('pause.title'))}">
      <div class="modal__panel">
        <p class="eyebrow">${esc(t('ui.chamber'))} ${app.level ? app.level.index + 1 : ''}</p>
        <h2 class="modal__title">${esc(t('pause.title'))}</h2>
        <div class="modal__actions">
          <button class="btn btn--primary" data-action="resume">${esc(t('pause.resume'))}</button>
          <button class="btn" data-action="restart">${esc(t('pause.restart'))}</button>
          <button class="btn" data-action="screen:howto">${esc(t('pause.howto'))}</button>
          <button class="btn" data-action="screen:settings">${esc(t('pause.settings'))}</button>
          <button class="btn" data-action="screen:levels">${esc(t('pause.map'))}</button>
          <button class="btn btn--ghost" data-action="screen:title">${esc(t('pause.menu'))}</button>
        </div>
      </div>
    </div>`;
}

export function modalWin(app) {
  const { t } = app;
  const level = app.level;
  const moves = app.state?.moves ?? 0;
  const isLast = level && level.index === app.levels.length - 1;
  const perfect = level && level.par === moves;
  return `
    <div class="modal" role="dialog" aria-modal="true" aria-label="${esc(t('win.title'))}">
      <div class="modal__panel">
        <p class="eyebrow">${esc(t(`level.${level.id}.title`))}</p>
        <h2 class="modal__title">${esc(t('win.title'))}</h2><p class="modal__text">${esc(t('new.finished'))}</p>
        <div class="modal__stats">
          <span class="stat">${esc(t('win.moves', { moves }))}</span>
          <span class="stat stat--muted">${esc(t('win.par', { par: level.par }))}</span>
          ${perfect ? `<span class="badge">${esc(t('win.perfect'))}</span>` : ''}
        </div>
        <div class="modal__actions">
          <button class="btn btn--primary" data-action="${isLast ? 'screen:ending' : 'next-level'}">${esc(t(isLast ? 'win.last' : 'win.next'))}</button>
          <button class="btn" data-action="replay">${esc(t('win.replay'))}</button>
          <button class="btn btn--ghost" data-action="screen:levels">${esc(t('win.map'))}</button>
        </div>
      </div>
    </div>`;
}

export function modalFail(app) {
  const { t } = app;
  const reason = app.state?.failReason;
  const reasonKey = reason === 'fell' ? 'fail.fell' : reason === 'sealed' ? 'fail.sealed' : 'fail.drone';
  return `
    <div class="modal" role="dialog" aria-modal="true" aria-label="${esc(t('fail.title'))}">
      <div class="modal__panel">
        <span class="badge badge--danger">${esc(t('fail.title'))}</span>
        <p class="modal__text">${esc(t(reasonKey))}</p><p class="note">${esc(t('new.tryUndo'))}</p>
        <div class="modal__actions">
          <button class="btn btn--primary" data-action="undo" ${app.history.length ? '' : 'disabled'}>${esc(t('fail.undo'))}</button>
          <button class="btn" data-action="restart">${esc(t('fail.retry'))}</button>
        </div>
      </div>
    </div>`;
}

/* ---------- HUD ---------- */

export function hudChrome(app) {
  const { t } = app;
  const level = app.level;
  if (!level) return {};
  const total = level.anchors.length;
  const got = app.state.got.filter(Boolean).length;
  return {
    level: `${String(level.index + 1).padStart(2, '0')} · ${t(level.titleKey)}`,
    sub: t(level.subtitleKey),
    moves: `${t('hud.moves')} ${app.state.moves}`,
    par: `${t('hud.par')} ${level.par}`,
    anchors: t('hud.anchors', { got, total }),
    undoDisabled: app.history.length === 0,
    pauseLabel: t('hud.pause'),
    undoLabel: t('hud.undo'),
    restartLabel: t('hud.restart'),
    hintLabel: t('hud.hint')
  };
}

export function hudObjects(app) {
  const { t } = app;
  if (!app.level) return '';
  return app.level.objects
    .map((obj) => {
      const index = obj.index;
      const rate = app.state.rates[index];
      const phase = app.state.phases[index];
      const selected = app.selected === obj.id;
      const kindLabel = `${t(obj.kind === 'dial' ? 'kind.dial' : 'kind.drone')} ${index + 1}`;
      const rateLabel = t(rate === -1 ? 'rate.rewind' : rate === 0 ? 'rate.pause' : rate > 1 ? 'rate.fast' : 'rate.play');
      const nextPhase = ((phase + rate) % obj.period + obj.period) % obj.period;
      const status = obj.kind === 'dial' ? `${t(obj.openWhen.includes(phase) ? 'new.open' : 'new.closed')} → ${t(obj.openWhen.includes(nextPhase) ? 'new.open' : 'new.closed')}` : `${t('new.next')} ${nextPhase + 1}/${obj.period}`;
      return `
        <button class="objchip" role="option" aria-selected="${selected}" data-action="select:${obj.id}" data-object="${obj.id}">
          <span class="objchip__icon" aria-hidden="true">${icon(obj.kind === 'dial' ? 'dial' : 'drone')}</span>
          <span>
            <span class="objchip__name">${esc(kindLabel)}</span>
            <span class="objchip__meta">${esc(rateLabel)} · ${phase + 1}/${obj.period}<br><span class="objchip__status">${esc(status)}</span></span>
          </span>
          <span class="phase-track" aria-hidden="true">${Array.from({ length: obj.period }, (_, i) => `<i class="${i === phase ? 'phase-track__current' : ''} ${obj.kind === 'dial' && obj.openWhen.includes(i) ? 'phase-track__open' : ''} ${i === nextPhase ? 'phase-track__next' : ''}"></i>`).join('')}</span>
        </button>`;
    })
    .join('');
}

export function hudRates(app) {
  const { t } = app;
  if (!app.level) return '';
  const selected = app.level.objects.find((obj) => obj.id === app.selected);
  if (!selected) return `<span class="row__hint">${esc(t('hud.noSelection'))}</span>`;
  const rates = [
    { value: -1, icon: 'rewind', key: 'rate.rewind' },
    { value: 0, icon: 'pause', key: 'rate.pause' },
    { value: 1, icon: 'play', key: 'rate.play' },
    { value: 2, icon: 'fast', key: 'rate.fast' }
  ];
  return rates
    .map(
      (rate) => `
      <button class="rate" data-action="rate:${rate.value}" aria-pressed="${app.state.rates[selected.index] === rate.value}" ${app.state.won || app.state.dead ? 'disabled' : ''}>
        <span class="rate__icon" aria-hidden="true">${icon(rate.icon)}</span>
        <span class="rate__label">${esc(t(rate.key))} <small>${rates.indexOf(rate) + 1}</small></span>
      </button>`
    )
    .join('');
}

export function localeLabel(code) {
  const info = localeInfo(code);
  return `${info.name}`;
}

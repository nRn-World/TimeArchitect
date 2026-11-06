// A clear, top-down diorama for Time Architect. The simulation remains the
// source of truth; all paths, previews and hit tests use the same grid.
import { TILE, controlledTileOpen } from '../core/level.js';
import { previewAction } from '../core/sim.js';
import { mod } from '../core/math.js';

const CELL = 64;
const TAU = Math.PI * 2;
const THEMES = {
  ink: { sky: '#233861', light: '#83d7d3', stone: '#e2e4dc', wall: '#668695', floor: '#f4eee0' },
  brass: { sky: '#634757', light: '#f6c68e', stone: '#e9d6bd', wall: '#a47e75', floor: '#fff0d8' },
  verdant: { sky: '#285a61', light: '#9ae9bc', stone: '#cce2d0', wall: '#64968a', floor: '#e8f1de' },
  ember: { sky: '#644153', light: '#ffc398', stone: '#eed8cb', wall: '#a17c7f', floor: '#ffecdc' },
  cosmic: { sky: '#423c70', light: '#d5b8ff', stone: '#ded9ee', wall: '#827aa2', floor: '#f3eaf8' }
};
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

function rounded(ctx, x, y, w, h, r, color, stroke) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  if (color) { ctx.fillStyle = color; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
}
function circle(ctx, x, y, r, fill, stroke, width = 1) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}

export class Scene {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.options = { reducedMotion: false, highContrast: false, quality: 'high', ghosts: true };
    this.level = null; this.state = null; this.selected = null;
    this.highlight = new Set(); this.ghosts = null;
    this.time = 0; this.running = false; this.effects = [];
    this.vis = { x: 0, y: 0 }; this.camera = { scale: 1, ox: 0, oy: 0 };
    this.boundFrame = this.frame.bind(this);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
  }
  setOptions(options) { this.options = { ...this.options, ...options }; this.resize(); }
  load(level, state) {
    this.level = level; this.state = state; this.theme = THEMES[level.palette] || THEMES.ink;
    this.vis = { x: state.px, y: state.py }; this.selected = null;
    this.highlight.clear(); this.effects = []; this.computeCamera();
  }
  clear() { this.level = null; this.state = null; }
  sync(state) { this.state = state; }
  setSelection(id) { this.selected = id; }
  setHighlight(keys) { this.highlight = new Set(keys || []); }
  setGhosts(ghosts) { this.ghosts = ghosts; }
  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.width = Math.max(1, Math.round(rect.width)); this.height = Math.max(1, Math.round(rect.height));
    this.dpr = Math.min(window.devicePixelRatio || 1, this.options.quality === 'low' ? 1 : 2);
    this.canvas.width = Math.round(this.width * this.dpr); this.canvas.height = Math.round(this.height * this.dpr);
    this.computeCamera();
  }
  computeCamera() {
    if (!this.level) return;
    const mobile = this.width <= 720;
    const landscape = this.height < 620 && this.width > this.height;
    // Reserve room for the HUD and controls so the board is never hidden by them.
    const top = landscape ? (mobile ? 104 : 72) : mobile ? 190 : 96;
    const bottom = landscape ? 12 : mobile ? (this.width <= 420 ? 245 : 225) : 150;
    const availableHeight = Math.max(150, this.height - top - bottom);
    const availableWidth = Math.max(180, this.width - (landscape ? 350 : mobile ? 26 : 80));
    const scale = Math.max(.2, Math.min(1.12, availableWidth / (this.level.w * CELL), availableHeight / (this.level.h * CELL)));
    this.camera = { scale, ox: (this.width - this.level.w * CELL * scale) / 2, oy: top + (availableHeight - this.level.h * CELL * scale) / 2 };
  }
  start() { if (!this.running) { this.running = true; this.last = performance.now(); requestAnimationFrame(this.boundFrame); } }
  stop() { this.running = false; }
  frame(now) {
    if (!this.running) return;
    const dt = Math.min(50, now - this.last); this.last = now;
    if (!this.options.reducedMotion) this.time += dt;
    this.effects = this.effects.filter(e => (e.life -= dt) > 0);
    if (this.state) {
      const f = this.options.reducedMotion ? 1 : Math.min(1, dt * .015);
      this.vis.x += (this.state.px - this.vis.x) * f; this.vis.y += (this.state.py - this.vis.y) * f;
    }
    this.render(); requestAnimationFrame(this.boundFrame);
  }
  effectStep(from, to) { this.effects.push({ ...to, life: 400, max: 400, color: '#71e5ce' }); }
  effectCollect(x, y) { this.effects.push({ x, y, life: 900, max: 900, color: '#ffe39a' }); }
  effectFail(x, y) { this.effects.push({ x, y, life: 700, max: 700, color: '#ff8a87' }); }
  effectWin() { if (this.state) this.effectCollect(this.state.px, this.state.py); }
  render() {
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.drawBackground(ctx);
    if (!this.level || !this.state) return;
    const { ox, oy, scale } = this.camera;
    ctx.save(); ctx.translate(ox, oy); ctx.scale(scale, scale);
    this.drawBoard(ctx);
    for (let y = 0; y < this.level.h; y++) for (let x = 0; x < this.level.w; x++) this.drawTile(ctx, x, y);
    this.drawConnections(ctx);
    this.drawPreviews(ctx);
    this.level.objects.forEach(obj => this.drawObject(ctx, obj));
    this.level.anchors.forEach(anchor => { if (!this.state.got[anchor.index]) this.drawAnchor(ctx, anchor); });
    this.drawPlayer(ctx);
    for (const e of this.effects) {
      const age = 1 - e.life / e.max; ctx.globalAlpha = 1 - age;
      circle(ctx, (e.x + .5) * CELL, (e.y + .5) * CELL, 10 + age * 30, null, e.color, 3);
    }
    ctx.globalAlpha = 1; ctx.restore();
  }
  drawBackground(ctx) {
    const theme = this.theme || THEMES.ink;
    const bg = ctx.createLinearGradient(0, 0, 0, this.height);
    bg.addColorStop(0, '#101c39'); bg.addColorStop(.55, theme.sky); bg.addColorStop(1, '#142a43');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, this.width, this.height);
    const glow = ctx.createRadialGradient(this.width * .5, this.height * .44, 0, this.width * .5, this.height * .44, this.width * .58);
    glow.addColorStop(0, 'rgba(111,218,210,.20)'); glow.addColorStop(1, 'rgba(111,218,210,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, this.width, this.height);
    for (let i = 0; i < 44; i++) {
      const x = ((i * 167 + 83) % 997) / 997 * this.width;
      const y = ((i * 283 + 31) % 991) / 991 * this.height;
      const alpha = .25 + .18 * Math.sin(this.time * .001 + i);
      circle(ctx, x, y, i % 7 === 0 ? 2 : 1, `rgba(232,252,244,${alpha})`);
    }
    ctx.strokeStyle = 'rgba(190,241,230,.09)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(this.width / 2, this.height / 2, Math.min(this.width, this.height) * .36, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(this.width / 2, this.height / 2, Math.min(this.width, this.height) * .43, 0, TAU); ctx.stroke();
  }
  drawBoard(ctx) {
    const w = this.level.w * CELL, h = this.level.h * CELL;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 38; ctx.shadowOffsetY = 22;
    rounded(ctx, -12, -12, w + 24, h + 24, 24, '#334f60'); ctx.restore();
    rounded(ctx, -8, -10, w + 16, h + 16, 20, '#acc9c5');
    rounded(ctx, -3, -5, w + 6, h + 6, 16, '#536e79');
  }
  drawTile(ctx, x, y) {
    const type = this.level.base[y * this.level.w + x], px = x * CELL, py = y * CELL;
    const theme = this.theme;
    if (type === TILE.VOID) {
      rounded(ctx, px + 2, py + 2, CELL - 4, CELL - 4, 10, '#324c60');
      circle(ctx, px + 18, py + 20, 2, 'rgba(185,236,225,.2)'); circle(ctx, px + 46, py + 42, 1.5, 'rgba(185,236,225,.2)');
      return;
    }
    if (type === TILE.WALL) {
      rounded(ctx, px + 2, py + 5, CELL - 4, CELL - 6, 10, '#466775');
      rounded(ctx, px + 2, py + 2, CELL - 4, CELL - 9, 9, theme.wall);
      rounded(ctx, px + 9, py + 8, CELL - 18, CELL - 22, 6, 'rgba(255,255,255,.10)');
      return;
    }
    const controlled = type === TILE.GATE || type === TILE.BRIDGE;
    const open = controlled && controlledTileOpen(this.level, this.state, x, y);
    rounded(ctx, px + 2, py + 5, CELL - 4, CELL - 6, 10, '#a8b8af');
    rounded(ctx, px + 2, py + 2, CELL - 4, CELL - 9, 9, controlled ? (open ? '#a3e3cb' : '#72868f') : theme.floor);
    if (!controlled) {
      rounded(ctx, px + 8, py + 8, CELL - 16, CELL - 21, 6, null, 'rgba(103,138,136,.13)');
      if ((x * 7 + y * 11) % 5 === 0) circle(ctx, px + 48, py + 16, 2, 'rgba(106,147,138,.25)');
    } else if (open) {
      ctx.strokeStyle = '#56ad99'; ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(px + 13, py + 17 + i * 12); ctx.lineTo(px + 51, py + 17 + i * 12); ctx.stroke(); }
      circle(ctx, px + 50, py + 12, 5, '#4aa48c');
    } else {
      ctx.strokeStyle = '#b8c9c6'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
      rounded(ctx, px + 11, py + 11, CELL - 22, CELL - 27, 5, null, '#b8c9c6'); ctx.setLineDash([]);
      ctx.strokeStyle = '#e3ebdf'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(px + 26, py + 25); ctx.lineTo(px + 38, py + 37); ctx.moveTo(px + 38, py + 25); ctx.lineTo(px + 26, py + 37); ctx.stroke();
    }
  }
  drawConnections(ctx) {
    if (!this.highlight.size) return;
    ctx.save(); ctx.strokeStyle = 'rgba(250,199,95,.95)'; ctx.lineWidth = 3; ctx.setLineDash([5, 5]);
    for (const key of this.highlight) {
      const x = key % this.level.w, y = Math.floor(key / this.level.w);
      rounded(ctx, x * CELL + 5, y * CELL + 5, CELL - 10, CELL - 15, 8, null, 'rgba(248,196,88,.95)');
    }
    ctx.restore();
  }
  drawPreviews(ctx) {
    if (this.state.dead || this.state.won) return;
    for (const [dir, [dx, dy]] of Object.entries(DIRS)) {
      const status = previewAction(this.level, this.state, { type: 'move', dir });
      if (status === 'blocked') continue;
      const x = (this.state.px + dx + .5) * CELL, y = (this.state.py + dy + .5) * CELL;
      circle(ctx, x, y + 13, 7, status === 'danger' ? '#e87864' : 'rgba(62,153,136,.65)');
      if (status === 'danger') { ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', x, y + 17); }
    }
    if (this.options.ghosts && this.ghosts) {
      ctx.save(); ctx.setLineDash([4, 4]);
      for (const d of this.ghosts.drones || []) circle(ctx, (d.x + .5) * CELL, (d.y + .5) * CELL, 23, null, '#e87b77', 2);
      for (const tile of this.ghosts.closing || []) rounded(ctx, tile.x * CELL + 8, tile.y * CELL + 8, CELL - 16, CELL - 22, 7, null, '#e87b77');
      ctx.restore();
    }
  }
  drawObject(ctx, obj) {
    const phase = this.state.phases[obj.index];
    const pos = obj.kind === 'dial' ? obj : obj.path[mod(phase, obj.path.length)];
    const x = (pos.x + .5) * CELL, y = (pos.y + .5) * CELL - 3;
    const selected = obj.id === this.selected;
    ctx.save();
    if (selected) { circle(ctx, x, y, 27, null, '#fff3b3', 4); circle(ctx, x, y, 30, null, '#dfaa4c', 2); }
    if (obj.kind === 'dial') {
      circle(ctx, x, y + 3, 22, '#8e714f'); circle(ctx, x, y, 22, '#e4b86f'); circle(ctx, x, y, 17, '#fff1ce');
      for (let i = 0; i < obj.period; i++) {
        const a = -Math.PI / 2 + i / obj.period * TAU;
        circle(ctx, x + Math.cos(a) * 14, y + Math.sin(a) * 14, 2.2, obj.openWhen.includes(i) ? '#44ad93' : '#bbafa0');
      }
      const a = -Math.PI / 2 + phase / obj.period * TAU;
      ctx.strokeStyle = '#34576a'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 10, y + Math.sin(a) * 10); ctx.stroke();
      circle(ctx, x, y, 3, '#34576a');
      if (this.state.rates[obj.index] === 0) { rounded(ctx, x + 11, y - 24, 15, 15, 5, '#4eaa9f'); ctx.fillStyle = '#fff'; ctx.fillRect(x + 15, y - 21, 2, 9); ctx.fillRect(x + 19, y - 21, 2, 9); }
    } else {
      circle(ctx, x, y + 3, 20, '#934c57'); circle(ctx, x, y, 19, '#f08078'); circle(ctx, x, y, 12, '#fff1dc'); circle(ctx, x, y, 7, '#654a60'); circle(ctx, x - 2, y - 2, 2, '#fff');
      ctx.strokeStyle = '#ffb5a2'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 24, .3, 2.4); ctx.stroke();
    }
    ctx.restore();
  }
  drawAnchor(ctx, anchor) {
    const x = (anchor.x + .5) * CELL, y = (anchor.y + .5) * CELL - 4;
    const bob = Math.sin(this.time * .003 + anchor.index) * 2;
    ctx.save(); ctx.shadowColor = '#ffcf68'; ctx.shadowBlur = this.options.quality === 'low' ? 0 : 16;
    circle(ctx, x, y + 8, 20, 'rgba(255,210,109,.27)');
    ctx.fillStyle = '#ffcb68'; ctx.beginPath(); ctx.moveTo(x, y - 20 + bob); ctx.lineTo(x + 14, y + bob); ctx.lineTo(x, y + 17 + bob); ctx.lineTo(x - 14, y + bob); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = '#fff6d7'; ctx.beginPath(); ctx.moveTo(x, y - 20 + bob); ctx.lineTo(x + 3, y + bob); ctx.lineTo(x, y + 17 + bob); ctx.lineTo(x - 8, y + bob); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  drawPlayer(ctx) {
    const x = (this.vis.x + .5) * CELL, y = (this.vis.y + .5) * CELL;
    ctx.save();
    ctx.fillStyle = 'rgba(33,66,76,.24)'; ctx.beginPath(); ctx.ellipse(x, y + 18, 16, 6, 0, 0, TAU); ctx.fill();
    // A little explorer: ivory cloak, dark face and a distinctive teal scarf.
    ctx.fillStyle = '#f7f3e6'; ctx.beginPath(); ctx.moveTo(x - 15, y + 13); ctx.quadraticCurveTo(x - 13, y - 13, x, y - 17); ctx.quadraticCurveTo(x + 13, y - 13, x + 15, y + 13); ctx.quadraticCurveTo(x, y + 20, x - 15, y + 13); ctx.fill();
    ctx.strokeStyle = '#b8c8c4'; ctx.lineWidth = 2; ctx.stroke();
    circle(ctx, x, y - 9, 10, '#4d6672');
    circle(ctx, x - 3, y - 10, 1.5, '#e7fff6'); circle(ctx, x + 3, y - 10, 1.5, '#e7fff6');
    rounded(ctx, x - 12, y + 1, 24, 6, 3, '#50bdaa');
    ctx.fillStyle = '#50bdaa'; ctx.beginPath(); ctx.moveTo(x + 5, y + 5); ctx.lineTo(x + 15, y + 15); ctx.lineTo(x + 6, y + 13); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  cellAt(clientX, clientY) {
    if (!this.level) return null;
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.floor((clientX - rect.left - this.camera.ox) / this.camera.scale / CELL);
    const y = Math.floor((clientY - rect.top - this.camera.oy) / this.camera.scale / CELL);
    return x >= 0 && y >= 0 && x < this.level.w && y < this.level.h ? { x, y } : null;
  }
  hitTest(clientX, clientY) {
    const cell = this.cellAt(clientX, clientY);
    if (!cell || !this.state) return null;
    for (const obj of this.level.objects) {
      const pos = obj.kind === 'dial' ? obj : obj.path[mod(this.state.phases[obj.index], obj.path.length)];
      if (pos.x === cell.x && pos.y === cell.y) return obj.id;
    }
    const control = this.level.controlMap.get(cell.y * this.level.w + cell.x);
    return control ? this.level.objects[control.index].id : null;
  }
}

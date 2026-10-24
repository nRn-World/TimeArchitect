// Original isometric renderer for Time Architect.
// Everything is drawn procedurally on a 2D canvas: no external art assets.
import { TILE, controlledTileOpen } from '../core/level.js';
import { hash2, mod } from '../core/math.js';

const TW = 96;
const TH = 48;
const WALL_H = 66;
const TAU = Math.PI * 2;

const PALETTES = {
  ink: {
    bg0: '#04070c',
    bg1: '#0b1420',
    stoneA: '#263c50',
    stoneB: '#1c2c3c',
    slab: '#101b27',
    wall: '#101b28',
    wallTop: '#2c4257',
    edge: '#43617d',
    accent: '#6fe6ff',
    warm: '#ffc76b',
    danger: '#ff5f7a',
    void: '#010307',
    rune: '#356080',
    crystal: '#ffd27a'
  },
  brass: {
    bg0: '#0a0705',
    bg1: '#1a120a',
    stoneA: '#2b2118',
    stoneB: '#221a12',
    slab: '#140f0a',
    wall: '#1a120b',
    wallTop: '#4a3720',
    edge: '#7a5a30',
    accent: '#ffd07a',
    warm: '#ffe2a6',
    danger: '#ff6b5c',
    void: '#050302',
    rune: '#5a4426',
    crystal: '#ffe29a'
  },
  verdant: {
    bg0: '#03090a',
    bg1: '#08171a',
    stoneA: '#152a25',
    stoneB: '#10221e',
    slab: '#081210',
    wall: '#0b1a17',
    wallTop: '#20463a',
    edge: '#2f6b56',
    accent: '#8bffc8',
    warm: '#ffe08a',
    danger: '#ff7a6b',
    void: '#010605',
    rune: '#245244',
    crystal: '#b6ffdc'
  },
  ember: {
    bg0: '#0a0405',
    bg1: '#1d0c0d',
    stoneA: '#2c1a1a',
    stoneB: '#231414',
    slab: '#130a0b',
    wall: '#1a0f10',
    wallTop: '#4d2a26',
    edge: '#7c3f33',
    accent: '#ff9d6e',
    warm: '#ffd39a',
    danger: '#ff4f6b',
    void: '#060203',
    rune: '#5c2f28',
    crystal: '#ffc08a'
  },
  cosmic: {
    bg0: '#05040e',
    bg1: '#100d24',
    stoneA: '#1c1936',
    stoneB: '#16132c',
    slab: '#0b0918',
    wall: '#100d20',
    wallTop: '#342c62',
    edge: '#4c3f8c',
    accent: '#b79cff',
    warm: '#ffd6a0',
    danger: '#ff6193',
    void: '#020106',
    rune: '#332a63',
    crystal: '#e0c9ff'
  }
};

const iso = (x, y) => ({ x: (x - y) * (TW / 2), y: (x + y) * (TH / 2) });

function diamondPath(ctx, cx, cy, w, h) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - h / 2);
  ctx.lineTo(cx + w / 2, cy);
  ctx.lineTo(cx, cy + h / 2);
  ctx.lineTo(cx - w / 2, cy);
  ctx.closePath();
}

function polygon(ctx, points, fill, stroke, lineWidth = 1) {
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

function shade(hex, amount) {
  const value = hex.replace('#', '');
  const num = parseInt(value.length === 3 ? value.split('').map((c) => c + c).join('') : value, 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 255) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 255) + amount));
  const b = Math.max(0, Math.min(255, (num & 255) + amount));
  return `rgb(${r},${g},${b})`;
}

function withAlpha(hex, alpha) {
  const value = hex.replace('#', '');
  const num = parseInt(value.length === 3 ? value.split('').map((c) => c + c).join('') : value, 16);
  return `rgba(${(num >> 16) & 255},${(num >> 8) & 255},${num & 255},${alpha})`;
}

export class Scene {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.level = null;
    this.state = null;
    this.palette = PALETTES.ink;
    this.options = { reducedMotion: false, highContrast: false, quality: 'high', ghosts: true };
    this.time = 0;
    this.dt = 0;
    this.running = false;
    this.selected = null;
    this.highlight = new Set();
    this.ghosts = null;
    this.camera = { scale: 1, ox: 0, oy: 0 };
    this.vis = { x: 0, y: 0 };
    this.particles = [];
    this.rings = [];
    this.shake = 0;
    this.flash = 0;
    this.flashColor = '#ff5f7a';
    this.motes = Array.from({ length: 26 }, (_, index) => ({
      x: (index * 137) % 1000 / 1000,
      y: (index * 311) % 1000 / 1000,
      z: 0.3 + ((index * 53) % 100) / 140,
      speed: 0.004 + ((index * 17) % 40) / 9000
    }));
    this.boundFrame = this.frame.bind(this);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
  }

  setOptions(options) {
    this.options = { ...this.options, ...options };
    this.resize();
  }

  load(level, state) {
    this.level = level;
    this.state = state;
    this.palette = PALETTES[level.palette] || PALETTES.ink;
    this.tiles = [];
    for (let y = 0; y < level.h; y += 1) {
      for (let x = 0; x < level.w; x += 1) {
        const tile = level.base[y * level.w + x];
        if (tile === TILE.VOID && !this.hasNeighbourFloor(x, y)) continue;
        const point = iso(x, y);
        this.tiles.push({ x, y, tile, sx: point.x, sy: point.y, z: x + y, key: y * level.w + x });
      }
    }
    this.tiles.sort((a, b) => a.z - b.z || a.x - b.x);
    this.vis.x = state?.px ?? level.start.x;
    this.vis.y = state?.py ?? level.start.y;
    this.selected = null;
    this.highlight.clear();
    this.particles = [];
    this.rings = [];
    this.shake = 0;
    this.flash = 0;
    this.computeCamera();
    this.active = true;
  }

  clear() {
    this.active = false;
    this.level = null;
    this.state = null;
  }

  hasNeighbourFloor(x, y) {
    const level = this.level;
    const neighbours = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1]
    ];
    return neighbours.some(([nx, ny]) => {
      if (nx < 0 || ny < 0 || nx >= level.w || ny >= level.h) return false;
      const tile = level.base[ny * level.w + nx];
      return tile !== TILE.VOID;
    });
  }

  sync(state) {
    if (!this.level || !state) return;
    this.state = state;
  }

  setSelection(id) {
    this.selected = id;
  }

  setHighlight(keys) {
    this.highlight = new Set(keys || []);
  }

  setGhosts(ghosts) {
    this.ghosts = ghosts;
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, this.options.quality === 'low' ? 1 : 2);
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    this.dpr = dpr;
    this.width = width;
    this.height = height;
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.computeCamera();
  }

  computeCamera() {
    if (!this.level) {
      this.camera = { scale: 1, ox: (this.width || 0) / 2, oy: (this.height || 0) / 2 };
      return;
    }
    const level = this.level;
    const corners = [
      iso(0, 0),
      iso(level.w - 1, 0),
      iso(0, level.h - 1),
      iso(level.w - 1, level.h - 1)
    ];
    const minX = Math.min(...corners.map((c) => c.x)) - TW * 0.7;
    const maxX = Math.max(...corners.map((c) => c.x)) + TW * 0.7;
    const minY = Math.min(...corners.map((c) => c.y)) - WALL_H - 46;
    const maxY = Math.max(...corners.map((c) => c.y)) + TH * 0.9;
    const spanX = maxX - minX;
    const spanY = maxY - minY;
    const padding = 20;
    const scale = Math.min((this.width - padding * 2) / spanX, (this.height - padding * 2) / spanY);
    const safeScale = Math.max(0.34, Math.min(1.5, scale));
    this.camera = {
      scale: safeScale,
      ox: this.width / 2 - ((minX + maxX) / 2) * safeScale,
      oy: this.height / 2 - ((minY + maxY) / 2) * safeScale
    };
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.canvas.ownerDocument.defaultView.requestAnimationFrame(this.boundFrame);
  }

  stop() {
    this.running = false;
  }

  frame(now) {
    if (!this.running) return;
    const dt = Math.min(48, now - (this.last || now));
    this.last = now;
    this.dt = dt;
    if (!this.options.reducedMotion) this.time += dt;
    this.updateEffects(dt);
    this.render();
    this.canvas.ownerDocument.defaultView.requestAnimationFrame(this.boundFrame);
  }

  updateEffects(dt) {
    const gravity = 0.0022 * dt * this.camera.scale;
    for (const particle of this.particles) {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += gravity;
      particle.vx *= 0.995;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const ring of this.rings) {
      ring.life -= dt;
      ring.r += dt * 0.06 * (this.options.reducedMotion ? 0 : 1);
    }
    this.rings = this.rings.filter((r) => r.life > 0);
    this.shake = Math.max(0, this.shake - dt * 0.05);
    this.flash = Math.max(0, this.flash - dt * 0.0022);
    if (this.options.reducedMotion) this.shake = 0;
  }

  spawnParticles(sx, sy, color, count, spread = 1) {
    if (this.options.quality === 'low' || this.options.reducedMotion) return;
    const total = this.options.quality === 'medium' ? Math.ceil(count * 0.5) : count;
    for (let i = 0; i < total; i += 1) {
      const angle = Math.random() * TAU;
      const speed = (0.03 + Math.random() * 0.09) * spread;
      this.particles.push({
        x: sx,
        y: sy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.04 * spread,
        life: 420 + Math.random() * 620,
        maxLife: 1000,
        size: 1.4 + Math.random() * 2.6,
        color
      });
    }
  }

  spawnRing(sx, sy, color, radius = 40) {
    this.rings.push({ x: sx, y: sy, r: radius * 0.25, color, life: 700, maxLife: 700 });
  }

  effectStep(from, to) {
    if (!this.level) return;
    const a = iso(from.x, from.y);
    const b = iso(to.x, to.y);
    this.spawnParticles(b.x, b.y - 4, withAlpha(this.palette.accent, 0.85), 5, 0.7);
    this.spawnRing(b.x, b.y, withAlpha(this.palette.accent, 0.35), 26);
    this.lastStep = { a, b };
  }

  effectCollect(x, y) {
    const point = iso(x, y);
    this.spawnParticles(point.x, point.y - 26, this.palette.crystal, 26, 1.6);
    this.spawnRing(point.x, point.y, withAlpha(this.palette.crystal, 0.5), 56);
    this.flash = 0.25;
    this.flashColor = this.palette.crystal;
  }

  effectFail(x, y) {
    const point = iso(x, y);
    this.spawnParticles(point.x, point.y - 18, this.palette.danger, 34, 1.9);
    this.spawnRing(point.x, point.y, withAlpha(this.palette.danger, 0.6), 70);
    this.flash = 1;
    this.flashColor = this.palette.danger;
    this.shake = 14;
  }

  effectWin() {
    for (let i = 0; i < 3; i += 1) {
      this.spawnRing(0, 0, withAlpha(this.palette.accent, 0.4), 80 + i * 50);
    }
    this.flash = 0.6;
    this.flashColor = this.palette.accent;
  }

  render() {
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.drawBackground(ctx);
    if (!this.level || !this.state) {
      this.drawVignette(ctx);
      return;
    }
    const { scale, ox, oy } = this.camera;
    const shakeX = this.shake ? (Math.random() - 0.5) * this.shake : 0;
    const shakeY = this.shake ? (Math.random() - 0.5) * this.shake : 0;

    ctx.save();
    ctx.translate(ox + shakeX, oy + shakeY);
    ctx.scale(scale, scale);

    // Soft slab shadow so the chamber floats above the ink.
    const shadow = ctx.createRadialGradient(0, 190, 60, 0, 190, 460);
    shadow.addColorStop(0, 'rgba(0,0,0,0.55)');
    shadow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.ellipse(0, 190, (this.level.w + this.level.h) * 30, (this.level.w + this.level.h) * 10, 0, 0, TAU);
    ctx.fill();

    const drawables = [];
    for (const tile of this.tiles) drawables.push({ z: tile.z * 2, kind: 'tile', tile });
    const objects = this.collectObjects();
    for (const object of objects) drawables.push({ z: object.z * 2 + 1, kind: 'object', object });
    drawables.push({ z: (this.state.px + this.state.py) * 2 + 1.5, kind: 'player' });
    drawables.sort((a, b) => a.z - b.z);

    for (const entry of drawables) {
      if (entry.kind === 'tile') this.drawTile(ctx, entry.tile);
      else if (entry.kind === 'object') this.drawObject(ctx, entry.object);
      else this.drawPlayer(ctx);
    }

    // Anchors are objectives: always draw them above the architecture so a wall
    // can never hide the way forward.
    const state = this.state;
    for (const anchor of this.level.anchors) {
      if (state.got[anchor.index]) continue;
      this.drawAnchor(ctx, { anchor, x: anchor.x, y: anchor.y });
    }

    if (this.options.ghosts) this.drawGhosts(ctx);
    this.drawEffects(ctx);
    ctx.restore();

    this.drawVignette(ctx);
    if (this.flash > 0.01) {
      ctx.globalAlpha = Math.min(0.5, this.flash * 0.4);
      ctx.fillStyle = this.flashColor;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.globalAlpha = 1;
    }
  }

  drawBackground(ctx) {
    const { width, height } = this;
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, this.palette.bg1);
    gradient.addColorStop(1, this.palette.bg0);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height * 0.46;
    const radius = Math.min(width, height) * 0.62;
    ctx.save();
    ctx.globalAlpha = 0.14;
    ctx.strokeStyle = this.palette.edge;
    for (let i = 1; i <= 5; i += 1) {
      ctx.beginPath();
      ctx.lineWidth = i === 2 ? 1.6 : 0.8;
      ctx.arc(cx, cy, radius * (i / 5), 0, TAU);
      ctx.stroke();
    }
    const spin = this.time * 0.00008;
    for (let i = 0; i < 24; i += 1) {
      const angle = spin + (i / 24) * TAU;
      const inner = radius * 0.78;
      const outer = radius * (i % 3 === 0 ? 0.92 : 0.86);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
      ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
      ctx.stroke();
    }
    ctx.restore();

    if (this.options.quality !== 'low' && !this.options.reducedMotion) {
      ctx.save();
      for (const mote of this.motes) {
        const px = ((mote.x + this.time * mote.speed * 0.02) % 1) * width;
        const py = ((mote.y - this.time * mote.speed * 0.01 + 1) % 1) * height;
        ctx.globalAlpha = 0.16 * mote.z;
        ctx.fillStyle = this.palette.accent;
        ctx.beginPath();
        ctx.arc(px, py, 1.4 + mote.z, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  drawVignette(ctx) {
    const { width, height } = this;
    const gradient = ctx.createRadialGradient(width / 2, height * 0.48, Math.min(width, height) * 0.2, width / 2, height * 0.5, Math.max(width, height) * 0.75);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  collectObjects() {
    const level = this.level;
    const state = this.state;
    const list = [];
    level.objects.forEach((obj, index) => {
      if (obj.kind === 'dial') {
        list.push({ kind: 'dial', obj, index, x: obj.x, y: obj.y, z: obj.x + obj.y });
      } else if (obj.kind === 'drone') {
        const phase = mod(state.phases[index], obj.path.length);
        const cell = obj.path[phase];
        list.push({ kind: 'drone', obj, index, x: cell.x, y: cell.y, z: cell.x + cell.y + 0.35 });
      }
    });
    return list;
  }

  drawTile(ctx, tile) {
    const palette = this.palette;
    const { sx, sy, tile: type } = tile;
    const highContrast = this.options.highContrast;
    if (type === TILE.VOID) {
      ctx.fillStyle = palette.void;
      diamondPath(ctx, sx, sy, TW * 0.98, TH * 0.98);
      ctx.fill();
      ctx.strokeStyle = withAlpha(palette.edge, highContrast ? 0.6 : 0.25);
      ctx.lineWidth = 1;
      ctx.stroke();
      return;
    }

    if (type === TILE.WALL) {
      const topY = sy - WALL_H;
      const halfW = TW / 2;
      const halfH = TH / 2;
      const left = { x: sx - halfW, y: sy };
      const right = { x: sx + halfW, y: sy };
      const bottom = { x: sx, y: sy + halfH };
      const top = { x: sx, y: sy - halfH };
      polygon(ctx, [left, top, { x: top.x, y: top.y - WALL_H }, { x: left.x, y: left.y - WALL_H }], shade(palette.wall, -6));
      polygon(ctx, [top, right, { x: right.x, y: right.y - WALL_H }, { x: top.x, y: top.y - WALL_H }], shade(palette.wall, 10));
      diamondPath(ctx, sx, topY, TW, TH);
      ctx.fillStyle = palette.wallTop;
      ctx.fill();
      ctx.strokeStyle = withAlpha(palette.edge, highContrast ? 0.85 : 0.5);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.strokeStyle = withAlpha(palette.warm, 0.22);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(sx - halfW, sy);
      ctx.lineTo(sx, sy + halfH);
      ctx.lineTo(sx + halfW, sy);
      ctx.stroke();
      const glint = hash2(tile.x, tile.y, 3);
      if (glint > 0.6) {
        ctx.strokeStyle = withAlpha(palette.accent, 0.18);
        ctx.beginPath();
        ctx.moveTo(sx - halfW * 0.4, topY);
        ctx.lineTo(sx, topY + halfH * 0.4);
        ctx.lineTo(sx + halfW * 0.35, topY + halfH * 0.1);
        ctx.stroke();
      }
      return;
    }

    const slab = type === TILE.GATE || type === TILE.BRIDGE;
    const base = slab ? shade(palette.slab, 10) : palette.stoneA;
    const variation = hash2(tile.x, tile.y, 1) > 0.5 ? 6 : -4;
    diamondPath(ctx, sx, sy, TW, TH);
    const gradient = ctx.createLinearGradient(sx - TW / 2, sy - TH / 2, sx + TW / 2, sy + TH / 2);
    gradient.addColorStop(0, shade(base, variation + 16));
    gradient.addColorStop(1, shade(base, variation - 4));
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = withAlpha(palette.edge, highContrast ? 0.9 : 0.42);
    ctx.lineWidth = 1;
    ctx.stroke();

    if (!slab) {
      this.drawLightPool(ctx, tile);
      diamondPath(ctx, sx, sy, TW * 0.74, TH * 0.74);
      ctx.strokeStyle = withAlpha(palette.rune, 0.5);
      ctx.stroke();
      const rune = hash2(tile.x, tile.y, 7);
      if (rune > 0.72) {
        ctx.strokeStyle = withAlpha(palette.accent, 0.16);
        ctx.beginPath();
        ctx.arc(sx, sy, TH * 0.22, 0.4, 2.4);
        ctx.stroke();
      }
    }
    if (type === TILE.PEDESTAL) {
      const top = sy - 16;
      polygon(ctx, [
        { x: sx - TW * 0.26, y: sy - 2 },
        { x: sx - TW * 0.18, y: top },
        { x: sx + TW * 0.18, y: top },
        { x: sx + TW * 0.26, y: sy - 2 }
      ], shade(palette.wallTop, -18), withAlpha(palette.edge, 0.6));
    }
    if (type === TILE.GATE) this.drawGateTile(ctx, tile);
    if (type === TILE.BRIDGE) this.drawBridgeTile(ctx, tile);
  }

  drawLightPool(ctx, tile) {
    if (this.options.quality === 'low') return;
    const palette = this.palette;
    let strength = 0;
    let color = palette.warm;
    for (const anchor of this.level.anchors) {
      if (this.state.got[anchor.index]) continue;
      const distance = Math.abs(anchor.x - tile.x) + Math.abs(anchor.y - tile.y);
      if (distance > 2) continue;
      const value = (3 - distance) * 0.42;
      if (value > strength) {
        strength = value;
        color = palette.crystal;
      }
    }
    for (const obj of this.level.objects) {
      if (obj.kind !== 'dial') continue;
      const distance = Math.abs(obj.x - tile.x) + Math.abs(obj.y - tile.y);
      if (distance > 2) continue;
      const value = (3 - distance) * 0.3;
      if (value > strength) {
        strength = value;
        color = palette.accent;
      }
    }
    if (strength <= 0) return;
    const { sx, sy } = tile;
    ctx.save();
    diamondPath(ctx, sx, sy, TW, TH);
    ctx.clip();
    const glow = ctx.createRadialGradient(sx, sy, 2, sx, sy, TW * 0.95);
    glow.addColorStop(0, withAlpha(color, 0.34 * strength));
    glow.addColorStop(0.55, withAlpha(color, 0.1 * strength));
    glow.addColorStop(1, withAlpha(color, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(sx - TW, sy - TH, TW * 2, TH * 2);
    ctx.restore();
  }

  drawGateTile(ctx, tile) {
    const state = this.state;
    const palette = this.palette;
    const open = controlledTileOpen(this.level, state, tile.x, tile.y);
    const { sx, sy } = tile;
    const height = 34;
    ctx.save();
    ctx.globalAlpha = open ? 0.28 : 1;
    for (const side of [-1, 1]) {
      const px = sx + side * TW * 0.3;
      ctx.fillStyle = shade(palette.wallTop, -20);
      ctx.beginPath();
      ctx.moveTo(px - 4, sy);
      ctx.lineTo(px - 2, sy - height);
      ctx.lineTo(px + 2, sy - height);
      ctx.lineTo(px + 4, sy);
      ctx.closePath();
      ctx.fill();
    }
    if (open) {
      ctx.strokeStyle = withAlpha(palette.accent, 0.4);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(sx - TW * 0.28, sy - 4);
      ctx.lineTo(sx + TW * 0.28, sy - 4);
      ctx.stroke();
    } else {
      const bars = 5;
      for (let i = 0; i < bars; i += 1) {
        const t = (i + 0.5) / bars;
        const bx = sx - TW * 0.28 + t * TW * 0.56;
        const by = sy - height * 0.55 + Math.abs(0.5 - t) * 10;
        ctx.strokeStyle = withAlpha(palette.accent, 0.5);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx, by - height * 0.32);
        ctx.lineTo(bx, by + height * 0.3);
        ctx.stroke();
      }
      ctx.strokeStyle = withAlpha(palette.accent, 0.75);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(sx - TW * 0.28, sy - height * 0.6);
      ctx.lineTo(sx + TW * 0.28, sy - height * 0.6);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawBridgeTile(ctx, tile) {
    const state = this.state;
    const palette = this.palette;
    const active = controlledTileOpen(this.level, state, tile.x, tile.y);
    const { sx, sy } = tile;
    ctx.save();
    if (active) {
      ctx.fillStyle = shade(palette.wallTop, -10);
      diamondPath(ctx, sx, sy, TW * 0.9, TH * 0.9);
      ctx.fill();
      ctx.strokeStyle = withAlpha(palette.accent, 0.55);
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.strokeStyle = withAlpha(palette.warm, 0.35);
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.moveTo(sx - TW * 0.36, sy + i * 9);
        ctx.lineTo(sx + TW * 0.36, sy + i * 9);
        ctx.stroke();
      }
    } else {
      ctx.globalAlpha = 0.42;
      ctx.strokeStyle = withAlpha(palette.accent, 0.8);
      ctx.setLineDash([6, 7]);
      ctx.lineWidth = 1.4;
      diamondPath(ctx, sx, sy, TW * 0.82, TH * 0.82);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  drawObject(ctx, entry) {
    if (entry.kind === 'dial') this.drawDial(ctx, entry);
    else if (entry.kind === 'drone') this.drawDrone(ctx, entry);
    else if (entry.kind === 'anchor') this.drawAnchor(ctx, entry);
  }

  drawDial(ctx, entry) {
    const { obj, index } = entry;
    const state = this.state;
    const palette = this.palette;
    const point = iso(obj.x, obj.y);
    const phase = state.phases[index];
    const rate = state.rates[index];
    const baseY = point.y - 22;
    const isSelected = this.selected === obj.id;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(point.x, point.y + 4, 26, 12, 0, 0, TAU);
    ctx.fill();

    const glowColor = rate === 0 ? palette.warm : rate < 0 ? '#c8a0ff' : rate > 1 ? palette.accent : palette.accent;
    const column = ctx.createLinearGradient(point.x - 16, 0, point.x + 16, 0);
    column.addColorStop(0, shade(palette.wallTop, -28));
    column.addColorStop(0.5, shade(palette.wallTop, 4));
    column.addColorStop(1, shade(palette.wallTop, -34));
    polygon(ctx, [
      { x: point.x - 16, y: baseY + 20 },
      { x: point.x - 11, y: baseY - 52 },
      { x: point.x + 11, y: baseY - 52 },
      { x: point.x + 16, y: baseY + 20 }
    ], column, withAlpha(palette.edge, 0.7));

    const ringY = baseY - 22;
    const spin = phase / obj.period;
    ctx.save();
    ctx.translate(point.x, ringY);
    ctx.scale(1, 0.52);
    ctx.beginPath();
    ctx.strokeStyle = withAlpha(palette.edge, 0.9);
    ctx.lineWidth = 4;
    ctx.arc(0, 0, 17, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.strokeStyle = withAlpha(glowColor, 0.9);
    ctx.lineWidth = 3;
    const start = -Math.PI / 2;
    ctx.arc(0, 0, 17, start, start + spin * TAU);
    ctx.stroke();
    for (let i = 0; i < obj.period; i += 1) {
      const angle = start + (i / obj.period) * TAU;
      const active = obj.openWhen.includes(i);
      ctx.fillStyle = active ? withAlpha(palette.accent, 0.95) : withAlpha(palette.edge, 0.6);
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * 24, Math.sin(angle) * 24, active ? 2.4 : 1.5, 0, TAU);
      ctx.fill();
    }
    const handAngle = start + spin * TAU;
    ctx.strokeStyle = palette.warm;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(handAngle) * 15, Math.sin(handAngle) * 15);
    ctx.stroke();
    ctx.restore();

    if (this.options.quality !== 'low') {
      ctx.shadowColor = withAlpha(glowColor, 0.8);
      ctx.shadowBlur = 14;
      ctx.fillStyle = withAlpha(glowColor, 0.9);
      ctx.beginPath();
      ctx.arc(point.x, ringY - 2, 2.6, 0, TAU);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    if (isSelected) {
      ctx.strokeStyle = withAlpha(palette.warm, 0.9);
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 6]);
      ctx.lineDashOffset = -this.time * 0.01;
      ctx.beginPath();
      ctx.ellipse(point.x, point.y + 2, 30, 15, 0, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  drawDrone(ctx, entry) {
    const point = iso(entry.x, entry.y);
    const palette = this.palette;
    const selected = this.selected === entry.obj.id;
    const hover = 34 + Math.sin(this.time * 0.003 + entry.index) * 3;
    const cy = point.y - hover;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(point.x, point.y, 15, 7, 0, 0, TAU);
    ctx.fill();

    if (this.options.quality !== 'low') {
      ctx.shadowColor = withAlpha(palette.danger, 0.7);
      ctx.shadowBlur = 16;
    }
    const body = ctx.createRadialGradient(point.x - 4, cy - 5, 2, point.x, cy, 13);
    body.addColorStop(0, shade(palette.wallTop, 30));
    body.addColorStop(1, '#05070c');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(point.x, cy, 11, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = withAlpha(palette.warm, 0.75);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(point.x, cy + 2, 17, 6, this.time * 0.0015 + entry.index, 0, TAU);
    ctx.stroke();

    ctx.fillStyle = palette.danger;
    ctx.beginPath();
    ctx.arc(point.x, cy - 1, 3.2, 0, TAU);
    ctx.fill();
    if (this.options.quality === 'high') {
      ctx.strokeStyle = withAlpha(palette.danger, 0.35);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(point.x, cy - 1, 6.5, 0, TAU);
      ctx.stroke();
    }

    if (selected) {
      ctx.strokeStyle = withAlpha(palette.warm, 0.9);
      ctx.setLineDash([4, 5]);
      ctx.lineDashOffset = -this.time * 0.01;
      ctx.beginPath();
      ctx.ellipse(point.x, point.y, 22, 11, 0, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  drawAnchor(ctx, entry) {
    const point = iso(entry.x, entry.y);
    const palette = this.palette;
    const bob = Math.sin(this.time * 0.0024 + entry.anchor.index) * 4;
    const cy = point.y - 34 + bob;

    ctx.save();
    const beam = ctx.createLinearGradient(point.x, cy - 26, point.x, point.y + 8);
    beam.addColorStop(0, withAlpha(palette.crystal, 0.22));
    beam.addColorStop(1, withAlpha(palette.crystal, 0));
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(point.x - 13, point.y + 8);
    ctx.lineTo(point.x - 4, cy - 30);
    ctx.lineTo(point.x + 4, cy - 30);
    ctx.lineTo(point.x + 13, point.y + 8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = withAlpha(palette.crystal, 0.4);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(point.x, point.y, 16, 8, 0, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = withAlpha(palette.crystal, 0.2);
    ctx.beginPath();
    ctx.ellipse(point.x, point.y, 22, 11, 0, 0, TAU);
    ctx.stroke();

    if (this.options.quality !== 'low') {
      ctx.shadowColor = withAlpha(palette.crystal, 0.9);
      ctx.shadowBlur = 22;
    }
    const facet = ctx.createLinearGradient(point.x, cy - 20, point.x, cy + 20);
    facet.addColorStop(0, '#fff6da');
    facet.addColorStop(0.5, palette.crystal);
    facet.addColorStop(1, shade(palette.crystal, -70));
    polygon(ctx, [
      { x: point.x, y: cy - 20 },
      { x: point.x + 12, y: cy },
      { x: point.x, y: cy + 18 },
      { x: point.x - 12, y: cy }
    ], facet, 'rgba(255,255,255,0.35)');
    ctx.shadowBlur = 0;

    ctx.strokeStyle = withAlpha(palette.crystal, 0.25);
    ctx.beginPath();
    ctx.ellipse(point.x, cy, 14, 5, 0.4, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  drawPlayer(ctx) {
    const palette = this.palette;
    const state = this.state;
    const target = iso(state.px, state.py);
    if (this.options.reducedMotion) {
      this.vis.x = target.x;
      this.vis.y = target.y;
    } else {
      this.vis.x += (target.x - this.vis.x) * Math.min(1, this.dt * 0.018);
      this.vis.y += (target.y - this.vis.y) * Math.min(1, this.dt * 0.018);
    }
    const cx = this.vis.x;
    const cy = this.vis.y;
    const facing = state.facing || 'down';
    const bob = Math.sin(this.time * 0.004) * 1.2;
    const bodyY = cy - 12 + bob;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 3, 16, 8, 0, 0, TAU);
    ctx.fill();

    const halo = ctx.createLinearGradient(cx, bodyY - 44, cx, bodyY + 6);
    halo.addColorStop(0, shade(palette.wallTop, 24));
    halo.addColorStop(1, '#070b12');
    ctx.beginPath();
    ctx.moveTo(cx - 15, bodyY + 4);
    ctx.quadraticCurveTo(cx - 13, bodyY - 26, cx, bodyY - 34);
    ctx.quadraticCurveTo(cx + 13, bodyY - 26, cx + 15, bodyY + 4);
    ctx.quadraticCurveTo(cx, bodyY + 12, cx - 15, bodyY + 4);
    ctx.closePath();
    ctx.fillStyle = halo;
    ctx.fill();
    ctx.strokeStyle = withAlpha(palette.accent, 0.28);
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(cx, bodyY - 32, 8.5, 9.5, 0, 0, TAU);
    ctx.fillStyle = '#0a0f17';
    ctx.fill();
    ctx.strokeStyle = withAlpha(palette.edge, 0.9);
    ctx.stroke();

    const visorOffset = facing === 'left' ? -2.5 : facing === 'right' ? 2.5 : 0;
    if (this.options.quality !== 'low') {
      ctx.shadowColor = palette.accent;
      ctx.shadowBlur = 12;
    }
    ctx.fillStyle = palette.accent;
    ctx.fillRect(cx - 4 + visorOffset, bodyY - 33, 8, 2.2);
    ctx.shadowBlur = 0;

    ctx.save();
    ctx.translate(cx, bodyY - 42);
    ctx.rotate(this.time * 0.0009);
    ctx.strokeStyle = withAlpha(palette.warm, 0.55);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 5.5, 0, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = withAlpha(palette.warm, 0.8);
    ctx.beginPath();
    ctx.arc(15, 0, 1.8, 0, TAU);
    ctx.fill();
    ctx.restore();

    const dirs = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    const [dx, dy] = dirs[facing] || [0, 1];
    ctx.strokeStyle = withAlpha(palette.accent, 0.5);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(cx + dx * 14, cy + 2 + dy * 6);
    ctx.lineTo(cx + dx * 20, cy + 2 + dy * 9);
    ctx.stroke();
    ctx.restore();
  }

  drawGhosts(ctx) {
    if (!this.ghosts) return;
    const palette = this.palette;
    ctx.save();
    ctx.globalAlpha = 0.35;
    for (const drone of this.ghosts.drones || []) {
      const point = iso(drone.x, drone.y);
      ctx.strokeStyle = withAlpha(palette.danger, 0.9);
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(point.x, point.y, 16, 8, 0, 0, TAU);
      ctx.stroke();
    }
    for (const tile of this.ghosts.closing || []) {
      const point = iso(tile.x, tile.y);
      ctx.strokeStyle = withAlpha(palette.danger, 0.65);
      ctx.setLineDash([3, 5]);
      ctx.lineWidth = 1.2;
      diamondPath(ctx, point.x, point.y, TW * 0.84, TH * 0.84);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();
  }

  drawEffects(ctx) {
    for (const ring of this.rings) {
      const alpha = Math.max(0, ring.life / ring.maxLife) * 0.7;
      ctx.strokeStyle = ring.color.replace(/[\d.]+\)$/, `${alpha})`);
      ctx.lineWidth = 2 * (1 - ring.life / ring.maxLife) + 0.6;
      ctx.beginPath();
      ctx.ellipse(ring.x, ring.y, ring.r, ring.r * 0.5, 0, 0, TAU);
      ctx.stroke();
    }
    for (const particle of this.particles) {
      const alpha = Math.min(1, particle.life / 380);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (this.highlight.size > 0) {
      ctx.save();
      ctx.strokeStyle = withAlpha(this.palette.warm, 0.55);
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 5]);
      ctx.lineDashOffset = -this.time * 0.012;
      for (const key of this.highlight) {
        const x = key % this.level.w;
        const y = Math.floor(key / this.level.w);
        const point = iso(x, y);
        diamondPath(ctx, point.x, point.y, TW * 0.9, TH * 0.9);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  hitTest(clientX, clientY) {
    if (!this.level || !this.state) return null;
    const rect = this.canvas.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    const worldX = (localX - this.camera.ox) / this.camera.scale;
    const worldY = (localY - this.camera.oy) / this.camera.scale;
    const fx = worldY / TH + worldX / TW;
    const fy = worldY / TH - worldX / TW;
    const cellX = Math.round(fx);
    const cellY = Math.round(fy);
    if (cellX < 0 || cellY < 0 || cellX >= this.level.w || cellY >= this.level.h) return null;

    for (const obj of this.level.objects) {
      if (obj.kind === 'dial') {
        if (obj.x === cellX && obj.y === cellY) return obj.id;
      } else if (obj.kind === 'drone') {
        const phase = mod(this.state.phases[obj.index], obj.path.length);
        const cell = obj.path[phase];
        if (cell.x === cellX && cell.y === cellY) return obj.id;
      }
    }
    const control = this.level.controlMap.get(cellY * this.level.w + cellX);
    if (control) return this.level.objects[control.index].id;
    return null;
  }
}

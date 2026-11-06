// Animated exercise figures, drawn as SVG from joint-angle poses.
import { EXERCISES } from './exercises.js';

const NS = 'http://www.w3.org/2000/svg';
const L = { T: 48, NECK: 13, HEAD: 9.5, TH: 38, SH: 38, UA: 28, FA: 26 };
const GROUND = 186;

const rad = (d) => (d * Math.PI) / 180;
const dir = (a) => [Math.cos(rad(a)), Math.sin(rad(a))];
const add = (p, a, len) => { const d = dir(a); return [p[0] + d[0] * len, p[1] + d[1] * len]; };
const sub = (p, a, len) => add(p, a, -len);

// Forward kinematics: pose angles → joint positions.
export function solve(p, front = false) {
  const th2 = p.th2 ?? p.th, sh2 = p.sh2 ?? p.sh;
  const ua2 = p.ua2 ?? p.ua, fa2 = p.fa2 ?? p.fa;
  let hip;
  if (p.a === 'foot') {
    const knee = sub([p.x, p.y], p.sh, L.SH);
    hip = sub(knee, p.th, L.TH);
  } else if (p.a === 'hand') {
    const elbow = sub([p.x, p.y], p.fa, L.FA);
    const neck = sub(elbow, p.ua, L.UA);
    hip = sub(neck, p.t, L.T);
  } else {
    hip = [p.x, p.y];
  }
  const neck = add(hip, p.t, L.T);
  const head = add(neck, p.t + (p.hd || 0), L.NECK);
  const knee = add(hip, p.th, L.TH), foot = add(knee, p.sh, L.SH);
  const elbow = add(neck, p.ua, L.UA), hand = add(elbow, p.fa, L.FA);
  let knee2 = add(hip, th2, L.TH), foot2 = add(knee2, sh2, L.SH);
  let elbow2 = add(neck, ua2, L.UA), hand2 = add(elbow2, fa2, L.FA);
  if (front) {
    // Front view: mirror the second limbs around the body's centre line.
    const m = (pt, cx) => [2 * cx - pt[0], pt[1]];
    knee2 = m(knee, hip[0]); foot2 = m(foot, hip[0]);
    elbow2 = m(elbow, neck[0]); hand2 = m(hand, neck[0]);
  }
  return { hip, neck, head, knee, foot, elbow, hand, knee2, foot2, elbow2, hand2 };
}

function lerpPose(A, B, k) {
  const out = { a: A.a };
  for (const key of Object.keys(A)) {
    if (key === 'a') continue;
    const a = A[key], b = B[key] ?? a;
    out[key] = a + (b - a) * k;
  }
  for (const key of Object.keys(B)) if (!(key in out)) out[key] = B[key];
  return out;
}

function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (parent) parent.appendChild(e);
  return e;
}

const fmt = (n) => Math.round(n * 10) / 10;
const pathOf = (...pts) => 'M' + pts.map((p) => `${fmt(p[0])} ${fmt(p[1])}`).join(' L');

// ── Static and attached props ──────────────────────────────────────
function staticProps(g, props) {
  for (const pr of props) {
    switch (pr.type) {
      case 'bench':
        el('rect', { x: pr.x, y: pr.y, width: pr.w, height: 8, rx: 3, class: 'pr-fill' }, g);
        el('path', { d: `M${pr.x + 8} ${pr.y + 8} V${GROUND} M${pr.x + pr.w - 8} ${pr.y + 8} V${GROUND}`, class: 'pr-line' }, g);
        break;
      case 'box':
        el('rect', { x: pr.x, y: pr.y, width: pr.w, height: GROUND - pr.y, rx: 4, class: 'pr-fill' }, g);
        break;
      case 'seat':
        el('rect', { x: pr.x, y: pr.y, width: pr.w, height: 8, rx: 3, class: 'pr-fill' }, g);
        el('path', { d: `M${pr.x + pr.w / 2} ${pr.y + 8} V${GROUND} M${pr.x + 6} ${GROUND} H${pr.x + pr.w - 6}`, class: 'pr-line' }, g);
        if (pr.back) el('rect', { x: pr.x - 2, y: pr.y - 62, width: 8, height: 62, rx: 3, class: 'pr-fill' }, g);
        break;
      case 'pad':
        el('rect', { x: pr.x - 9, y: pr.y - 6, width: 18, height: 12, rx: 6, class: 'pr-fill' }, g);
        break;
      case 'tower':
        el('rect', { x: pr.x - 5, y: 14, width: 12, height: GROUND - 14, rx: 3, class: 'pr-fill' }, g);
        break;
      case 'rail':
        el('path', { d: `M${pr.x1} ${pr.y1} L${pr.x2} ${pr.y2}`, class: 'pr-line', 'stroke-width': 4 }, g);
        break;
      case 'line':
        el('path', { d: `M${pr.x1} ${pr.y1} L${pr.x2} ${pr.y2}`, class: 'pr-line', 'stroke-width': pr.w || 4 }, g);
        break;
      case 'mat':
        el('rect', { x: 10, y: GROUND - 3, width: 180, height: 5, rx: 2.5, class: 'pr-accent' }, g);
        break;
      case 'bike':
        el('circle', { cx: 128, cy: 162, r: 22, class: 'pr-ring' }, g);
        el('path', { d: 'M86 110 L100 160 L128 162 M100 160 L124 118 L126 92 M120 92 H138 M74 108 H96 M64 186 L100 160 L140 186', class: 'pr-line' }, g);
        el('circle', { cx: 100, cy: 160, r: 4, class: 'pr-fill' }, g);
        break;
      case 'treadmill':
        el('path', { d: 'M24 184 L170 172 L176 182 L28 190 Z', class: 'pr-fill' }, g);
        el('path', { d: 'M166 172 L158 86 M158 86 L138 90', class: 'pr-line', 'stroke-width': 5 }, g);
        break;
      case 'rower':
        el('path', { d: 'M24 176 H176 M30 176 V186 M170 176 V186', class: 'pr-line', 'stroke-width': 5 }, g);
        el('circle', { cx: 168, cy: 152, r: 16, class: 'pr-ring' }, g);
        el('path', { d: 'M150 158 L150 176', class: 'pr-line', 'stroke-width': 6 }, g);
        break;
    }
  }
}

function attachedProps(g, props, J, front) {
  const pt = (name) => J[name];
  for (const pr of props) {
    switch (pr.type) {
      case 'db': {
        const hands = [J.hand];
        if (front || J.hand2[0] !== J.hand[0] || J.hand2[1] !== J.hand[1]) hands.push(J.hand2);
        for (const h of hands) {
          if (pr.vertical) {
            el('path', { d: `M${fmt(h[0])} ${fmt(h[1] - 9)} V${fmt(h[1] + 9)}`, class: 'pr-db-bar' }, g);
            el('rect', { x: fmt(h[0] - 7), y: fmt(h[1] - 13), width: 14, height: 6, rx: 2, class: 'pr-db' }, g);
            el('rect', { x: fmt(h[0] - 7), y: fmt(h[1] + 7), width: 14, height: 6, rx: 2, class: 'pr-db' }, g);
          } else {
            el('path', { d: `M${fmt(h[0] - 9)} ${fmt(h[1])} H${fmt(h[0] + 9)}`, class: 'pr-db-bar' }, g);
            el('rect', { x: fmt(h[0] - 13), y: fmt(h[1] - 7), width: 6, height: 14, rx: 2, class: 'pr-db' }, g);
            el('rect', { x: fmt(h[0] + 7), y: fmt(h[1] - 7), width: 6, height: 14, rx: 2, class: 'pr-db' }, g);
          }
        }
        break;
      }
      case 'bar': {
        const p = pt(pr.at);
        el('circle', { cx: fmt(p[0]), cy: fmt(p[1] - 6), r: 15, class: 'pr-db' }, g);
        el('circle', { cx: fmt(p[0]), cy: fmt(p[1] - 6), r: 3, class: 'pr-hole' }, g);
        break;
      }
      case 'cable': {
        const p = pt(pr.to);
        el('path', { d: `M${pr.x} ${pr.y} L${fmt(p[0])} ${fmt(p[1])}`, class: 'pr-cable' }, g);
        el('circle', { cx: pr.x, cy: pr.y, r: 4, class: 'pr-fill' }, g);
        break;
      }
      case 'handlebar': {
        const p = pt(pr.at);
        el('path', { d: `M${fmt(p[0] - 18)} ${fmt(p[1] - 3)} Q${fmt(p[0])} ${fmt(p[1] + 3)} ${fmt(p[0] + 18)} ${fmt(p[1] - 3)}`, class: 'pr-line', 'stroke-width': 4 }, g);
        break;
      }
      case 'plate': {
        const p = pt(pr.at);
        const d = dir(pr.angle);
        const h = pr.len / 2;
        el('path', { d: `M${fmt(p[0] - d[0] * h + 4)} ${fmt(p[1] - d[1] * h - 3)} L${fmt(p[0] + d[0] * h + 4)} ${fmt(p[1] + d[1] * h - 3)}`, class: 'pr-line', 'stroke-width': 7 }, g);
        break;
      }
      case 'roller': {
        const p = pt(pr.at);
        el('circle', { cx: fmt(p[0]), cy: fmt(p[1] - 7), r: 6, class: 'pr-db' }, g);
        break;
      }
    }
  }
  if (props.some((p) => p.type === 'rower')) {
    el('rect', { x: fmt(J.hip[0] - 14), y: 166, width: 28, height: 8, rx: 3, class: 'pr-fill' }, g);
    el('path', { d: `M152 150 L${fmt(J.hand[0])} ${fmt(J.hand[1])}`, class: 'pr-cable' }, g);
  }
}

// ── Figure ─────────────────────────────────────────────────────────
function drawBody(g, J, front) {
  const back = el('g', { class: 'fig-back' }, g);
  el('path', { d: pathOf(J.hip, J.knee2, J.foot2), class: 'fig-limb' }, back);
  el('path', { d: pathOf(J.neck, J.elbow2, J.hand2), class: 'fig-limb fig-arm' }, back);
  const fore = el('g', { class: 'fig-fore' }, g);
  el('path', { d: pathOf(J.hip, J.neck), class: 'fig-torso' }, fore);
  el('path', { d: pathOf(J.hip, J.knee, J.foot), class: 'fig-limb' }, fore);
  el('circle', { cx: fmt(J.head[0]), cy: fmt(J.head[1]), r: L.HEAD, class: 'fig-head' }, fore);
  el('path', { d: pathOf(J.neck, J.elbow, J.hand), class: 'fig-limb fig-arm' }, fore);
  if (front) back.setAttribute('class', 'fig-fore');
}

const live = new Set();
let rafId = 0;
const reduceMotion = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

function tick(now) {
  for (const f of live) {
    if (!f.svg.isConnected) { live.delete(f); continue; }
    f.render(now);
  }
  rafId = live.size ? requestAnimationFrame(tick) : 0;
}

export function createFigure(exId, { animate = true, className = '' } = {}) {
  const ex = EXERCISES[exId];
  const svg = el('svg', { viewBox: '0 0 200 200', class: `figure ${className}`, role: 'img', 'aria-label': `${ex?.name || 'Exercise'} demonstration` });
  if (!ex) return svg;
  const { A, B, props = [], front = false, speed = 1 } = ex.anim;
  el('path', { d: `M6 ${GROUND + 2} H194`, class: 'fig-ground' }, svg);
  staticProps(el('g', {}, svg), props);
  const dyn = el('g', {}, svg);
  const period = 2600 / speed;
  const offset = Math.random() * period;
  let lastK = -1;

  const render = (now) => {
    const ph = ((now + offset) % period) / period;
    let k = (1 - Math.cos(ph * 2 * Math.PI)) / 2;
    k = k * k * (3 - 2 * k); // ease with a little hold at each end
    if (Math.abs(k - lastK) < 0.002) return;
    lastK = k;
    const J = solve(lerpPose(A, B, k), front);
    dyn.replaceChildren();
    drawBody(dyn, J, front);
    attachedProps(dyn, props, J, front);
  };

  const f = { svg, render };
  if (animate && !reduceMotion) {
    live.add(f);
    if (!rafId) rafId = requestAnimationFrame(tick);
  }
  render(animate && !reduceMotion ? performance.now() : period * 0.75 - offset);
  return svg;
}

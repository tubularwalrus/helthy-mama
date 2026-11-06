// Celebration effects: confetti, sounds, haptics, screen wake lock.

let ctx = null;
let soundOn = true;

export function setSound(on) { soundOn = on; }

/** iOS only allows audio after a user gesture — call this from a tap. */
export function unlockAudio() {
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    // Play a silent blip so iOS fully unlocks the context.
    const o = ctx.createOscillator(), g = ctx.createGain();
    g.gain.value = 0;
    o.connect(g).connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + 0.01);
  } catch { /* no audio */ }
}

function tone(freq, start, dur, vol = 0.18, type = 'sine') {
  if (!ctx) return;
  const t = ctx.currentTime + start;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t); o.stop(t + dur + 0.05);
}

export function sound(kind) {
  if (!soundOn || !ctx) return;
  if (kind === 'tick') tone(880, 0, 0.12, 0.12, 'triangle');
  if (kind === 'go') { tone(660, 0, 0.18); tone(990, 0.18, 0.3); }
  if (kind === 'rest-end') { tone(784, 0, 0.18); tone(784, 0.25, 0.18); tone(1175, 0.5, 0.4); }
  if (kind === 'set') tone(1046, 0, 0.12, 0.1, 'triangle');
  if (kind === 'medal') [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, i * 0.09, 0.5, 0.15, 'triangle'));
  if (kind === 'finish') [392, 523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.12, 0.6, 0.16));
}

export function buzz(pattern = 40) {
  try { navigator.vibrate?.(pattern); } catch { /* unsupported (iOS) */ }
}

// ── Wake lock: keep the screen on during a workout ────────────────
let lock = null;
export async function keepAwake(on) {
  try {
    if (on && 'wakeLock' in navigator && !lock) {
      lock = await navigator.wakeLock.request('screen');
      lock.addEventListener?.('release', () => { lock = null; });
    } else if (!on && lock) {
      await lock.release();
      lock = null;
    }
  } catch { lock = null; }
}

// ── Confetti ───────────────────────────────────────────────────────
const COLORS = ['#ff5c7a', '#ff9a5b', '#ffd166', '#7a5cff', '#3ecfb2', '#ffffff'];

export function confetti({ count = 140, duration = 2600 } = {}) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('canvas');
  c.className = 'confetti';
  document.body.appendChild(c);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = (c.width = innerWidth * dpr), H = (c.height = innerHeight * dpr);
  const g = c.getContext('2d');
  const parts = Array.from({ length: count }, () => ({
    x: W / 2 + (Math.random() - 0.5) * W * 0.3,
    y: H * 0.45,
    vx: (Math.random() - 0.5) * 22 * dpr,
    vy: (-Math.random() * 22 - 8) * dpr,
    r: (4 + Math.random() * 5) * dpr,
    rot: Math.random() * 6,
    vr: (Math.random() - 0.5) * 0.4,
    color: COLORS[(Math.random() * COLORS.length) | 0],
    shape: Math.random() < 0.3 ? 'circle' : 'rect',
  }));
  const t0 = performance.now();
  const frame = (now) => {
    const t = now - t0;
    g.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.vy += 0.55 * dpr;
      p.vx *= 0.985;
      p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      g.save();
      g.globalAlpha = Math.max(0, 1 - t / duration);
      g.translate(p.x, p.y); g.rotate(p.rot);
      g.fillStyle = p.color;
      if (p.shape === 'circle') { g.beginPath(); g.arc(0, 0, p.r / 2, 0, 7); g.fill(); }
      else g.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
      g.restore();
    }
    if (t < duration) requestAnimationFrame(frame);
    else c.remove();
  };
  requestAnimationFrame(frame);
}

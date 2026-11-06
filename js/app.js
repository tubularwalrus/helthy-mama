// Momentum — main UI.
import { EXERCISES, TEMPLATES, LENGTHS } from './exercises.js';
import { createFigure } from './figure.js';
import { load, save, fresh, clear, exportJSON, importJSON } from './store.js';
import {
  exState, buildWorkout, estimateMinutes, nextTemplateId, weekPlan, sessionsInWeek,
  weekStreak, progress, progressFinisher, volumeOf,
} from './program.js';
import { medalList, checkMedals } from './medals.js';
import { confetti, sound, buzz, unlockAudio, keepAwake, setSound } from './fx.js';
import {
  DAY_NAMES, DAY_LETTERS, dayKey, parseDay, weekStart, addDays, esc, fmtNum, fmtWeight,
  fmtClock, fmtDuration, greeting, uid,
} from './util.js';

let S = load();
const ui = { tab: 'today', minimized: false, summary: null, sheet: null, ob: null, medalQueue: [] };
if (S) setSound(S.settings.sound);

const $app = document.getElementById('app');
const $view = document.getElementById('view');
const $tabs = document.getElementById('tabs');
const $sheet = document.getElementById('sheet');
const $overlay = document.getElementById('overlay');

const persist = () => save(S);

// ── Rendering helpers ──────────────────────────────────────────────
function hydrate(root) {
  root.querySelectorAll('[data-fig]').forEach((el) => {
    if (el.firstChild) return;
    el.appendChild(createFigure(el.dataset.fig, { animate: el.dataset.still === undefined }));
  });
}

function set(el, html) {
  el.innerHTML = html;
  hydrate(el);
}

const icon = {
  gear: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  more: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  chev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5-11-6.5Z"/></svg>',
  today: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 3 4 14h7l-1 7 9-11h-7l1-7Z"/></svg>',
  plan: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  progress: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5M4 19h16M8 15l3.5-4 3 2.5L20 7"/></svg>',
  medals: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="14.5" r="5.5"/><path d="M8.5 9.8 6 3h4l2 4.5L14 3h4l-2.5 6.8"/></svg>',
};

function goalText(it) {
  const ex = EXERCISES[it.id];
  if (ex.kind === 'time') return `${it.target}s hold`;
  if (ex.kind === 'body') return `${it.target} reps`;
  return `${it.target} reps · ${fmtWeight(it.weight)} lb`;
}

function prescription(it) {
  const ex = EXERCISES[it.id];
  if (ex.kind === 'interval') return `${it.rounds} rounds · ${it.work}s on / ${it.rest}s easy`;
  const side = ex.eachSide ? ' / side' : '';
  if (ex.kind === 'time') return `${it.sets} × ${it.target}s`;
  if (ex.kind === 'body') return `${it.sets} × ${it.target}${side}`;
  return `${it.sets} × ${it.target}${side} · ${fmtWeight(it.weight)} lb${ex.perHand ? ' each' : ''}`;
}

// ── Root render ────────────────────────────────────────────────────
function render() {
  document.body.dataset.mode = !S ? 'onboard' : S.active && !ui.minimized ? 'workout' : ui.summary ? 'summary' : 'tabs';
  if (!S) return renderOnboarding();
  if (S.active && !ui.minimized) return renderWorkout();
  if (ui.summary) return renderSummary();
  renderTabs();
  ({ today: renderToday, plan: renderPlan, progress: renderProgress, medals: renderMedals })[ui.tab]();
  $view.scrollTop = 0;
}

function renderTabs() {
  const tabs = [['today', 'Today'], ['plan', 'Plan'], ['progress', 'Progress'], ['medals', 'Medals']];
  $tabs.innerHTML = tabs.map(([id, label]) =>
    `<button class="tab ${ui.tab === id ? 'on' : ''}" data-act="tab" data-id="${id}" aria-label="${label}">${icon[id]}<span>${label}</span></button>`).join('');
}

// ── Onboarding ─────────────────────────────────────────────────────
function renderOnboarding() {
  ui.ob ||= { step: 0, name: '', days: [1, 3, 5], length: 45, startWeight: '', goalWeight: '' };
  const o = ui.ob;
  const dots = `<div class="ob-dots">${[0, 1, 2, 3, 4].map((i) => `<i class="${i === o.step ? 'on' : ''}"></i>`).join('')}</div>`;
  let body = '';
  if (o.step === 0) {
    body = `
      <div class="ob-hero"><div class="fig hero-fig" data-fig="goblet_squat"></div></div>
      <h1 class="ob-title">Your plan.<br><span class="grad">Your pace.</span></h1>
      <p class="ob-sub">Guided gym workouts that adapt to you every session. Built to burn fat, build tone and celebrate every win.</p>
      <button class="btn primary big" data-act="ob-next">Let’s get started</button>
      <button class="btn link" data-act="ob-import">Restore from a backup</button>`;
  } else if (o.step === 1) {
    body = `
      <h2 class="ob-q">First, what should we call you?</h2>
      <input id="ob-name" class="input big" type="text" placeholder="Your name" autocomplete="given-name" value="${esc(o.name)}" maxlength="24">
      <button class="btn primary big" data-act="ob-next">Continue</button>`;
  } else if (o.step === 2) {
    body = `
      <h2 class="ob-q">Which days do you want to train?</h2>
      <p class="ob-hint">Pick what fits your week — 3 days is a great place to start. You can change this any time.</p>
      <div class="day-pick">${[1, 2, 3, 4, 5, 6, 0].map((d) =>
        `<button class="day-tog ${o.days.includes(d) ? 'on' : ''}" data-act="ob-day" data-d="${d}">${DAY_NAMES[d]}</button>`).join('')}</div>
      <p class="ob-hint center">${o.days.length} day${o.days.length === 1 ? '' : 's'} a week</p>
      <button class="btn primary big" data-act="ob-next" ${o.days.length ? '' : 'disabled'}>Continue</button>`;
  } else if (o.step === 3) {
    body = `
      <h2 class="ob-q">How long are your workouts?</h2>
      <div class="len-pick">${[30, 45, 60].map((m) =>
        `<button class="len-opt ${o.length === m ? 'on' : ''}" data-act="ob-len" data-m="${m}"><b>${m}</b><span>min</span><small>${LENGTHS[m].moves} moves + cardio</small></button>`).join('')}</div>
      <button class="btn primary big" data-act="ob-next">Continue</button>`;
  } else {
    body = `
      <h2 class="ob-q">Want to track your weight?</h2>
      <p class="ob-hint">Optional — this unlocks weight-loss medals and your progress chart.</p>
      <label class="field"><span>Current weight</span><div class="suffix"><input id="ob-cur" class="input" type="number" inputmode="decimal" placeholder="e.g. 160" value="${esc(o.startWeight)}"><em>lb</em></div></label>
      <label class="field"><span>Goal weight</span><div class="suffix"><input id="ob-goal" class="input" type="number" inputmode="decimal" placeholder="e.g. 145" value="${esc(o.goalWeight)}"><em>lb</em></div></label>
      <button class="btn primary big" data-act="ob-finish">Build my plan ✨</button>`;
  }
  set($view, `<div class="ob">${o.step ? `<button class="btn ghost back" data-act="ob-back">‹ Back</button>` : ''}${dots}${body}</div>`);
  $tabs.innerHTML = '';
}

function readOnboardingInputs() {
  const o = ui.ob;
  const n = document.getElementById('ob-name'); if (n) o.name = n.value.trim();
  const c = document.getElementById('ob-cur'); if (c) o.startWeight = c.value;
  const g = document.getElementById('ob-goal'); if (g) o.goalWeight = g.value;
}

// ── Today ──────────────────────────────────────────────────────────
function weekStrip() {
  const week = weekPlan(S);
  return `<div class="week-strip">${week.map((d) => {
    const done = d.sessions.length > 0;
    const cls = [done ? 'done' : '', d.planned ? 'planned' : '', d.isToday ? 'today' : '', d.isPast && d.planned && !done ? 'missed' : ''].join(' ');
    return `<div class="ws-day ${cls}"><span class="ws-l">${DAY_LETTERS[d.date.getDay()]}</span><span class="ws-n">${done ? icon.check : d.date.getDate()}</span></div>`;
  }).join('')}</div>`;
}

function nextPlannedDay() {
  for (let i = 1; i <= 7; i++) {
    const d = addDays(new Date(), i);
    if (S.profile.days.includes(d.getDay())) return d;
  }
  return null;
}

function workoutCard(templateId, { label, cta, act }) {
  const w = buildWorkout(S, templateId);
  const t = TEMPLATES[templateId];
  return `
    <div class="hero-card">
      <div class="hc-top">
        <span class="eyebrow light">${label}</span>
        <h2>${esc(t.name)}</h2>
        <div class="tags">${t.focus.map((f) => `<span>${f}</span>`).join('')}<span>~${estimateMinutes(w)} min</span></div>
      </div>
      <div class="hc-figs">${w.items.slice(0, 4).map((it) => `<div class="fig mini" data-fig="${it.id}"></div>`).join('')}</div>
      <button class="hc-list" data-act="preview" data-t="${templateId}">${w.items.length} exercises + ${EXERCISES[w.finisher.id].name.toLowerCase()} ${icon.chev}</button>
      <button class="btn white big" data-act="${act}" data-t="${templateId}">${icon.play} ${cta}</button>
    </div>`;
}

function renderToday() {
  const p = S.profile;
  const now = new Date();
  const todayKey = dayKey();
  const doneToday = S.sessions.filter((s) => s.day === todayKey);
  const isTrainDay = p.days.includes(now.getDay());
  const week = sessionsInWeek(S);
  const streak = weekStreak(S);
  const medalsEarned = Object.keys(S.medals).length;
  let hero;

  if (S.active) {
    const a = S.active;
    const total = a.items.reduce((n, it) => n + it.sets, 0);
    const done = a.items.reduce((n, it) => n + it.logged.length, 0);
    hero = `<div class="hero-card">
      <div class="hc-top"><span class="eyebrow light">In progress</span><h2>${esc(a.name)}</h2>
      <div class="tags"><span>${done}/${total} sets done</span></div></div>
      <button class="btn white big" data-act="resume">${icon.play} Resume workout</button></div>`;
  } else if (doneToday.length) {
    const s = doneToday[doneToday.length - 1];
    const nd = nextPlannedDay();
    hero = `<div class="hero-card done">
      <div class="hc-top"><span class="eyebrow light">Today</span><h2>Workout complete! 🎉</h2>
      <div class="tags"><span>${esc(s.name)}</span><span>${fmtDuration(s.durationSec)}</span>${s.volume ? `<span>${fmtNum(s.volume)} lb lifted</span>` : ''}</div></div>
      <p class="hc-note">Rest up and refuel. ${nd ? `Next: <b>${TEMPLATES[nextTemplateId(S)].name}</b> on ${DAY_NAMES[nd.getDay()]}.` : ''}</p>
      <button class="btn glass" data-act="start" data-t="${nextTemplateId(S)}">Bonus workout</button></div>`;
  } else if (isTrainDay) {
    hero = workoutCard(nextTemplateId(S), { label: 'Today’s workout', cta: 'Start workout', act: 'start' });
  } else {
    const nd = nextPlannedDay();
    hero = `<div class="hero-card rest">
      <div class="hc-top"><span class="eyebrow light">Rest day</span><h2>Recover & recharge 🌿</h2>
      <p class="hc-note">Muscles get stronger on rest days. A walk or some stretching is perfect today.</p></div>
      ${nd ? `<p class="hc-note">Next up: <b>${TEMPLATES[nextTemplateId(S)].name}</b> on ${DAY_NAMES[nd.getDay()]}</p>` : ''}
      <button class="btn glass" data-act="start" data-t="${nextTemplateId(S)}">Train anyway</button></div>`;
  }

  const lastW = [...S.weights].sort((a, b) => (a.day < b.day ? -1 : 1)).pop();
  const loggedToday = lastW && lastW.day === todayKey;

  set($view, `
    <header class="top">
      <div><p class="eyebrow">${now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
      <h1>${greeting(now)}${p.name ? `, ${esc(p.name)}` : ''}</h1></div>
      <button class="icon-btn" data-act="settings" aria-label="Settings">${icon.gear}</button>
    </header>
    ${weekStrip()}
    ${hero}
    <div class="stat-row">
      <div class="stat"><b>${week.length}<small>/${p.days.length}</small></b><span>This week</span></div>
      <div class="stat"><b>${streak ? '🔥 ' : ''}${streak}</b><span>Week streak</span></div>
      <div class="stat" data-act="tab" data-id="medals"><b>🏅 ${medalsEarned}</b><span>Medals</span></div>
    </div>
    <div class="card weigh">
      <div><h3>Weight check-in</h3><p class="muted">${loggedToday ? `Logged ${fmtWeight(lastW.lbs)} lb today ✓` : lastW ? `Last: ${fmtWeight(lastW.lbs)} lb · ${parseDay(lastW.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'Track your progress weekly'}</p></div>
      <button class="btn soft" data-act="weigh">${loggedToday ? 'Update' : 'Log weight'}</button>
    </div>
    ${tipCard()}
  `);
}

function tipCard() {
  if (S.sessions.length > 2) return '';
  return `<div class="card tip"><h3>💡 How your plan adapts</h3>
    <p>Log the reps you actually do. Hit every rep and the app adds a rep — or more weight — next time.
    Fall short and it adjusts your goal so you can build back up. First few workouts: pick a weight where the last 2 reps feel hard.</p></div>`;
}

// ── Plan ───────────────────────────────────────────────────────────
function planDays(week) {
  return `<div class="plan-list">${week.map((d) => {
    const date = `${DAY_NAMES[d.date.getDay()]} ${d.date.getDate()}`;
    let body, cls = '';
    if (d.sessions.length) {
      cls = 'done';
      body = d.sessions.map((s) => `<b>${esc(s.name)}</b><span>${icon.check} Done · ${fmtDuration(s.durationSec)}</span>`).join('');
    } else if (d.upcoming) {
      const w = buildWorkout(S, d.upcoming);
      body = `<b>${TEMPLATES[d.upcoming].name}</b><span>${w.items.length} exercises · ~${estimateMinutes(w)} min</span>`;
    } else if (d.planned && d.isPast) {
      cls = 'missed'; body = `<b>Skipped</b><span>No worries — the plan picks up where you left off</span>`;
    } else {
      cls = 'rest'; body = `<b>Rest</b><span>Recover, walk, stretch</span>`;
    }
    const act = d.upcoming ? `data-act="preview" data-t="${d.upcoming}"` : '';
    return `<button class="plan-day ${cls} ${d.isToday ? 'today' : ''}" ${act}>
      <span class="pd-date">${date}${d.isToday ? '<i>Today</i>' : ''}</span>
      <span class="pd-body">${body}</span>${d.upcoming ? icon.chev : ''}</button>`;
  }).join('')}</div>`;
}

function renderPlan() {
  const week = weekPlan(S);
  const next = weekPlan(S, addDays(new Date(), 7), week.nextOffset);
  const p = S.profile;
  set($view, `
    <header class="top"><div><p class="eyebrow">${p.days.length} days · ${p.length} min</p><h1>This week</h1></div>
      <button class="btn soft sm" data-act="settings">Edit</button></header>
    ${planDays(week)}
    <h2 class="section">Next week</h2>
    ${planDays(next)}
    <h2 class="section">Exercise library</h2>
    <div class="lib">${Object.entries(EXERCISES).map(([id, ex]) =>
      `<button class="lib-item" data-act="exercise" data-id="${id}"><div class="fig" data-fig="${id}" data-still></div><span>${ex.name}</span></button>`).join('')}</div>
  `);
}

function openPreview(templateId) {
  const w = buildWorkout(S, templateId);
  const canStart = !S.active;
  openSheet(`
    <h2>${TEMPLATES[templateId].name}</h2>
    <p class="muted">${TEMPLATES[templateId].focus.join(' · ')} · ~${estimateMinutes(w)} min</p>
    <div class="ex-list">${[...w.items, w.finisher].map((it, i) => `
      <button class="ex-row" data-act="exercise" data-id="${it.id}">
        <div class="fig thumb" data-fig="${it.id}"></div>
        <div><b>${i === w.items.length ? '🔥 Finisher: ' : ''}${EXERCISES[it.id].name}</b><span>${prescription(it)}</span></div>
        ${icon.chev}</button>`).join('')}</div>
    ${canStart ? `<button class="btn primary big" data-act="start" data-t="${templateId}">${icon.play} Start this workout</button>` : ''}
  `);
}

function openExercise(id) {
  const ex = EXERCISES[id];
  const st = S.ex[id];
  let mine = '';
  if (st && ex.kind !== 'interval') {
    const it = { id, sets: ex.sets, target: st.target, weight: st.weight };
    mine = `<div class="mine"><div><small>Your next goal</small><b>${prescription(it)}</b></div>
      ${st.best ? `<div><small>Best</small><b>${ex.kind === 'weight' ? `${fmtWeight(st.best.w)} lb × ${st.best.r}` : ex.kind === 'time' ? `${st.best.r}s` : `${st.best.r} reps`}</b></div>` : ''}</div>`;
    if (st.history.length) {
      mine += `<h3>Recent</h3><div class="hist">${st.history.slice(-5).reverse().map((h) =>
        `<div><span>${parseDay(h.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span><b>${ex.kind === 'weight' ? `${fmtWeight(h.w)} lb · ` : ''}${h.reps.join(', ')}${ex.kind === 'time' ? 's' : ''}</b></div>`).join('')}</div>`;
    }
  }
  openSheet(`
    <div class="fig big" data-fig="${id}"></div>
    <h2>${ex.name}</h2>
    <div class="chips">${ex.muscles.map((m) => `<span>${m}</span>`).join('')}<span class="eq">${ex.equip}</span></div>
    <ol class="cues">${ex.cues.map((c) => `<li>${esc(c)}</li>`).join('')}</ol>
    ${mine}
  `);
}

// ── Workout flow ───────────────────────────────────────────────────
function startWorkout(templateId) {
  if (S.active) { ui.minimized = false; return render(); }
  unlockAudio();
  const w = buildWorkout(S, templateId);
  S.active = { ...w, id: uid(), startedAt: Date.now(), idx: 0, timer: null, draft: {} };
  persist();
  closeSheet();
  ui.minimized = false;
  keepAwake(true);
  render();
}

function curItem() {
  const a = S.active;
  return a.idx < a.items.length ? a.items[a.idx] : null;
}

function draftFor(it) {
  const a = S.active;
  const key = `${a.idx}:${it.logged.length}`;
  if (!a.draft || a.draft.key !== key) {
    const prev = it.logged[it.logged.length - 1];
    a.draft = { key, w: prev ? prev.w : it.weight, r: it.target };
  }
  return a.draft;
}

function renderWorkout() {
  const a = S.active;
  $tabs.innerHTML = '';
  const total = a.items.reduce((n, it) => n + it.sets, 0) + 1;
  const done = a.items.reduce((n, it) => n + Math.min(it.sets, it.logged.length), 0) + (a.finisher.done ? 1 : 0);
  const steps = [...a.items, a.finisher].map((it, i) => {
    const cls = it.done || (it.skipped) ? 'done' : i === a.idx ? 'on' : '';
    return `<button class="step ${cls}" data-act="goto" data-i="${i}" aria-label="${EXERCISES[it.id].name}"></button>`;
  }).join('');

  const it = curItem();
  let main;
  if (it) main = renderSetView(it);
  else if (!a.finisher.done && !a.finisher.skipped) main = renderFinisherView(a.finisher);
  else main = renderFinishView();

  set($view, `
    <div class="wk">
      <header class="wk-top">
        <button class="icon-btn" data-act="minimize" aria-label="Minimize workout">${icon.close}</button>
        <div class="wk-title"><b>${esc(a.name)}</b><small data-elapsed>${fmtClock((Date.now() - a.startedAt) / 1000)}</small></div>
        <button class="icon-btn" data-act="wk-menu" aria-label="Workout options">${icon.more}</button>
      </header>
      <div class="wk-bar"><span style="width:${(done / total) * 100}%"></span></div>
      <div class="steps">${steps}</div>
      ${main}
    </div>`);
  renderTimer();
}

function renderSetView(it) {
  const ex = EXERCISES[it.id];
  const n = it.logged.length + 1;
  const d = draftFor(it);
  const holdTimer = S.active.timer?.type === 'hold';
  const next = S.active.items[S.active.idx + 1] || S.active.finisher;
  const isTime = ex.kind === 'time';

  const weightStep = ex.kind === 'weight' ? `
    <div class="stepper"><button data-act="adj" data-f="w" data-v="-1" aria-label="Less weight">−</button>
      <div><b>${fmtWeight(d.w)}</b><span>lb${ex.perHand ? ' each' : ''}</span></div>
      <button data-act="adj" data-f="w" data-v="1" aria-label="More weight">+</button></div>` : '';
  const repStep = `
    <div class="stepper"><button data-act="adj" data-f="r" data-v="-1" aria-label="Fewer">−</button>
      <div><b>${d.r}</b><span>${isTime ? 'seconds' : ex.eachSide ? 'reps / side' : 'reps'}</span></div>
      <button data-act="adj" data-f="r" data-v="1" aria-label="More">+</button></div>`;

  const action = isTime
    ? (holdTimer
      ? `<div class="hold">${ring('hold')}<button class="btn soft" data-act="hold-stop">Stop early</button></div>`
      : `<button class="btn primary big" data-act="hold-start">${icon.play} Start ${d.r}s hold</button>`)
    : `<button class="btn primary big" data-act="log">${icon.check} Log set ${n}</button>`;

  return `
    <div class="wk-fig"><div class="fig" data-fig="${it.id}"></div></div>
    <div class="wk-head">
      <h2>${ex.name}</h2>
      <button class="link-btn" data-act="exercise" data-id="${it.id}">How to</button>
    </div>
    <p class="muted wk-mus">${ex.muscles.join(' · ')}${ex.eachSide ? ' · each side' : ''}</p>
    <div class="set-line"><span class="set-n">Set ${Math.min(n, it.sets)} of ${it.sets}</span><span class="goal">Goal: ${goalText(it)}</span></div>
    <div class="steppers ${weightStep ? '' : 'one'}">${weightStep}${holdTimer ? '' : repStep}</div>
    ${action}
    <div class="logged">${Array.from({ length: it.sets }, (_, i) => {
      const s = it.logged[i];
      if (!s) return `<span class="lg ${i === it.logged.length ? 'cur' : ''}">Set ${i + 1}</span>`;
      const hit = s.r >= it.target;
      return `<span class="lg ok ${hit ? 'hit' : ''}">${ex.kind === 'weight' ? `${fmtWeight(s.w)}×` : ''}${s.r}${isTime ? 's' : ''}${hit ? ' ✓' : ''}</span>`;
    }).join('')}</div>
    <p class="up-next">Up next: <b>${EXERCISES[next.id].name}</b></p>`;
}

function renderFinisherView(f) {
  const ex = EXERCISES[f.id];
  const running = S.active.timer?.type === 'interval';
  return `
    <div class="wk-fig"><div class="fig" data-fig="${f.id}"></div></div>
    <div class="wk-head"><h2>🔥 ${ex.name}</h2><button class="link-btn" data-act="exercise" data-id="${f.id}">How to</button></div>
    <p class="muted wk-mus">Cardio finisher · ${ex.equip}</p>
    <div class="set-line"><span class="set-n">${f.rounds} rounds</span><span class="goal">${f.work}s hard / ${f.rest}s easy</span></div>
    ${running ? `<div class="hold">${ring('interval')}<button class="btn soft" data-act="int-stop">End early</button></div>`
      : `<button class="btn primary big" data-act="int-start">${icon.play} Start intervals</button>
         <button class="btn link" data-act="skip-fin">Skip finisher</button>`}
  `;
}

function renderFinishView() {
  return `
    <div class="finish-view">
      <div class="trophy">🏆</div>
      <h2>Last one done!</h2>
      <p class="muted">Great work. Tap below to save your workout and see how you did.</p>
      <button class="btn primary big" data-act="finish">Finish workout 🎉</button>
    </div>`;
}

function ring(kind) {
  return `<div class="ring ${kind}" data-ring-wrap>
    <svg viewBox="0 0 200 200"><circle class="ring-bg" cx="100" cy="100" r="88"/><circle class="ring-fg" data-ring cx="100" cy="100" r="88" pathLength="1000"/></svg>
    <div class="ring-txt"><small data-phase></small><b data-time>0:00</b><span data-sub></span></div></div>`;
}

// Log a set (reps/weights from the draft)
function logSet(repsOverride) {
  const a = S.active;
  const it = curItem();
  if (!it) return;
  const d = draftFor(it);
  it.logged.push({ w: EXERCISES[it.id].kind === 'weight' ? d.w : 0, r: repsOverride ?? d.r });
  a.draft = null;
  sound('set');
  buzz(30);
  let label;
  let feelFor = null;
  if (it.logged.length >= it.sets) {
    it.done = true;
    feelFor = a.idx;
    a.idx++;
    const nx = curItem() || (!a.finisher.done ? a.finisher : null);
    label = nx ? `Next: ${EXERCISES[nx.id].name}` : 'Almost done!';
  } else {
    label = `Next: set ${it.logged.length + 1} of ${it.sets}`;
  }
  const allDone = !curItem() && (a.finisher.done || a.finisher.skipped);
  if (!allDone) startRest(it.rest, label, feelFor);
  persist();
  render();
}

function startRest(sec, label, feelFor) {
  S.active.timer = { type: 'rest', endsAt: Date.now() + sec * 1000, total: sec, label, feelFor };
}

// ── Timers (rest / hold / intervals) ───────────────────────────────
function renderTimer() {
  const t = S?.active?.timer;
  if (!t || t.type !== 'rest' || ui.minimized) {
    $overlay.classList.remove('show');
    $overlay.innerHTML = '';
    return;
  }
  const fi = t.feelFor;
  const it = fi != null ? S.active.items[fi] : null;
  const feel = it ? `
    <div class="feel"><p>How did ${EXERCISES[it.id].name} feel?</p>
      <div>${[['easy', '😌 Easy'], ['good', '💪 Just right'], ['hard', '🥵 Tough']].map(([k, l]) =>
        `<button class="${it.feel === k ? 'on' : ''}" data-act="feel" data-k="${k}">${l}</button>`).join('')}</div></div>` : '';
  const nextIt = curItem();
  $overlay.innerHTML = `
    <div class="rest-card">
      ${ring('rest')}
      <div class="rest-btns">
        <button class="btn glass" data-act="rest-add" data-v="-15">−15s</button>
        <button class="btn white" data-act="rest-skip">Skip rest</button>
        <button class="btn glass" data-act="rest-add" data-v="15">+15s</button>
      </div>
      ${feel}
      ${nextIt && fi != null ? `<div class="rest-next"><div class="fig thumb" data-fig="${nextIt.id}"></div><div><small>Up next</small><b>${EXERCISES[nextIt.id].name}</b><span>${prescription(nextIt)}</span></div></div>` : `<p class="rest-label">${esc(t.label)}</p>`}
    </div>`;
  hydrate($overlay);
  $overlay.classList.add('show');
  tick();
}

let lastBeep = 0;
function tick() {
  if (!S?.active) return;
  const a = S.active;
  const el = document.querySelector('[data-elapsed]');
  if (el) el.textContent = fmtClock((Date.now() - a.startedAt) / 1000);
  const t = a.timer;
  if (!t) return;
  const now = Date.now();

  if (t.type === 'interval') return tickInterval(t, now);

  const left = (t.endsAt - now) / 1000;
  paintRing(left, t.total, t.type === 'hold' ? 'Hold' : 'Rest', t.type === 'hold' ? 'Keep breathing' : '');
  const whole = Math.ceil(left);
  if (whole <= 3 && whole > 0 && whole !== lastBeep) { lastBeep = whole; sound('tick'); }
  if (left <= 0) {
    lastBeep = 0;
    a.timer = null;
    if (t.type === 'rest') { sound('rest-end'); buzz([80, 60, 80]); persist(); render(); }
    else if (t.type === 'hold') { sound('go'); buzz(120); logSet(t.total); }
  }
}

function tickInterval(t, now) {
  const f = S.active.finisher;
  // Advance through any phases that elapsed (e.g. while the phone was locked)
  let changed = false;
  while (now >= t.endsAt) {
    changed = true;
    if (t.phase === 'ready') { t.phase = 'work'; t.total = f.work; }
    else if (t.phase === 'work') {
      f.completed = t.round;
      if (t.round >= f.rounds) { f.done = true; S.active.timer = null; sound('finish'); buzz([100, 50, 100, 50, 200]); persist(); return render(); }
      t.phase = 'rest'; t.total = f.rest;
    } else { t.phase = 'work'; t.round++; t.total = f.work; }
    t.endsAt += t.total * 1000;
  }
  if (changed) {
    sound(t.phase === 'work' ? 'go' : 'rest-end');
    buzz(t.phase === 'work' ? 150 : [60, 40, 60]);
    persist();
  }
  const left = (t.endsAt - now) / 1000;
  const wrap = document.querySelector('[data-ring-wrap]');
  if (wrap) wrap.dataset.phase = t.phase;
  const label = t.phase === 'ready' ? 'Get ready' : t.phase === 'work' ? 'Go hard!' : 'Easy pace';
  paintRing(left, t.total, label, t.phase === 'ready' ? '' : `Round ${t.round} of ${f.rounds}`);
  const whole = Math.ceil(left);
  if (whole <= 3 && whole > 0 && whole !== lastBeep) { lastBeep = whole; sound('tick'); }
}

function paintRing(left, total, phase, sub) {
  const wrap = document.querySelector('#overlay.show [data-ring-wrap]') || document.querySelector('#view [data-ring-wrap]');
  if (!wrap) return;
  wrap.querySelector('[data-ring]').style.strokeDashoffset = String(1000 * (1 - Math.max(0, left) / total));
  wrap.querySelector('[data-time]').textContent = fmtClock(left);
  wrap.querySelector('[data-phase]').textContent = phase;
  wrap.querySelector('[data-sub]').textContent = sub;
}

setInterval(tick, 200);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && S?.active) { keepAwake(true); tick(); }
});

// ── Finishing a workout ────────────────────────────────────────────
function finishWorkout() {
  const a = S.active;
  const worked = a.items.filter((it) => it.logged.length);
  if (!worked.length && !a.finisher.completed) {
    S.active = null; persist(); keepAwake(false); return render();
  }
  const results = worked.map((it) => ({ id: it.id, sets: it.logged, target: it.target, weight: it.weight, ...progress(S, it) }));
  const fin = progressFinisher(S, a.finisher);
  const volume = worked.reduce((s, it) => s + volumeOf(it), 0);
  const perfect = a.items.every((it) => it.logged.length >= it.sets && it.logged.every((s) => s.r >= it.target));
  if (perfect) S.stats.perfect++;
  const session = {
    id: a.id,
    date: new Date(a.startedAt).toISOString(),
    day: dayKey(new Date(a.startedAt)),
    templateId: a.templateId,
    name: a.name,
    durationSec: Math.round((Date.now() - a.startedAt) / 1000),
    items: results.map((r) => ({ id: r.id, sets: r.sets, target: r.target, change: r.change })),
    finisher: { id: a.finisher.id, completed: a.finisher.completed, rounds: a.finisher.rounds },
    volume,
    prs: results.filter((r) => r.pr).length,
  };
  S.sessions.push(session);
  S.rotation++;
  S.active = null;
  const medals = checkMedals(S);
  persist();
  keepAwake(false);
  ui.summary = { session, results, fin, medals, perfect };
  ui.minimized = false;
  render();
  sound('finish');
  confetti();
  if (medals.length) setTimeout(() => celebrate(medals), 1400);
}

function renderSummary() {
  const { session: s, results, fin, medals, perfect } = ui.summary;
  $tabs.innerHTML = '';
  const sets = results.reduce((n, r) => n + r.sets.length, 0);
  const changeIcon = { up: '⬆️', reps: '➕', hold: '🎯', adjust: '🔧', down: '⬇️' };
  set($view, `
    <div class="summary">
      <div class="sum-hero"><div class="trophy pop">🏆</div><h1>Workout complete!</h1>
        <p>${esc(s.name)}${perfect ? ' · <b>Flawless ✨</b>' : ''}</p></div>
      <div class="sum-stats">
        <div><b>${fmtDuration(s.durationSec)}</b><span>Time</span></div>
        <div><b>${sets}</b><span>Sets</span></div>
        <div><b>${fmtNum(s.volume)}</b><span>lb lifted</span></div>
        <div><b>${s.prs}</b><span>PRs</span></div>
      </div>
      ${medals.length ? `<h2 class="section">Medals earned</h2><div class="sum-medals">${medals.map((m) => medalBadge(m, true)).join('')}</div>` : ''}
      <h2 class="section">Next time</h2>
      <div class="changes">${results.map((r) => `
        <div class="chg ${r.change}"><span class="ci">${changeIcon[r.change] || '•'}</span>
          <div><b>${EXERCISES[r.id].name}${r.pr ? ' <em class="pr">PR!</em>' : ''}</b><span>${esc(r.msg)}</span></div></div>`).join('')}
        ${fin ? `<div class="chg ${fin.change}"><span class="ci">❤️</span><div><b>${EXERCISES[s.finisher.id].name}</b><span>${esc(fin.msg)}</span></div></div>` : ''}
      </div>
      <button class="btn primary big" data-act="summary-done">Done</button>
    </div>`);
}

// ── Medals ─────────────────────────────────────────────────────────
function medalBadge(m, earned, size = '') {
  return `<div class="medal ${m.tier} ${earned ? '' : 'locked'} ${size}"><div class="m-ribbon"></div><div class="m-disc"><span>${m.icon}</span></div></div>`;
}

function renderMedals() {
  const list = medalList(S);
  const earned = list.filter((m) => S.medals[m.id]).length;
  set($view, `
    <header class="top"><div><p class="eyebrow">Trophy case</p><h1>Medals</h1></div></header>
    <div class="card medal-sum"><b>${earned}<small> / ${list.length}</small></b><span>medals earned</span>
      <div class="bar"><span style="width:${(earned / list.length) * 100}%"></span></div></div>
    <div class="medal-grid">${list.map((m) => {
      const got = !!S.medals[m.id];
      const pct = Math.min(100, (m.value / m.goal) * 100);
      return `<button class="medal-cell ${got ? 'got' : ''}" data-act="medal" data-id="${m.id}">
        ${medalBadge(m, got)}<b>${m.name}</b>
        ${got ? `<span>${new Date(S.medals[m.id]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>` : `<span class="mini-bar"><i style="width:${pct}%"></i></span>`}
      </button>`;
    }).join('')}</div>`);
}

function openMedal(id) {
  const m = medalList(S).find((x) => x.id === id);
  const got = S.medals[id];
  const fmtV = (v) => (m.id.startsWith('v') ? fmtNum(v) + ' lb' : m.id.startsWith('lost') ? fmtWeight(Math.round(v * 10) / 10) + ' lb' : fmtNum(v));
  openSheet(`<div class="medal-detail">${medalBadge(m, !!got, 'xl')}
    <h2>${m.name}</h2><p>${m.desc}</p>
    ${got ? `<p class="earned">Earned ${new Date(got).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>`
      : `<div class="bar"><span style="width:${Math.min(100, (m.value / m.goal) * 100)}%"></span></div><p class="muted">${fmtV(Math.min(m.value, m.goal))} / ${fmtV(m.goal)}</p>`}
    <span class="tier-tag ${m.tier}">${m.tier}</span></div>`);
}

function celebrate(list) {
  ui.medalQueue.push(...list);
  if (document.querySelector('.celebrate')) return;
  showNextMedal();
}

function showNextMedal() {
  const m = ui.medalQueue.shift();
  document.querySelector('.celebrate')?.remove();
  if (!m) return;
  const el = document.createElement('div');
  el.className = 'celebrate';
  el.innerHTML = `<div class="cel-rays"></div><div class="cel-body">
    <p class="eyebrow light">New medal unlocked!</p>
    ${medalBadge(m, true, 'xl spin-in')}
    <h2>${m.name}</h2><p>${m.desc}</p>
    <button class="btn white big" data-act="medal-next">Awesome!</button></div>`;
  document.body.appendChild(el);
  sound('medal');
  buzz([60, 40, 120]);
  confetti({ count: 90 });
}

// ── Progress ───────────────────────────────────────────────────────
function renderProgress() {
  const ws = [...S.weights].sort((a, b) => (a.day < b.day ? -1 : 1));
  const p = S.profile;
  const start = p.startWeight || ws[0]?.lbs;
  const cur = ws[ws.length - 1]?.lbs;
  const delta = start && cur ? cur - start : null;
  let goalBar = '';
  if (p.goalWeight && start && cur && start > p.goalWeight) {
    const pct = Math.max(0, Math.min(100, ((start - cur) / (start - p.goalWeight)) * 100));
    goalBar = `<div class="goal-row"><span>Goal ${fmtWeight(p.goalWeight)} lb</span><span>${Math.round(pct)}%</span></div><div class="bar"><span style="width:${pct}%"></span></div>`;
  }

  const totalVol = S.sessions.reduce((a, s) => a + (s.volume || 0), 0);
  const totalTime = S.sessions.reduce((a, s) => a + (s.durationSec || 0), 0);

  const strength = Object.entries(S.ex)
    .filter(([id, st]) => EXERCISES[id].kind !== 'interval' && st.history.length)
    .sort((a, b) => b[1].history.length - a[1].history.length);

  set($view, `
    <header class="top"><div><p class="eyebrow">Keep it up</p><h1>Progress</h1></div>
      <button class="btn soft sm" data-act="weigh">Log weight</button></header>
    <div class="card">
      <div class="w-head">
        <div><small class="muted">Current weight</small><b class="big-num">${cur ? fmtWeight(cur) : '—'}<small> lb</small></b></div>
        ${delta != null ? `<div class="delta ${delta <= 0 ? 'good' : ''}">${delta <= 0 ? '▼' : '▲'} ${fmtWeight(Math.abs(Math.round(delta * 10) / 10))} lb<small>since start</small></div>` : ''}
      </div>
      ${ws.length >= 2 ? weightChart(ws, p.goalWeight) : `<p class="muted empty">Log your weight a couple of times to see your trend. Weekly, same time of day, works best.</p>`}
      ${goalBar}
    </div>
    <div class="stat-row">
      <div class="stat"><b>${S.sessions.length}</b><span>Workouts</span></div>
      <div class="stat"><b>${fmtNum(totalVol)}</b><span>lb lifted</span></div>
      <div class="stat"><b>${Math.round(totalTime / 3600 * 10) / 10}</b><span>Hours</span></div>
    </div>
    <div class="card"><h3>Workouts per week</h3>${weeksChart()}</div>
    <h2 class="section">Strength</h2>
    ${strength.length ? `<div class="str-list">${strength.map(([id, st]) => {
      const ex = EXERCISES[id];
      const first = st.history[0], last = st.history[st.history.length - 1];
      const gain = ex.kind === 'weight' ? last.w - first.w : Math.max(...last.reps) - Math.max(...first.reps);
      return `<button class="str-row" data-act="exercise" data-id="${id}">
        <div class="fig thumb" data-fig="${id}" data-still></div>
        <div><b>${ex.name}</b><span>${prescription({ id, sets: ex.sets, target: st.target, weight: st.weight })}</span></div>
        ${spark(st.history.map((h) => (ex.kind === 'weight' ? h.w : Math.max(...h.reps))))}
        ${gain > 0 ? `<em class="gain">+${fmtWeight(gain)}${ex.kind === 'weight' ? ' lb' : ex.kind === 'time' ? 's' : ''}</em>` : ''}
      </button>`;
    }).join('')}</div>` : `<p class="muted empty">Finish a workout to start tracking your strength.</p>`}
  `);
  wireChartTips();
}

function weightChart(ws, goal) {
  const pts = ws.slice(-30);
  const W = 320, H = 150, pl = 34, pr = 10, pt = 12, pb = 22;
  const t0 = parseDay(pts[0].day).getTime(), t1 = parseDay(pts[pts.length - 1].day).getTime();
  const vals = pts.map((p) => p.lbs).concat(goal && goal > Math.min(...pts.map((p) => p.lbs)) - 15 ? [goal] : []);
  let lo = Math.floor(Math.min(...vals) - 2), hi = Math.ceil(Math.max(...vals) + 2);
  const x = (d) => pl + ((parseDay(d).getTime() - t0) / Math.max(1, t1 - t0)) * (W - pl - pr);
  const y = (v) => pt + (1 - (v - lo) / (hi - lo)) * (H - pt - pb);
  const ticks = [lo, Math.round((lo + hi) / 2), hi];
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.day).toFixed(1)} ${y(p.lbs).toFixed(1)}`).join(' ');
  const area = `${line} L${x(pts[pts.length - 1].day).toFixed(1)} ${H - pb} L${x(pts[0].day).toFixed(1)} ${H - pb} Z`;
  const fmtD = (d) => parseDay(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `<div class="chart-wrap"><svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Weight over time">
    ${ticks.map((t) => `<line class="grid" x1="${pl}" x2="${W - pr}" y1="${y(t)}" y2="${y(t)}"/><text class="axis" x="${pl - 6}" y="${y(t) + 3}" text-anchor="end">${t}</text>`).join('')}
    ${goal && goal >= lo ? `<line class="goal-line" x1="${pl}" x2="${W - pr}" y1="${y(goal)}" y2="${y(goal)}"/><text class="axis goal-t" x="${W - pr}" y="${y(goal) - 4}" text-anchor="end">Goal</text>` : ''}
    <path class="area" d="${area}"/><path class="line" d="${line}"/>
    ${pts.map((p) => `<circle class="dot" cx="${x(p.day)}" cy="${y(p.lbs)}" r="4" data-tip="${fmtD(p.day)} · ${fmtWeight(p.lbs)} lb"/><circle class="hit" cx="${x(p.day)}" cy="${y(p.lbs)}" r="14" data-tip="${fmtD(p.day)} · ${fmtWeight(p.lbs)} lb"/>`).join('')}
    <text class="axis" x="${pl}" y="${H - 6}">${fmtD(pts[0].day)}</text><text class="axis" x="${W - pr}" y="${H - 6}" text-anchor="end">${fmtD(pts[pts.length - 1].day)}</text>
  </svg><div class="chart-tip" hidden></div></div>`;
}

function weeksChart() {
  const goal = S.profile.days.length;
  const weeks = [];
  const thisWeek = weekStart(new Date());
  for (let i = 7; i >= 0; i--) {
    const ws = addDays(thisWeek, -7 * i);
    const s = dayKey(ws), e = dayKey(addDays(ws, 7));
    weeks.push({ ws, n: S.sessions.filter((x) => x.day >= s && x.day < e).length });
  }
  const W = 320, H = 120, pb = 20, pt = 10;
  const max = Math.max(goal, ...weeks.map((w) => w.n), 1);
  const bw = (W - 20) / weeks.length;
  const y = (v) => pt + (1 - v / max) * (H - pt - pb);
  return `<div class="chart-wrap"><svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Workouts per week, last 8 weeks">
    <line class="goal-line" x1="10" x2="${W - 10}" y1="${y(goal)}" y2="${y(goal)}"/><text class="axis goal-t" x="${W - 10}" y="${y(goal) - 4}" text-anchor="end">Goal ${goal}</text>
    ${weeks.map((w, i) => {
      const h = Math.max(0, H - pb - y(w.n));
      const bx = 10 + i * bw + bw * 0.22, bwid = bw * 0.56;
      const label = w.ws.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${w.n ? `<path class="bar-m ${w.n >= goal ? 'met' : ''}" d="M${bx} ${H - pb} V${H - pb - h + 4} Q${bx} ${H - pb - h} ${bx + 4} ${H - pb - h} H${bx + bwid - 4} Q${bx + bwid} ${H - pb - h} ${bx + bwid} ${H - pb - h + 4} V${H - pb} Z"/>` : ''}
        <rect class="hit" x="${10 + i * bw}" y="0" width="${bw}" height="${H - pb}" data-tip="Week of ${label} · ${w.n} workout${w.n === 1 ? '' : 's'}"/>
        <text class="axis" x="${10 + i * bw + bw / 2}" y="${H - 5}" text-anchor="middle">${i === 7 ? 'Now' : w.ws.getDate()}</text>`;
    }).join('')}
    <line class="base" x1="10" x2="${W - 10}" y1="${H - pb}" y2="${H - pb}"/>
  </svg><div class="chart-tip" hidden></div></div>`;
}

function spark(vals) {
  if (vals.length < 2) return '<span class="spark"></span>';
  const W = 64, H = 24;
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * (W - 4) + 2},${hi === lo ? H / 2 : H - 3 - ((v - lo) / (hi - lo)) * (H - 6)}`);
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" aria-hidden="true"><polyline points="${pts.join(' ')}"/></svg>`;
}

function wireChartTips() {
  $view.querySelectorAll('.chart-wrap').forEach((wrap) => {
    const tip = wrap.querySelector(".chart-tip");
    const show = (e) => {
      const t = e.target.closest('[data-tip]');
      wrap.querySelectorAll('.active').forEach((x) => x.classList.remove('active'));
      if (!t) { tip.hidden = true; return; }
      const r = wrap.getBoundingClientRect(), b = t.getBoundingClientRect();
      tip.textContent = t.dataset.tip;
      tip.hidden = false;
      const prevSib = t.previousElementSibling;
      if (prevSib?.classList.contains('dot') || prevSib?.classList.contains('bar-m')) prevSib.classList.add('active');
      const left = Math.max(0, Math.min(r.width - tip.offsetWidth, b.left - r.left + b.width / 2 - tip.offsetWidth / 2));
      tip.style.left = `${left}px`;
      tip.style.top = `${Math.max(0, b.top - r.top - 34)}px`;
    };
    wrap.addEventListener('pointermove', show);
    wrap.addEventListener('pointerdown', show);
    wrap.addEventListener('pointerleave', () => { tip.hidden = true; wrap.querySelectorAll('.active').forEach((x) => x.classList.remove('active')); });
  });
}

function openWeigh() {
  const last = [...S.weights].sort((a, b) => (a.day < b.day ? -1 : 1)).pop();
  openSheet(`
    <h2>Log your weight</h2>
    <p class="muted">Tip: weigh in first thing in the morning, once a week, for the clearest trend.</p>
    <label class="field"><span>Weight</span><div class="suffix"><input id="w-in" class="input big" type="number" inputmode="decimal" step="0.1" value="${last ? last.lbs : ''}"><em>lb</em></div></label>
    <label class="field"><span>Date</span><input id="w-date" class="input" type="date" value="${dayKey()}" max="${dayKey()}"></label>
    <button class="btn primary big" data-act="weigh-save">Save</button>
    ${S.weights.length ? `<details class="w-hist"><summary>History (${S.weights.length})</summary>${[...S.weights].sort((a, b) => (a.day < b.day ? 1 : -1)).map((w) =>
      `<div><span>${parseDay(w.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span><b>${fmtWeight(w.lbs)} lb</b><button class="link-btn" data-act="weigh-del" data-day="${w.day}">Delete</button></div>`).join('')}</details>` : ''}
  `);
  setTimeout(() => document.getElementById('w-in')?.focus(), 300);
}

// ── Settings ───────────────────────────────────────────────────────
function openSettings() {
  const p = S.profile;
  ui.edit = { days: [...p.days], length: p.length };
  openSheet(settingsHTML());
}

function settingsHTML() {
  const p = S.profile, e = ui.edit;
  return `
    <h2>Settings</h2>
    <label class="field"><span>Name</span><input id="s-name" class="input" value="${esc(p.name)}" maxlength="24"></label>
    <div class="field"><span>Training days</span><div class="day-pick sm">${[1, 2, 3, 4, 5, 6, 0].map((d) =>
      `<button class="day-tog ${e.days.includes(d) ? 'on' : ''}" data-act="s-day" data-d="${d}">${DAY_NAMES[d]}</button>`).join('')}</div></div>
    <div class="field"><span>Workout length</span><div class="len-pick sm">${[30, 45, 60].map((m) =>
      `<button class="len-opt ${e.length === m ? 'on' : ''}" data-act="s-len" data-m="${m}"><b>${m}</b><span>min</span></button>`).join('')}</div></div>
    <label class="field"><span>Starting weight</span><div class="suffix"><input id="s-start" class="input" type="number" inputmode="decimal" value="${p.startWeight || ''}"><em>lb</em></div></label>
    <label class="field"><span>Goal weight</span><div class="suffix"><input id="s-goal" class="input" type="number" inputmode="decimal" value="${p.goalWeight || ''}"><em>lb</em></div></label>
    <label class="toggle"><input id="s-sound" type="checkbox" ${S.settings.sound ? 'checked' : ''}><span>Sounds</span></label>
    <button class="btn primary big" data-act="s-save" ${e.days.length ? '' : 'disabled'}>Save changes</button>
    <h3 class="section">Your data</h3>
    <p class="muted small">Everything is saved privately on this phone. Export a backup now and then — if you clear Safari’s website data, it’s gone.</p>
    <div class="btn-row"><button class="btn soft" data-act="export">Export backup</button><button class="btn soft" data-act="import">Import backup</button></div>
    <h3 class="section">Apple Health</h3>
    <p class="muted small">Web apps can’t read Apple Health directly. Log your weight here weekly — it powers your trend chart and weight-loss medals. Steps and rings stay in the Fitness app.</p>
    <button class="btn danger" data-act="reset">Reset everything</button>`;
}

// ── Sheets ─────────────────────────────────────────────────────────
function openSheet(html) {
  ui.sheet = true;
  $sheet.innerHTML = `<div class="sheet-bg" data-act="close-sheet"></div><div class="sheet-panel" role="dialog" aria-modal="true">
    <div class="grab"></div><button class="icon-btn sheet-x" data-act="close-sheet" aria-label="Close">${icon.close}</button>
    <div class="sheet-body">${html}</div></div>`;
  hydrate($sheet);
  requestAnimationFrame(() => $sheet.classList.add('show'));
}

function closeSheet() {
  ui.sheet = null;
  $sheet.classList.remove('show');
  setTimeout(() => { if (!ui.sheet) $sheet.innerHTML = ''; }, 280);
}

function refreshSheet(html) {
  const body = $sheet.querySelector('.sheet-body');
  if (body) { body.innerHTML = html; hydrate(body); }
}

function confirmSheet(title, text, yesLabel, act, danger = false) {
  openSheet(`<h2>${title}</h2><p class="muted">${text}</p>
    <button class="btn ${danger ? 'danger' : 'primary'} big" data-act="${act}">${yesLabel}</button>
    <button class="btn link" data-act="close-sheet">Cancel</button>`);
}

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2200);
}

function download(name, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

function pickFile() {
  return new Promise((resolve) => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'application/json,.json';
    inp.onchange = () => inp.files[0] ? inp.files[0].text().then(resolve) : resolve(null);
    inp.click();
  });
}

async function doImport() {
  const text = await pickFile();
  if (!text) return;
  try {
    S = importJSON(text);
    setSound(S.settings.sound);
    persist();
    closeSheet();
    ui.ob = null;
    toast('Backup restored ✓');
    render();
  } catch (e) {
    toast(e.message || 'Could not import that file');
  }
}

// ── Actions ────────────────────────────────────────────────────────
const actions = {
  tab: ({ id }) => { ui.tab = id; render(); },

  'ob-next': () => {
    readOnboardingInputs();
    if (ui.ob.step === 1 && !ui.ob.name) { document.getElementById('ob-name')?.focus(); return; }
    ui.ob.step++; render();
  },
  'ob-back': () => { readOnboardingInputs(); ui.ob.step--; render(); },
  'ob-day': ({ d }) => {
    const o = ui.ob; d = +d;
    o.days = o.days.includes(d) ? o.days.filter((x) => x !== d) : [...o.days, d];
    render();
  },
  'ob-len': ({ m }) => { ui.ob.length = +m; render(); },
  'ob-import': doImport,
  'ob-finish': () => {
    readOnboardingInputs();
    const o = ui.ob;
    const sw = parseFloat(o.startWeight), gw = parseFloat(o.goalWeight);
    S = fresh({ name: o.name, days: o.days.sort(), length: o.length, startWeight: sw > 0 ? sw : null, goalWeight: gw > 0 ? gw : null });
    if (sw > 0) S.weights.push({ day: dayKey(), lbs: sw });
    persist();
    ui.ob = null;
    unlockAudio();
    render();
    confetti({ count: 80 });
  },

  settings: openSettings,
  preview: ({ t }) => openPreview(t),
  exercise: ({ id }) => openExercise(id),
  medal: ({ id }) => openMedal(id),
  'medal-next': showNextMedal,
  'close-sheet': closeSheet,

  start: ({ t }) => startWorkout(t),
  resume: () => { ui.minimized = false; keepAwake(true); render(); },
  minimize: () => { ui.minimized = true; ui.tab = 'today'; render(); },
  'wk-menu': () => {
    const it = curItem();
    openSheet(`<h2>Workout options</h2>
      <div class="menu">
        ${it ? `<button class="btn soft" data-act="skip-ex">Skip ${EXERCISES[it.id].name}</button>` : ''}
        <button class="btn soft" data-act="finish">Finish workout now</button>
        <button class="btn danger" data-act="discard-ask">Discard workout</button>
      </div>`);
  },
  goto: ({ i }) => {
    const a = S.active; i = +i;
    if (a.timer && a.timer.type !== 'rest') return;
    if (i < a.items.length && (a.items[i].done || a.items[i].skipped)) { openExercise(a.items[i].id); return; }
    a.idx = i; a.timer = null; a.draft = null; persist(); render();
  },
  'skip-ex': () => {
    const a = S.active, it = curItem();
    if (it) { it.skipped = true; a.idx++; a.draft = null; }
    while (curItem() && (curItem().done || curItem().skipped)) a.idx++;
    persist(); closeSheet(); render();
  },
  'skip-fin': () => { S.active.finisher.skipped = true; persist(); render(); },
  'discard-ask': () => confirmSheet('Discard this workout?', 'Nothing from this session will be saved.', 'Discard', 'discard', true),
  discard: () => { S.active = null; persist(); keepAwake(false); closeSheet(); render(); },
  finish: () => { closeSheet(); finishWorkout(); },

  adj: ({ f, v }) => {
    const it = curItem(); if (!it) return;
    const ex = EXERCISES[it.id];
    const d = draftFor(it);
    if (f === 'w') d.w = Math.max(0, Math.round((d.w + (+v) * ex.inc) * 10) / 10);
    else d.r = Math.max(ex.kind === 'time' ? 5 : 0, d.r + (+v) * (ex.kind === 'time' ? 5 : 1));
    persist();
    // Update just the numbers to keep the animation smooth.
    const steppers = $view.querySelectorAll('.stepper b');
    if (ex.kind === 'weight') { steppers[0].textContent = fmtWeight(d.w); steppers[1].textContent = d.r; }
    else steppers[0].textContent = d.r;
    const btn = $view.querySelector('[data-act="hold-start"]');
    if (btn) btn.innerHTML = `${icon.play} Start ${d.r}s hold`;
  },
  log: () => { unlockAudio(); logSet(); },
  'hold-start': () => {
    unlockAudio();
    const it = curItem(); const d = draftFor(it);
    S.active.timer = { type: 'hold', endsAt: Date.now() + d.r * 1000, total: d.r };
    sound('go'); persist(); render();
  },
  'hold-stop': () => {
    const t = S.active.timer;
    const held = Math.max(0, Math.round(t.total - (t.endsAt - Date.now()) / 1000));
    S.active.timer = null;
    logSet(held);
  },
  'int-start': () => {
    unlockAudio();
    S.active.timer = { type: 'interval', phase: 'ready', round: 1, endsAt: Date.now() + 5000, total: 5 };
    persist(); render();
  },
  'int-stop': () => { S.active.timer = null; S.active.finisher.done = true; persist(); render(); },
  'rest-add': ({ v }) => {
    const t = S.active.timer; if (!t) return;
    t.endsAt += +v * 1000; t.total = Math.max(1, t.total + +v); persist(); tick();
  },
  'rest-skip': () => { S.active.timer = null; persist(); render(); },
  feel: ({ k }) => {
    const t = S.active.timer; if (!t || t.feelFor == null) return;
    S.active.items[t.feelFor].feel = k; persist();
    $overlay.querySelectorAll('.feel button').forEach((b) => b.classList.toggle('on', b.dataset.k === k));
  },
  'summary-done': () => { ui.summary = null; ui.tab = 'today'; render(); },

  weigh: openWeigh,
  'weigh-save': () => {
    const v = parseFloat(document.getElementById('w-in').value);
    const day = document.getElementById('w-date').value || dayKey();
    if (!(v > 50 && v < 700)) { toast('Enter your weight in lb'); return; }
    S.weights = S.weights.filter((w) => w.day !== day);
    S.weights.push({ day, lbs: Math.round(v * 10) / 10 });
    if (!S.profile.startWeight) S.profile.startWeight = v;
    const medals = checkMedals(S);
    persist(); closeSheet(); render(); toast('Weight logged ✓');
    if (medals.length) setTimeout(() => celebrate(medals), 400);
  },
  'weigh-del': ({ day }) => { S.weights = S.weights.filter((w) => w.day !== day); persist(); closeSheet(); render(); },

  's-day': ({ d }) => {
    const e = ui.edit; d = +d;
    e.days = e.days.includes(d) ? e.days.filter((x) => x !== d) : [...e.days, d];
    refreshSheet(settingsHTML());
  },
  's-len': ({ m }) => { ui.edit.length = +m; refreshSheet(settingsHTML()); },
  's-save': () => {
    const p = S.profile;
    p.name = document.getElementById('s-name').value.trim() || p.name;
    if (ui.edit.days.length !== p.days.length) S.rotation = 0; // new split → start it fresh
    p.days = ui.edit.days.sort();
    p.length = ui.edit.length;
    const sw = parseFloat(document.getElementById('s-start').value);
    const gw = parseFloat(document.getElementById('s-goal').value);
    p.startWeight = sw > 0 ? sw : null;
    p.goalWeight = gw > 0 ? gw : null;
    S.settings.sound = document.getElementById('s-sound').checked;
    setSound(S.settings.sound);
    persist(); closeSheet(); render(); toast('Saved ✓');
  },
  export: () => download(`momentum-backup-${dayKey()}.json`, exportJSON(S)),
  import: doImport,
  reset: () => confirmSheet('Reset everything?', 'This deletes all workouts, progress, weights and medals on this phone. Export a backup first if you might want it.', 'Delete everything', 'reset-yes', true),
  'reset-yes': () => { clear(); S = null; ui.ob = null; ui.tab = 'today'; closeSheet(); render(); },
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = actions[el.dataset.act];
  if (fn) { e.preventDefault(); fn({ ...el.dataset }, el); }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && ui.sheet) closeSheet();
  if (e.key === 'Enter' && e.target.id === 'ob-name') actions['ob-next']();
});

// Resume a workout that was in progress when the app was closed.
if (S?.active) keepAwake(true);
render();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

// Exposed for testing in the browser console.
window.__momentum = { get state() { return S; }, render };

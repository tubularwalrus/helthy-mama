// Plan generation and adaptive progression.
import { EXERCISES, TEMPLATES, ROTATIONS, LENGTHS } from './exercises.js';
import { dayKey, weekStart, addDays } from './util.js';

// ── Per-exercise state ─────────────────────────────────────────────
export function exState(state, id) {
  const ex = EXERCISES[id];
  if (!state.ex[id]) {
    state.ex[id] = {
      weight: ex.kind === 'weight' ? ex.start : 0,
      target: ex.kind === 'weight' ? ex.min : ex.start ?? ex.min,
      work: ex.work ?? 0,
      strikes: 0,
      best: null,
      history: [],
    };
  }
  return state.ex[id];
}

export function rotationFor(state) {
  const n = Math.min(7, Math.max(1, state.profile.days.length));
  return ROTATIONS[n];
}

export function nextTemplateId(state, offset = 0) {
  const rot = rotationFor(state);
  return rot[(state.rotation + offset) % rot.length];
}

/** Sets per exercise: her chosen default (2 or 3), never more than the exercise's own count. */
export function defaultSets(state, ex) {
  return Math.min(ex.sets, state.settings?.sets ?? ex.sets);
}

// ── Build a concrete workout from a template ──────────────────────
export function buildWorkout(state, templateId) {
  const t = TEMPLATES[templateId];
  const len = LENGTHS[state.profile.length] || LENGTHS[45];
  const items = t.ex.slice(0, len.moves).map((id) => {
    const ex = EXERCISES[id];
    const st = exState(state, id);
    return {
      id,
      kind: ex.kind,
      sets: defaultSets(state, ex),
      target: st.target,
      weight: st.weight,
      rest: ex.rest,
      logged: [],
      feel: null,
      done: false,
    };
  });
  const fin = EXERCISES[t.finisher];
  const fst = exState(state, t.finisher);
  const finisher = {
    id: t.finisher,
    kind: 'interval',
    work: fst.work || fin.work,
    rest: fin.rest,
    rounds: len.rounds,
    completed: 0,
    done: false,
  };
  return { templateId, name: t.name, focus: t.focus, items, finisher };
}

export function estimateMinutes(w) {
  let sec = 180; // warm-up
  for (const it of w.items) {
    const work = it.kind === 'time' ? it.target : 40;
    sec += it.sets * (work + it.rest) + 45;
  }
  sec += w.finisher.rounds * (w.finisher.work + w.finisher.rest);
  return Math.round(sec / 60 / 5) * 5;
}

// ── Weekly schedule ────────────────────────────────────────────────
// Returns Mon..Sun entries: {date, key, planned, sessions[], upcomingTemplate}
export function weekPlan(state, ref = new Date(), startOffset = 0) {
  const start = weekStart(ref);
  const todayKey = dayKey();
  const days = new Set(state.profile.days);
  const byDay = {};
  for (const s of state.sessions) (byDay[s.day] ||= []).push(s);
  let offset = startOffset;
  const out = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(start, i);
    const key = dayKey(date);
    const planned = days.has(date.getDay());
    const sessions = byDay[key] || [];
    let upcoming = null;
    const isFuture = key > todayKey || (key === todayKey && sessions.length === 0);
    if (planned && isFuture) {
      upcoming = nextTemplateId(state, offset++);
    }
    out.push({ date, key, planned, sessions, upcoming, isToday: key === todayKey, isPast: key < todayKey });
  }
  out.nextOffset = offset;
  return out;
}

export function sessionsInWeek(state, ref = new Date()) {
  const s = dayKey(weekStart(ref));
  const e = dayKey(addDays(weekStart(ref), 7));
  return state.sessions.filter((x) => x.day >= s && x.day < e);
}

/** Consecutive weeks (ending this week or last) where she hit her planned count. */
export function weekStreak(state) {
  const goal = Math.max(1, state.profile.days.length);
  const counts = {};
  for (const s of state.sessions) {
    const k = dayKey(weekStart(new Date(s.date)));
    counts[k] = (counts[k] || 0) + 1;
  }
  let w = weekStart(new Date());
  let streak = 0;
  if ((counts[dayKey(w)] || 0) >= goal) streak++;
  w = addDays(w, -7);
  while ((counts[dayKey(w)] || 0) >= goal) {
    streak++;
    w = addDays(w, -7);
  }
  return streak;
}

export function completeWeeks(state) {
  const goal = Math.max(1, state.profile.days.length);
  const counts = {};
  for (const s of state.sessions) {
    const k = dayKey(weekStart(new Date(s.date)));
    counts[k] = (counts[k] || 0) + 1;
  }
  return Object.values(counts).filter((c) => c >= goal).length;
}

// ── Progression ────────────────────────────────────────────────────
const half = (w) => Math.round(w * 2) / 2;

export const isDumbbell = (ex) => /dumbbell/i.test(ex.equip);

/** How much weight goes up (or down) when the plan adjusts it automatically. */
export function weightJump(state, ex) {
  return isDumbbell(ex) ? state.settings?.dbJump ?? 2 : ex.inc;
}

/** How much one tap of the +/− weight button changes the weight. */
export function weightTap(ex) {
  return isDumbbell(ex) ? 1 : ex.inc;
}

/**
 * Decide what she should do next time, based on how this exercise went.
 * Double progression: hit every target rep → add a rep next time; at the
 * top of the range → add weight and reset reps. Fall a little short →
 * same weight, a realistic rep goal. Fall well short (or twice) → lighter.
 */
export function progress(state, item) {
  const ex = EXERCISES[item.id];
  const st = exState(state, item.id);
  const sets = item.logged;
  if (!sets.length) return null;

  const reps = sets.map((s) => s.r);
  const usedW = sets[sets.length - 1].w;
  const target = item.target;
  const allHit = sets.length >= item.sets && reps.every((r) => r >= target);
  const total = reps.reduce((a, b) => a + b, 0);
  const ratio = total / (target * item.sets);
  const avg = total / reps.length;
  const easy = item.feel === 'easy';
  const hard = item.feel === 'hard';

  // Personal record check (before updating best)
  const prev = st.best;
  let pr = null;
  if (ex.kind === 'weight') {
    const topW = Math.max(...sets.map((s) => s.w));
    const repsAtTop = Math.max(...sets.filter((s) => s.w === topW).map((s) => s.r));
    if (prev && (topW > prev.w || (topW === prev.w && repsAtTop > prev.r))) pr = { w: topW, r: repsAtTop };
    if (!prev || topW > prev.w || (topW === prev.w && repsAtTop > prev.r)) st.best = { w: topW, r: repsAtTop };
  } else {
    const top = Math.max(...reps);
    if (prev && top > prev.r) pr = { r: top };
    if (!prev || top > prev.r) st.best = { w: 0, r: top };
  }

  let change, msg;
  const unit = ex.kind === 'time' ? 's' : ' reps';
  const step = ex.kind === 'time' ? 5 : 1;

  if (ex.kind === 'weight') {
    const jump = weightJump(state, ex);
    st.weight = usedW; // respect what she actually lifted
    if (allHit && !hard) {
      st.strikes = 0;
      if (target >= ex.max || (easy && avg >= ex.max - 1)) {
        st.weight = half(usedW + jump * (easy && avg >= ex.max ? 2 : 1));
        st.target = ex.min;
        change = 'up';
        msg = `Weight up! ${fmtW(st.weight)} lb × ${st.target}`;
      } else {
        st.target = Math.min(ex.max, target + (easy ? 2 : 1));
        change = 'reps';
        msg = `Aim for ${st.target} reps at ${fmtW(st.weight)} lb`;
      }
    } else if (allHit && hard) {
      st.strikes = 0;
      change = 'hold';
      msg = `Nailed it — same goal again: ${fmtW(st.weight)} lb × ${target}`;
    } else if (ratio >= 0.85 && st.strikes === 0) {
      st.strikes = 1;
      change = 'hold';
      msg = `So close! Same goal: ${fmtW(st.weight)} lb × ${target}`;
    } else if (ratio >= 0.7 && st.strikes === 0) {
      st.strikes = 1;
      st.target = Math.max(ex.min - 4, Math.min(target, Math.round(avg) + 1));
      change = 'adjust';
      msg = `Adjusted: ${fmtW(st.weight)} lb × ${st.target} next time`;
    } else {
      st.strikes = 0;
      st.weight = Math.max(jump, half(usedW - jump));
      st.target = ex.min;
      change = st.weight < usedW ? 'down' : 'adjust';
      msg = st.weight < usedW
        ? `Lighter next time: ${fmtW(st.weight)} lb × ${st.target} — build back up!`
        : `Next time: ${fmtW(st.weight)} lb × ${st.target}`;
    }
  } else {
    // Bodyweight reps or timed holds
    const cap = ex.kind === 'time' ? 90 : 30;
    if (allHit && !hard) {
      st.target = Math.min(cap, target + step * (easy ? 2 : 1));
      change = 'reps';
      msg = `Next time: ${st.target}${unit}`;
    } else if (allHit) {
      change = 'hold';
      msg = `Same goal next time: ${target}${unit}`;
    } else {
      const floor = ex.kind === 'time' ? 15 : 4;
      st.target = Math.max(floor, Math.min(target, Math.round(avg / step) * step + (ratio >= 0.85 ? 0 : step)));
      if (ratio >= 0.85) st.target = target;
      change = st.target < target ? 'adjust' : 'hold';
      msg = `Next time: ${st.target}${unit}`;
    }
  }

  if (change === 'up') state.stats.weightUps++;
  if (pr) state.stats.prs++;
  if (item.id === 'plank') state.stats.bestPlank = Math.max(state.stats.bestPlank, ...reps);

  st.history.push({ day: dayKey(), w: usedW, reps, feel: item.feel || null });
  if (st.history.length > 60) st.history.shift();
  return { change, msg, pr, allHit };
}

export function progressFinisher(state, fin) {
  const ex = EXERCISES[fin.id];
  const st = exState(state, fin.id);
  if (!fin.completed) return null;
  state.stats.finishers++;
  if (fin.completed >= fin.rounds) {
    const before = st.work || ex.work;
    st.work = Math.min(ex.maxWork, before + 5);
    return { change: st.work > before ? 'reps' : 'hold', msg: st.work > before ? `Next time: ${st.work}s work intervals` : 'Max intervals — amazing!' };
  }
  return { change: 'hold', msg: `Next time: finish all ${fin.rounds} rounds` };
}

export function volumeOf(item) {
  const ex = EXERCISES[item.id];
  if (ex.kind !== 'weight') return 0;
  const mult = (ex.perHand ? 2 : 1) * (ex.eachSide ? 2 : 1);
  return item.logged.reduce((sum, s) => sum + s.w * s.r * mult, 0);
}

function fmtW(w) {
  return Number.isInteger(w) ? w : w.toFixed(1);
}

# Momentum: adaptive workout app

A free, installable workout app for iPhone. It's a web app, so there's no App Store and no subscription. It builds a weekly gym plan for fat loss and toning, and adjusts each exercise based on how her last session went.

## Install on her iPhone

1. Open **https://tubularwalrus.github.io/helthy-mama/** in **Safari**.
2. Tap the **Share** button, then **Add to Home Screen**.
3. Open it from the home-screen icon. It runs full-screen like a normal app and works offline.

All data stays on the phone, in the app's own storage. Use **Settings → Export backup** now and then.

## Features

- **Weekly plan**: pick training days (1–7) and session length (30, 45 or 60 min).
  - 2–3 days: full-body rotation.
  - 4+ days: upper/lower split plus a "Sculpt & Sweat" cardio and core day.
  - Every session ends with a cardio interval finisher.
- **Adapts to her performance**, per exercise (logic in `js/program.js` → `progress()`):
  - Hits every rep → +1 rep next time (+2 if she marked it "Easy").
  - At the top of the rep range → weight goes up and reps reset.
  - Slightly short (≥85% of target reps) → same goal again.
  - Short by more (≥70%, e.g. 8 of 10) → same weight, a realistic rep goal (9).
  - Short twice in a row, or well short → weight drops one step so she can build back up.
- **Guided workout flow**: animated demo, set-by-set logging with weight/rep steppers, and an automatic rest timer (±15s, skip) with beeps in the last 3 seconds. Timed holds (plank) and work/rest interval finishers are timed for her. Keeps the screen awake during a workout.
- **Medals**: 30 achievements across workouts, weekly streaks, personal records, weight increases, total pounds lifted and weight loss. Unlocking one plays a full-screen animation with confetti and a chime.
- **Progress**: weight trend chart with a goal line, workouts per week, and a strength trend per exercise.
- **Animated exercise demos**: 24 exercises drawn as looping figures (`js/figure.js`). No videos, works offline.

## Apple Health

Web apps can't read Apple Health. Weight is logged in the app (it takes about 5 seconds a week). A native SwiftUI version would be needed for automatic HealthKit sync.

## Files

| File | What it does |
|---|---|
| `js/exercises.js` | Exercise library (cues, rep ranges, starting weights, animation poses), workout templates, rotations |
| `js/program.js` | Plan generation, weekly schedule, progression rules |
| `js/medals.js` | Medal definitions |
| `js/figure.js` | Stick-figure animation renderer |
| `js/app.js` | UI and workout flow |
| `js/fx.js` | Confetti, sounds, haptics, wake lock |
| `sw.js` | Offline cache. **Bump `CACHE` when you change files** so phones pick up the update. |

To run locally: `python3 -m http.server` in this folder, then open http://localhost:8000.

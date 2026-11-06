// Exercise library.
// Each exercise has two key poses (A and B) that the figure renderer
// loops between. Poses are joint angles in degrees (0 = facing direction,
// 90 = straight down, -90 = straight up) plus an anchor point that stays
// fixed (usually the feet). See figure.js for how they are drawn.
//
// kind:  'weight'  – reps x weight (lbs)
//        'body'    – bodyweight reps
//        'time'    – hold for seconds
//        'interval'– cardio finisher: work/rest rounds
// perHand: weight is per dumbbell (volume counts both hands)

const stand = { a: 'foot', x: 100, y: 186, t: -90, th: 90, sh: 90, ua: 90, fa: 90 };

export const EXERCISES = {
  goblet_squat: {
    name: 'Goblet Squat',
    muscles: ['Glutes', 'Quads', 'Core'],
    equip: 'Dumbbell',
    kind: 'weight', min: 10, max: 12, sets: 3, rest: 90, start: 15, inc: 5,
    cues: [
      'Hold one dumbbell vertically against your chest, elbows tucked.',
      'Feet shoulder-width, toes turned out slightly.',
      'Sit your hips back and down until thighs are about parallel.',
      'Drive through your whole foot to stand tall and squeeze your glutes.',
    ],
    anim: {
      A: { ...stand, x: 105, ua: 78, fa: -82 },
      B: { a: 'foot', x: 105, y: 186, t: -60, th: 12, sh: 118, ua: 72, fa: -98 },
      props: [{ type: 'db', at: 'hand', vertical: true }],
    },
  },

  leg_press: {
    name: 'Leg Press',
    muscles: ['Quads', 'Glutes', 'Hamstrings'],
    equip: 'Machine',
    kind: 'weight', min: 10, max: 12, sets: 3, rest: 90, start: 50, inc: 10,
    cues: [
      'Sit with your back flat against the pad.',
      'Feet hip-width in the middle of the platform.',
      'Lower until knees reach about 90°, keeping your lower back down.',
      'Press through your heels — don’t lock your knees at the top.',
    ],
    anim: {
      A: { a: 'hip', x: 72, y: 146, t: -150, th: -35, sh: -35, ua: 100, fa: 60 },
      B: { a: 'hip', x: 72, y: 146, t: -150, th: -92, sh: 2, ua: 100, fa: 60 },
      props: [
        { type: 'line', x1: 28, y1: 118, x2: 82, y2: 154, w: 10 },
        { type: 'line', x1: 60, y1: 160, x2: 60, y2: 186, w: 5 },
        { type: 'rail', x1: 70, y1: 160, x2: 175, y2: 86 },
        { type: 'plate', at: 'foot', angle: 55, len: 34 },
      ],
    },
  },

  rdl: {
    name: 'Romanian Deadlift',
    muscles: ['Hamstrings', 'Glutes', 'Lower back'],
    equip: 'Dumbbells', perHand: true,
    kind: 'weight', min: 10, max: 12, sets: 3, rest: 90, start: 15, inc: 5,
    cues: [
      'Stand tall holding dumbbells in front of your thighs.',
      'Soften your knees and push your hips straight back.',
      'Slide the weights down your legs with a flat back — stop at mid-shin.',
      'Squeeze your glutes to drive your hips forward and stand up.',
    ],
    anim: {
      A: { ...stand, ua: 92, fa: 90 },
      B: { a: 'foot', x: 100, y: 186, t: -14, th: 80, sh: 97, ua: 92, fa: 90 },
      props: [{ type: 'db', at: 'hand' }],
    },
  },

  hip_thrust: {
    name: 'Hip Thrust',
    muscles: ['Glutes', 'Hamstrings'],
    equip: 'Barbell + bench',
    kind: 'weight', min: 10, max: 12, sets: 3, rest: 90, start: 45, inc: 10,
    cues: [
      'Rest your upper back on the edge of a bench, bar over your hips (use a pad).',
      'Feet flat, about hip-width, shins vertical at the top.',
      'Drive through your heels and lift until your body is a straight line.',
      'Tuck your chin, squeeze your glutes hard for a second, then lower.',
    ],
    anim: {
      A: { a: 'foot', x: 128, y: 186, t: -140, th: -45, sh: 78, ua: 30, fa: 55 },
      B: { a: 'foot', x: 128, y: 186, t: -173, th: 0, sh: 95, ua: -2, fa: 22 },
      props: [
        { type: 'bench', x: 14, y: 150, w: 46 },
        { type: 'bar', at: 'hip' },
      ],
    },
  },

  reverse_lunge: {
    name: 'Reverse Lunge',
    muscles: ['Glutes', 'Quads'],
    equip: 'Dumbbells', perHand: true,
    kind: 'weight', min: 8, max: 10, sets: 3, rest: 75, start: 10, inc: 5, eachSide: true,
    cues: [
      'Stand tall with dumbbells at your sides.',
      'Step one foot back and lower until both knees are about 90°.',
      'Keep your chest up and front knee over your ankle.',
      'Push through your front heel to return. Alternate legs.',
    ],
    anim: {
      A: { ...stand, x: 110, th2: 90, sh2: 90 },
      B: { a: 'foot', x: 110, y: 186, t: -88, th: 5, sh: 92, th2: 115, sh2: 175, ua: 92, fa: 90 },
      props: [{ type: 'db', at: 'hand' }],
    },
  },

  step_up: {
    name: 'Dumbbell Step-Up',
    muscles: ['Glutes', 'Quads'],
    equip: 'Dumbbells + box', perHand: true,
    kind: 'weight', min: 8, max: 10, sets: 3, rest: 75, start: 10, inc: 5, eachSide: true,
    cues: [
      'Place one whole foot on a sturdy box or bench (knee-height or lower).',
      'Lean slightly forward and drive through the top foot.',
      'Stand tall on the box — don’t push off the bottom foot.',
      'Lower slowly with control. Finish all reps, then switch legs.',
    ],
    anim: {
      A: { a: 'foot', x: 118, y: 150, t: -78, th: -2, sh: 112, th2: 95, sh2: 128, ua: 92, fa: 90 },
      B: { a: 'foot', x: 118, y: 150, t: -90, th: 90, sh: 90, th2: 40, sh2: 110, ua: 92, fa: 90 },
      props: [
        { type: 'box', x: 92, y: 150, w: 62 },
        { type: 'db', at: 'hand' },
      ],
    },
  },

  leg_curl: {
    name: 'Lying Leg Curl',
    muscles: ['Hamstrings'],
    equip: 'Machine',
    kind: 'weight', min: 12, max: 15, sets: 3, rest: 60, start: 30, inc: 5,
    cues: [
      'Lie face down with the pad just above your heels.',
      'Hold the handles and keep your hips pressed into the bench.',
      'Curl your heels toward your glutes.',
      'Lower slowly — take about 3 seconds on the way down.',
    ],
    anim: {
      A: { a: 'hip', x: 102, y: 138, t: 180, th: 2, sh: 2, ua: 110, fa: 170 },
      B: { a: 'hip', x: 102, y: 138, t: 180, th: 2, sh: -105, ua: 110, fa: 170 },
      props: [
        { type: 'bench', x: 22, y: 147, w: 116 },
        { type: 'roller', at: 'foot' },
      ],
    },
  },

  cable_kickback: {
    name: 'Cable Glute Kickback',
    muscles: ['Glutes'],
    equip: 'Cable + ankle strap',
    kind: 'weight', min: 12, max: 15, sets: 3, rest: 60, start: 10, inc: 5, eachSide: true,
    cues: [
      'Attach the ankle strap and face the cable machine, holding it for support.',
      'Hinge forward slightly with a soft standing knee.',
      'Kick your working leg straight back, squeezing the glute.',
      'Don’t arch your lower back — the movement comes from the hip.',
    ],
    anim: {
      A: { a: 'foot', x: 100, y: 186, t: -62, th: 90, sh: 90, th2: 98, sh2: 96, ua: 8, fa: 0 },
      B: { a: 'foot', x: 100, y: 186, t: -62, th: 90, sh: 90, th2: 152, sh2: 158, ua: 8, fa: 0 },
      props: [
        { type: 'tower', x: 168 },
        { type: 'cable', x: 166, y: 178, to: 'foot2' },
      ],
    },
  },

  glute_bridge: {
    name: 'Glute Bridge',
    muscles: ['Glutes', 'Core'],
    equip: 'Mat',
    kind: 'body', min: 12, max: 20, sets: 3, rest: 45, start: 12,
    cues: [
      'Lie on your back, knees bent, feet flat and hip-width apart.',
      'Brace your core and press your lower back gently into the floor.',
      'Drive through your heels to lift your hips into a straight line.',
      'Pause and squeeze at the top, then lower with control.',
    ],
    anim: {
      A: { a: 'foot', x: 128, y: 186, t: 180, th: -45, sh: 70, ua: 2, fa: 0 },
      B: { a: 'foot', x: 128, y: 186, t: 150, th: -5, sh: 100, ua: 18, fa: 0 },
      props: [{ type: 'mat' }],
    },
  },

  db_bench: {
    name: 'Dumbbell Bench Press',
    muscles: ['Chest', 'Triceps', 'Shoulders'],
    equip: 'Dumbbells + bench', perHand: true,
    kind: 'weight', min: 10, max: 12, sets: 3, rest: 90, start: 15, inc: 5,
    cues: [
      'Lie on a flat bench, feet flat on the floor.',
      'Start with dumbbells over your chest, palms facing your feet.',
      'Lower until elbows are slightly below the bench, at about 45° from your body.',
      'Press back up and bring the weights together over your chest.',
    ],
    anim: {
      A: { a: 'hip', x: 112, y: 148, t: 180, th: -10, sh: 95, ua: -90, fa: -90 },
      B: { a: 'hip', x: 112, y: 148, t: 180, th: -10, sh: 95, ua: 75, fa: -95 },
      props: [
        { type: 'bench', x: 38, y: 155, w: 100 },
        { type: 'db', at: 'hand' },
      ],
    },
  },

  db_shoulder_press: {
    name: 'Seated Shoulder Press',
    muscles: ['Shoulders', 'Triceps'],
    equip: 'Dumbbells + bench', perHand: true,
    kind: 'weight', min: 10, max: 12, sets: 3, rest: 75, start: 10, inc: 5,
    cues: [
      'Sit tall on an upright bench, back against the pad.',
      'Start with dumbbells at shoulder height, palms forward.',
      'Press straight up until arms are extended overhead.',
      'Lower slowly back to shoulder height. Keep your ribs down.',
    ],
    anim: {
      A: { a: 'hip', x: 100, y: 150, t: -90, th: 0, sh: 90, ua: 55, fa: -100 },
      B: { a: 'hip', x: 100, y: 150, t: -90, th: 0, sh: 90, ua: -84, fa: -88 },
      props: [
        { type: 'seat', x: 78, y: 155, w: 44, back: true },
        { type: 'db', at: 'hand' },
      ],
    },
  },

  incline_pushup: {
    name: 'Incline Push-Up',
    muscles: ['Chest', 'Triceps', 'Core'],
    equip: 'Bench or box',
    kind: 'body', min: 8, max: 15, sets: 3, rest: 60, start: 8,
    cues: [
      'Place your hands on a bench, slightly wider than your shoulders.',
      'Walk your feet back so your body forms a straight line.',
      'Lower your chest to the bench, elbows at about 45°.',
      'Push away to straighten your arms. Keep your core tight.',
    ],
    anim: {
      A: { a: 'foot', x: 36, y: 186, t: -54, th: 126, sh: 126, ua: 90, fa: 90 },
      B: { a: 'foot', x: 36, y: 186, t: -40, th: 140, sh: 140, ua: 170, fa: 79 },
      props: [{ type: 'box', x: 92, y: 141, w: 48 }],
    },
  },

  tricep_pushdown: {
    name: 'Triceps Pushdown',
    muscles: ['Triceps'],
    equip: 'Cable + rope',
    kind: 'weight', min: 12, max: 15, sets: 3, rest: 60, start: 20, inc: 5,
    cues: [
      'Face the cable with the rope or bar attachment set high.',
      'Pin your elbows to your sides.',
      'Push down until your arms are fully straight.',
      'Let the cable rise slowly back to chest height, elbows still pinned.',
    ],
    anim: {
      A: { ...stand, t: -84, ua: 95, fa: -40 },
      B: { ...stand, t: -84, ua: 95, fa: 84 },
      props: [
        { type: 'tower', x: 168 },
        { type: 'cable', x: 166, y: 26, to: 'hand' },
      ],
    },
  },

  lat_pulldown: {
    name: 'Lat Pulldown',
    muscles: ['Back', 'Biceps'],
    equip: 'Cable machine',
    kind: 'weight', min: 10, max: 12, sets: 3, rest: 90, start: 40, inc: 5,
    cues: [
      'Sit with thighs snug under the pad and grip the bar wide.',
      'Lean back slightly and lift your chest.',
      'Pull the bar to your upper chest, driving your elbows down.',
      'Let the bar rise slowly until your arms are straight.',
    ],
    anim: {
      A: { a: 'hip', x: 95, y: 150, t: -100, th: 0, sh: 90, ua: -80, fa: -85 },
      B: { a: 'hip', x: 95, y: 150, t: -104, th: 0, sh: 90, ua: 112, fa: -70 },
      props: [
        { type: 'seat', x: 74, y: 155, w: 42 },
        { type: 'pad', x: 118, y: 136 },
        { type: 'cable', x: 92, y: 10, to: 'hand' },
        { type: 'handlebar', at: 'hand' },
      ],
    },
  },

  cable_row: {
    name: 'Seated Cable Row',
    muscles: ['Back', 'Biceps', 'Rear delts'],
    equip: 'Cable machine',
    kind: 'weight', min: 10, max: 12, sets: 3, rest: 90, start: 40, inc: 5,
    cues: [
      'Sit tall with feet on the platform and knees slightly bent.',
      'Grab the handle with arms straight in front of you.',
      'Pull the handle to your belly, squeezing your shoulder blades together.',
      'Reach forward slowly to return — don’t round your back.',
    ],
    anim: {
      A: { a: 'hip', x: 66, y: 162, t: -76, th: -10, sh: 20, ua: 4, fa: 0 },
      B: { a: 'hip', x: 66, y: 162, t: -96, th: -10, sh: 20, ua: 120, fa: 5 },
      props: [
        { type: 'line', x1: 40, y1: 168, x2: 110, y2: 168, w: 6 },
        { type: 'line', x1: 146, y1: 150, x2: 150, y2: 180, w: 6 },
        { type: 'tower', x: 172 },
        { type: 'cable', x: 168, y: 158, to: 'hand' },
      ],
    },
  },

  db_row: {
    name: 'One-Arm Dumbbell Row',
    muscles: ['Back', 'Biceps'],
    equip: 'Dumbbell + bench',
    kind: 'weight', min: 10, max: 12, sets: 3, rest: 60, start: 15, inc: 5, eachSide: true,
    cues: [
      'Place one hand on a bench, feet staggered, back flat and hinged forward.',
      'Let the dumbbell hang straight down from your shoulder.',
      'Row it toward your hip, keeping your elbow close.',
      'Lower slowly. Finish all reps, then switch sides.',
    ],
    anim: {
      A: { a: 'foot', x: 150, y: 186, t: 186, th: 100, sh: 85, th2: 75, sh2: 95, ua2: 90, fa2: 92, ua: 92, fa: 90 },
      B: { a: 'foot', x: 150, y: 186, t: 186, th: 100, sh: 85, th2: 75, sh2: 95, ua2: 90, fa2: 92, ua: -30, fa: 80 },
      props: [
        { type: 'bench', x: 30, y: 158, w: 104 },
        { type: 'db', at: 'hand' },
      ],
    },
  },

  db_curl: {
    name: 'Dumbbell Biceps Curl',
    muscles: ['Biceps'],
    equip: 'Dumbbells', perHand: true,
    kind: 'weight', min: 10, max: 12, sets: 3, rest: 60, start: 10, inc: 5,
    cues: [
      'Stand tall, dumbbells at your sides, palms facing forward.',
      'Keep your elbows pinned to your ribs.',
      'Curl the weights up toward your shoulders.',
      'Lower slowly all the way down — no swinging.',
    ],
    anim: {
      A: { ...stand, ua: 94, fa: 88 },
      B: { ...stand, ua: 94, fa: -72 },
      props: [{ type: 'db', at: 'hand' }],
    },
  },

  lateral_raise: {
    name: 'Lateral Raise',
    muscles: ['Shoulders'],
    equip: 'Dumbbells', perHand: true,
    kind: 'weight', min: 12, max: 15, sets: 3, rest: 60, start: 5, inc: 2.5,
    cues: [
      'Stand tall with light dumbbells at your sides.',
      'With a slight bend in your elbows, raise your arms out to the sides.',
      'Stop at shoulder height — think “pour the water out”.',
      'Lower slowly over 2–3 seconds.',
    ],
    anim: {
      front: true,
      A: { a: 'foot', x: 112, y: 186, t: -90, th: 97, sh: 92, ua: 82, fa: 86 },
      B: { a: 'foot', x: 112, y: 186, t: -90, th: 97, sh: 92, ua: 4, fa: 0 },
      props: [{ type: 'db', at: 'hand' }],
    },
  },

  plank: {
    name: 'Forearm Plank',
    muscles: ['Core', 'Shoulders'],
    equip: 'Mat',
    kind: 'time', min: 20, max: 60, sets: 3, rest: 45, start: 20,
    cues: [
      'Forearms on the floor, elbows under your shoulders.',
      'Step your feet back so you form a straight line from head to heels.',
      'Squeeze your glutes and pull your belly button in.',
      'Breathe steadily. Drop to your knees if your hips sag.',
    ],
    anim: {
      A: { a: 'foot', x: 34, y: 186, t: -14, th: 166, sh: 166, ua: 92, fa: 0 },
      B: { a: 'foot', x: 34, y: 186, t: -16, th: 165, sh: 165, ua: 92, fa: 0 },
      props: [{ type: 'mat' }],
      speed: 0.4,
    },
  },

  dead_bug: {
    name: 'Dead Bug',
    muscles: ['Core'],
    equip: 'Mat',
    kind: 'body', min: 8, max: 14, sets: 3, rest: 45, start: 8, eachSide: true,
    cues: [
      'Lie on your back, arms up toward the ceiling, knees bent at 90° over your hips.',
      'Press your lower back flat into the floor.',
      'Slowly reach one arm overhead and extend the opposite leg.',
      'Return and switch sides. Keep your back glued down.',
    ],
    anim: {
      A: { a: 'hip', x: 124, y: 178, t: 180, th: -90, sh: 0, th2: -90, sh2: 0, ua: -90, fa: -90, ua2: -90, fa2: -90 },
      B: { a: 'hip', x: 124, y: 178, t: 180, th: -90, sh: 0, th2: -8, sh2: -8, ua: 188, fa: 186, ua2: -90, fa2: -90 },
      props: [{ type: 'mat' }],
    },
  },

  mountain_climber: {
    name: 'Mountain Climbers',
    muscles: ['Core', 'Cardio', 'Shoulders'],
    equip: 'Mat',
    kind: 'time', min: 20, max: 45, sets: 3, rest: 30, start: 20,
    cues: [
      'Start in a high plank, hands under shoulders.',
      'Drive one knee toward your chest, then quickly switch legs.',
      'Keep your hips level — don’t pike up.',
      'Go at a steady pace you can hold. Slow steps are fine!',
    ],
    anim: {
      A: { a: 'hand', x: 142, y: 184, t: -22, th: 155, sh: 155, th2: 45, sh2: 160, ua: 90, fa: 90 },
      B: { a: 'hand', x: 142, y: 184, t: -22, th: 45, sh: 160, th2: 155, sh2: 155, ua: 90, fa: 90 },
      props: [{ type: 'mat' }],
      speed: 1.6,
    },
  },

  bike: {
    name: 'Bike Intervals',
    muscles: ['Cardio', 'Legs'],
    equip: 'Stationary bike',
    kind: 'interval', work: 30, rest: 30, maxWork: 45,
    cues: [
      'Set the seat so your knee is slightly bent at the bottom of the pedal stroke.',
      'Work: pedal hard with high resistance or speed — about 8/10 effort.',
      'Rest: easy spin to catch your breath.',
      'Stay seated and keep your shoulders relaxed.',
    ],
    anim: {
      A: { a: 'hip', x: 82, y: 104, t: -72, th: 30, sh: 112, th2: 70, sh2: 72, ua: 28, fa: 12 },
      B: { a: 'hip', x: 82, y: 104, t: -72, th: 70, sh: 72, th2: 30, sh2: 112, ua: 28, fa: 12 },
      props: [{ type: 'bike' }],
      speed: 1.6,
    },
  },

  incline_walk: {
    name: 'Incline Walk Intervals',
    muscles: ['Cardio', 'Glutes'],
    equip: 'Treadmill',
    kind: 'interval', work: 45, rest: 15, maxWork: 60,
    cues: [
      'Set the incline to 6–10% and a brisk walking pace.',
      'Work: raise the speed (or incline) so you’re breathing hard.',
      'Rest: drop back to a comfortable pace.',
      'Try not to hold the handrails — swing your arms.',
    ],
    anim: {
      A: { a: 'hip', x: 98, y: 100, t: -92, th: 68, sh: 96, th2: 114, sh2: 125, ua: 110, fa: 80, ua2: 72, fa2: 40 },
      B: { a: 'hip', x: 98, y: 100, t: -92, th: 114, sh: 125, th2: 68, sh2: 96, ua: 72, fa: 40, ua2: 110, fa2: 80 },
      props: [{ type: 'treadmill' }],
      speed: 1.2,
    },
  },

  rower: {
    name: 'Rowing Intervals',
    muscles: ['Cardio', 'Back', 'Legs'],
    equip: 'Rowing machine',
    kind: 'interval', work: 30, rest: 30, maxWork: 45,
    cues: [
      'Strap your feet in. Start with knees bent and arms straight.',
      'Push with your legs first, then lean back slightly, then pull the handle to your ribs.',
      'Reverse it: arms, body, then legs.',
      'Work: strong strokes. Rest: light, easy strokes.',
    ],
    anim: {
      A: { a: 'foot', x: 150, y: 168, t: -60, th: -50, sh: 65, ua: 8, fa: 0 },
      B: { a: 'foot', x: 150, y: 168, t: -108, th: -5, sh: 5, ua: 118, fa: -12 },
      props: [{ type: 'rower' }],
    },
  },
};

// Workout templates. Exercises are listed in priority order: shorter
// sessions take the first few strength moves. `finisher` is the cardio
// interval at the end.
export const TEMPLATES = {
  full_a: { name: 'Full Body A', focus: ['Full body', 'Strength'], ex: ['goblet_squat', 'db_bench', 'lat_pulldown', 'rdl', 'lateral_raise', 'plank', 'db_curl'], finisher: 'bike' },
  full_b: { name: 'Full Body B', focus: ['Full body', 'Glutes'], ex: ['leg_press', 'cable_row', 'db_shoulder_press', 'hip_thrust', 'tricep_pushdown', 'dead_bug', 'glute_bridge'], finisher: 'rower' },
  full_c: { name: 'Full Body C', focus: ['Full body', 'Tone'], ex: ['reverse_lunge', 'incline_pushup', 'db_row', 'leg_curl', 'cable_kickback', 'mountain_climber', 'lateral_raise'], finisher: 'incline_walk' },
  lower_a: { name: 'Lower Body A', focus: ['Glutes', 'Legs'], ex: ['goblet_squat', 'hip_thrust', 'rdl', 'reverse_lunge', 'leg_curl', 'cable_kickback', 'plank'], finisher: 'bike' },
  upper_a: { name: 'Upper Body A', focus: ['Arms', 'Back', 'Shoulders'], ex: ['db_bench', 'lat_pulldown', 'db_shoulder_press', 'cable_row', 'lateral_raise', 'tricep_pushdown', 'dead_bug'], finisher: 'rower' },
  lower_b: { name: 'Lower Body B', focus: ['Glutes', 'Legs'], ex: ['leg_press', 'hip_thrust', 'step_up', 'leg_curl', 'glute_bridge', 'cable_kickback', 'dead_bug'], finisher: 'incline_walk' },
  upper_b: { name: 'Upper Body B', focus: ['Arms', 'Back', 'Core'], ex: ['cable_row', 'incline_pushup', 'db_row', 'lateral_raise', 'db_curl', 'tricep_pushdown', 'plank'], finisher: 'bike' },
  cond: { name: 'Sculpt & Sweat', focus: ['Cardio', 'Core', 'Glutes'], ex: ['step_up', 'glute_bridge', 'mountain_climber', 'dead_bug', 'plank', 'cable_kickback'], finisher: 'incline_walk' },
};

export const ROTATIONS = {
  1: ['full_a'],
  2: ['full_a', 'full_b'],
  3: ['full_a', 'full_b', 'full_c'],
  4: ['lower_a', 'upper_a', 'lower_b', 'upper_b'],
  5: ['lower_a', 'upper_a', 'cond', 'lower_b', 'upper_b'],
  6: ['lower_a', 'upper_a', 'cond', 'lower_b', 'upper_b', 'full_c'],
  7: ['lower_a', 'upper_a', 'cond', 'lower_b', 'upper_b', 'full_c', 'full_b'],
};

// Session length → number of strength moves + finisher rounds.
export const LENGTHS = {
  30: { moves: 4, rounds: 5 },
  45: { moves: 5, rounds: 8 },
  60: { moves: 7, rounds: 10 },
};

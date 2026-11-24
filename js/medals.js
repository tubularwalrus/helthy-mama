// Medals & achievements.
import { weekStreak, completeWeeks } from './program.js';

// tier: bronze | silver | gold | platinum | diamond
const M = (id, name, desc, icon, tier, value, goal) => ({ id, name, desc, icon, tier, value, goal });

function stats(state) {
  const sessions = state.sessions;
  const volume = sessions.reduce((a, s) => a + (s.volume || 0), 0);
  const ws = [...state.weights].sort((a, b) => (a.day < b.day ? -1 : 1));
  const start = state.profile.startWeight || ws[0]?.lbs || null;
  const current = ws.length ? ws[ws.length - 1].lbs : null;
  const lost = start && current ? Math.max(0, start - current) : 0;
  const goal = state.profile.goalWeight;
  const hours = sessions.map((s) => new Date(s.date).getHours());
  return {
    workouts: sessions.length,
    volume,
    lost,
    goalReached: goal && current && start && start > goal && current <= goal,
    weighIns: state.weights.length,
    early: hours.some((h) => h < 8),
    late: hours.some((h) => h >= 20),
    streak: weekStreak(state),
    fullWeeks: completeWeeks(state),
    ...state.stats,
  };
}

export function medalList(state) {
  const s = stats(state);
  return [
    M('first', 'First Step', 'Finish your first workout', '🌱', 'bronze', s.workouts, 1),
    M('w5', 'High Five', 'Finish 5 workouts', '⭐', 'bronze', s.workouts, 5),
    M('w10', 'On Fire', 'Finish 10 workouts', '🔥', 'silver', s.workouts, 10),
    M('w25', 'Committed', 'Finish 25 workouts', '💪', 'gold', s.workouts, 25),
    M('w50', 'Unstoppable', 'Finish 50 workouts', '🏆', 'platinum', s.workouts, 50),
    M('w100', 'Legend', 'Finish 100 workouts', '👑', 'diamond', s.workouts, 100),

    M('week1', 'Perfect Week', 'Complete every planned workout in a week', '📅', 'silver', s.fullWeeks, 1),
    M('streak4', 'Month Strong', 'Hit your weekly goal 4 weeks in a row', '🗓️', 'gold', s.streak, 4),
    M('streak12', 'Habit Formed', 'Hit your weekly goal 12 weeks in a row', '💎', 'diamond', s.streak, 12),

    M('pr1', 'New Record', 'Set your first personal record', '🚀', 'bronze', s.prs, 1),
    M('pr10', 'Record Breaker', 'Set 10 personal records', '⚡', 'silver', s.prs, 10),
    M('pr25', 'Stronger Every Week', 'Set 25 personal records', '🌟', 'gold', s.prs, 25),

    M('up1', 'Level Up', 'Earn your first weight increase', '⬆️', 'bronze', s.weightUps, 1),
    M('up10', 'Climbing', 'Earn 10 weight increases', '🧗‍♀️', 'silver', s.weightUps, 10),
    M('up30', 'Powerhouse', 'Earn 30 weight increases', '🦾', 'gold', s.weightUps, 30),

    M('v10k', 'Heavy Lifting', 'Lift 10,000 lb in total', '🏋️‍♀️', 'bronze', s.volume, 10000),
    M('v50k', 'Ton of Fun', 'Lift 50,000 lb in total', '🐘', 'silver', s.volume, 50000),
    M('v100k', 'Six Figures', 'Lift 100,000 lb in total', '💯', 'gold', s.volume, 100000),
    M('v250k', 'Moving Mountains', 'Lift 250,000 lb in total', '⛰️', 'platinum', s.volume, 250000),

    M('lost5', 'First Five', 'Lose 5 lb', '⚖️', 'bronze', s.lost, 5),
    M('lost10', 'Double Digits', 'Lose 10 lb', '🎉', 'silver', s.lost, 10),
    M('lost15', 'Fifteen Down', 'Lose 15 lb', '🌸', 'gold', s.lost, 15),
    M('lost20', 'Twenty Strong', 'Lose 20 lb', '🦋', 'platinum', s.lost, 20),
    M('goal', 'Goal Getter', 'Reach your goal weight', '🎯', 'diamond', s.goalReached ? 1 : 0, 1),
    M('weigh10', 'Check-In Champ', 'Log your weight 10 times', '📈', 'bronze', s.weighIns, 10),

    M('perfect', 'Flawless', 'Hit every target rep in a whole workout', '✨', 'silver', s.perfect, 1),
    M('plank60', 'Rock Solid', 'Hold a plank for 60 seconds', '🧱', 'silver', s.bestPlank, 60),
    M('fin10', 'Cardio Queen', 'Finish 10 cardio finishers', '❤️', 'silver', s.finishers, 10),
    M('early', 'Early Bird', 'Work out before 8 am', '🌅', 'bronze', s.early ? 1 : 0, 1),
    M('late', 'Night Owl', 'Work out after 8 pm', '🌙', 'bronze', s.late ? 1 : 0, 1),
    M('song1', 'Press Play', 'Play your first Song of the Day', '🎵', 'bronze', s.songs, 1),
    M('song10', 'Dance Floor Ready', 'Play 10 Songs of the Day', '🎧', 'silver', s.songs, 10),
    M('song30', 'Main Character', 'Play 30 Songs of the Day', '🪩', 'gold', s.songs, 30),
  ];
}

/** Award any newly earned medals. Returns the new ones. */
export function checkMedals(state) {
  const earned = [];
  for (const m of medalList(state)) {
    if (!state.medals[m.id] && m.value >= m.goal) {
      state.medals[m.id] = Date.now();
      earned.push(m);
    }
  }
  return earned;
}

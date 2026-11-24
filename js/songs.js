// Song of the Day: upbeat pop & dance tracks for workouts.
// Links open a Spotify search for the song, so they never point at a wrong
// track ID. Add or remove songs freely: [artist, title].
import { dayKey } from './util.js';

export const SONGS = [
  ['Dua Lipa', 'Levitating'],
  ['Dua Lipa', 'Don’t Start Now'],
  ['Dua Lipa', 'Physical'],
  ['Dua Lipa', 'Dance the Night'],
  ['Calvin Harris & Dua Lipa', 'One Kiss'],
  ['Calvin Harris', 'Summer'],
  ['Calvin Harris & Rihanna', 'This Is What You Came For'],
  ['Calvin Harris & Ellie Goulding', 'Miracle'],
  ['Clean Bandit & Jess Glynne', 'Rather Be'],
  ['Kygo & Whitney Houston', 'Higher Love'],
  ['Avicii', 'Levels'],
  ['Avicii', 'Wake Me Up'],
  ['Zedd & Foxes', 'Clarity'],
  ['Martin Garrix & Dua Lipa', 'Scared to Be Lonely'],
  ['Lady Gaga & Ariana Grande', 'Rain On Me'],
  ['Lady Gaga', 'Just Dance'],
  ['Ava Max', 'Kings & Queens'],
  ['Ava Max', 'Sweet but Psycho'],
  ['Doja Cat', 'Say So'],
  ['Lizzo', 'Juice'],
  ['Kylie Minogue', 'Padam Padam'],
  ['David Guetta & Sia', 'Titanium'],
  ['David Guetta & Bebe Rexha', 'I’m Good (Blue)'],
  ['Joel Corry & MNEK', 'Head & Heart'],
  ['Purple Disco Machine & Sophie and the Giants', 'In the Dark'],
  ['Swedish House Mafia & John Martin', 'Don’t You Worry Child'],
  ['Galantis', 'Runaway (U & I)'],
  ['Tiësto', 'The Business'],
  ['Lost Frequencies & Calum Scott', 'Where Are You Now'],
  ['Becky Hill & David Guetta', 'Remember'],
  ['The Chainsmokers & Daya', 'Don’t Let Me Down'],
  ['Kygo & Selena Gomez', 'It Ain’t Me'],
  ['Marshmello & Bastille', 'Happier'],
  ['Alesso & Tove Lo', 'Heroes (We Could Be)'],
  ['Robin Schulz & Francesco Yates', 'Sugar'],
  ['Major Lazer & DJ Snake & MØ', 'Lean On'],
  ['Mark Ronson & Bruno Mars', 'Uptown Funk'],
  ['Justin Timberlake', 'Can’t Stop the Feeling!'],
  ['Beyoncé', 'Break My Soul'],
  ['Katy Perry', 'Firework'],
  ['Taylor Swift', 'Shake It Off'],
  ['Ellie Goulding', 'Lights'],
  ['Rita Ora', 'Anywhere'],
  ['Sabrina Carpenter', 'Espresso'],
  ['Miley Cyrus', 'Flowers'],
  ['Charli XCX', '360'],
];

export const songKey = (s) => `${s[0]} — ${s[1]}`;

export function spotifySearchUrl(query) {
  return `https://open.spotify.com/search/${encodeURIComponent(query)}`;
}

export function songUrl(s) {
  // Main artist + title is the most reliable search.
  return spotifySearchUrl(`${s[0].split(' & ')[0]} ${s[1]}`);
}

export const VAVO_URL = spotifySearchUrl('VAVO remix');

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Today's song: picked by date, or her shuffle choice for today. */
export function songOfDay(state) {
  const today = dayKey();
  const m = state.music;
  if (m.day === today && SONGS[m.idx]) return { song: SONGS[m.idx], idx: m.idx };
  // Avoid repeating yesterday's pick.
  let idx = hash(today) % SONGS.length;
  if (idx === m.idx) idx = (idx + 1) % SONGS.length;
  return { song: SONGS[idx], idx };
}

export function shuffleSong(state) {
  const { idx } = songOfDay(state);
  let next = idx;
  while (next === idx) next = Math.floor(Math.random() * SONGS.length);
  state.music.day = dayKey();
  state.music.idx = next;
  return SONGS[next];
}

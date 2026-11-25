// Song of the Day: upbeat pop & dance tracks for workouts.
// Links open a Spotify search for the song, so they never point at a wrong
// track ID. Add or remove songs freely: [artist, title, year].
import { dayKey } from './util.js';

export const SONGS = [
  // [artist, title, year] — newest first. 2025+ songs get a "NEW" badge.
  // 2025–2026
  ['Zara Larsson', 'Midnight Sun', 2025],
  ['Lady Gaga', 'Abracadabra', 2025],
  ['Lady Gaga', 'The Dead Dance', 2025],
  ['Tame Impala & JENNIE', 'Dracula', 2025],
  ['HUNTR/X', 'Golden', 2025],
  ['Benson Boone', 'Mystical Magical', 2025],
  ['Tate McRae', 'Sports car', 2025],
  ['Tate McRae', 'It’s ok I’m ok', 2025],
  ['Sabrina Carpenter', 'Manchild', 2025],
  ['KATSEYE', 'Gabriela', 2025],
  ['JENNIE', 'like JENNIE', 2025],
  ['Disco Lines & Tinashe', 'No Broke Boys', 2025],
  // VAVO country-dance remixes
  ['Toby Keith & VAVO', 'Should’ve Been A Cowboy (VAVO Remix)', 2025],
  ['Kenny Rogers & VAVO', 'The Gambler (VAVO Remix)', 2025],
  ['David Lee Murphy & VAVO', 'Dust On The Bottle (VAVO Remix)', 2025],
  ['Lee Brice & VAVO', 'One Of Them Girls (VAVO Remix)', 2025],
  ['Gareth & VAVO', 'Stampede (VAVO Remix)', 2025],
  ['Thomas Rhett & VAVO', 'Beautiful As U (VAVO Remix)', 2024],
  ['Priscilla Block & VAVO', 'My Bar (VAVO Remix)', 2023],
  // 2024
  ['ROSÉ & Bruno Mars', 'APT.', 2024],
  ['Sabrina Carpenter', 'Espresso', 2024],
  ['Chappell Roan', 'Good Luck, Babe!', 2024],
  ['Charli XCX', '360', 2024],
  ['Dua Lipa', 'Training Season', 2024],
  ['Dua Lipa', 'Illusion', 2024],
  ['Ariana Grande', 'yes, and?', 2024],
  ['Beyoncé', 'TEXAS HOLD ’EM', 2024],
  ['David Guetta & Sia', 'Beautiful People', 2024],
  ['Calvin Harris & Clementine Douglas', 'Blessings', 2024],
  ['Anyma & Ellie Goulding', 'Hypnotized', 2024],
  // 2023
  ['Chappell Roan', 'HOT TO GO!', 2023],
  ['Dua Lipa', 'Houdini', 2023],
  ['Tate McRae', 'greedy', 2023],
  ['Troye Sivan', 'Rush', 2023],
  ['Kylie Minogue', 'Padam Padam', 2023],
  ['Calvin Harris & Ellie Goulding', 'Miracle', 2023],
  ['Kenya Grace', 'Strangers', 2023],
  ['Dua Lipa', 'Dance the Night', 2023],
  ['Miley Cyrus', 'Flowers', 2023],
  // 2020–2022 favourites
  ['Beyoncé', 'BREAK MY SOUL', 2022],
  ['David Guetta & Bebe Rexha', 'I’m Good (Blue)', 2022],
  ['Purple Disco Machine & Sophie and the Giants', 'In the Dark', 2021],
  ['Lady Gaga & Ariana Grande', 'Rain On Me', 2020],
  ['Dua Lipa', 'Levitating', 2020],
  ['Dua Lipa', 'Physical', 2020],
  ['Joel Corry & MNEK', 'Head & Heart', 2020],
];

export const songKey = (s) => `${s[0]} — ${s[1]}`;

export function spotifySearchUrl(query) {
  return `https://open.spotify.com/search/${encodeURIComponent(query.replace(/[’‘]/g, "'"))}`;
}

export function songUrl(s) {
  // Main artist + title is the most reliable search.
  return spotifySearchUrl(`${s[0].split(' & ')[0]} ${s[1]}`);
}

export const isNew = (s) => (s[2] || 0) >= 2025;

/** Look up a saved favorite, even if it has since been removed from the list. */
export function songFromKey(k) {
  return SONGS.find((s) => songKey(s) === k) || k.split(' — ');
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

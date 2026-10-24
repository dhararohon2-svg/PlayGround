export const PLATFORMS = ['PC', 'PlayStation', 'Xbox', 'Switch', 'Mobile'];

export const GENRES = ['RPG', 'FPS', 'Roguelike', 'Adventure', 'Sports', 'Card', 'Cozy', 'Strategy', 'Indie'];

export const GENRE_ICONS = {
  RPG: 'sword',
  FPS: 'target',
  Roguelike: 'flame',
  Adventure: 'leaf',
  Sports: 'car',
  Card: 'cards',
  Cozy: 'sprout',
  Strategy: 'crown',
  Indie: 'ghost',
};

export const PLATFORM_ICONS = {
  PC: 'monitor',
  PlayStation: 'gamepad',
  Xbox: 'gamepad',
  Switch: 'tv',
  Mobile: 'phone',
};

export const MOODS = [
  { id: 'focused', label: 'Focused', note: 'In the zone' },
  { id: 'chill', label: 'Chill', note: 'Low-key session' },
  { id: 'competitive', label: 'Competitive', note: 'Ranked grind' },
  { id: 'cozy', label: 'Cozy', note: 'Comfort play' },
  { id: 'tilted', label: 'Tilted', note: 'Rough one' },
];

export const ACCENTS = [
  { id: 'lime', label: 'Volt', value: '#C9FF4D', ink: '#0D1503' },
  { id: 'cyan', label: 'Ion', value: '#5FE3D0', ink: '#00211C' },
  { id: 'violet', label: 'Nova', value: '#B79CFF', ink: '#170A32' },
  { id: 'coral', label: 'Ember', value: '#FF8A7A', ink: '#2C0D08' },
];

export const GAME_PALETTES = [
  { id: 'ember', a: '#FF8C5A', b: '#3A1710' },
  { id: 'rose', a: '#FF7A9C', b: '#3A1024' },
  { id: 'violet', a: '#B79CFF', b: '#1F1338' },
  { id: 'ocean', a: '#5FC7FF', b: '#0D2233' },
  { id: 'mint', a: '#7DE3B5', b: '#102E24' },
  { id: 'lime', a: '#C9E96B', b: '#232C10' },
  { id: 'gold', a: '#F2C879', b: '#332612' },
  { id: 'magenta', a: '#F17ADF', b: '#32102D' },
];

export const GAME_SEED = [
  { title: 'Elden Ring', platform: 'PC', genre: 'RPG', palette: 'gold', icon: 'sword' },
  { title: 'Hades II', platform: 'PC', genre: 'Roguelike', palette: 'rose', icon: 'flame' },
  { title: 'Valorant', platform: 'PC', genre: 'FPS', palette: 'ember', icon: 'target' },
  { title: 'Tears of the Kingdom', platform: 'Switch', genre: 'Adventure', palette: 'mint', icon: 'leaf' },
  { title: 'Rocket League', platform: 'PlayStation', genre: 'Sports', palette: 'ocean', icon: 'car' },
  { title: 'Balatro', platform: 'Mobile', genre: 'Card', palette: 'light', icon: 'cards' },
  { title: 'Stardew Valley', platform: 'Switch', genre: 'Cozy', palette: 'lime', icon: 'sprout' },
  { title: 'Apex Legends', platform: 'Xbox', genre: 'FPS', palette: 'magenta', icon: 'crosshair' },
];

GAME_SEED[5].palette = 'ember';

export function paletteFor(id) {
  return GAME_PALETTES.find((p) => p.id === id) || GAME_PALETTES[0];
}

function makeId(prefix, index) {
  return `${prefix}_${String(index + 1).padStart(3, '0')}`;
}

export function seedGames() {
  return GAME_SEED.map((game, index) => {
    const palette = paletteFor(game.palette);
    return {
      id: makeId('game', index),
      title: game.title,
      platform: game.platform,
      genre: game.genre,
      icon: game.icon === 'crosshair' ? 'target' : game.icon,
      color: palette.a,
      shade: palette.b,
      createdAt: new Date(2025, 0, index + 4).toISOString(),
    };
  });
}

const NOTES = [
  'Finally beat the boss I was stuck on.',
  'Clean ranked run with the squad.',
  'Short session before bed.',
  'Explored the north side of the map.',
  'Tried a new build and it actually worked.',
  'Co-op night with friends.',
  'Daily challenges only.',
  'One more run turned into five.',
  'Chasing the last achievement.',
  'Warmed up, then climbed a rank.',
];

const RATINGS = [4, 5, 3, 5, 4, 4, 5, 3, 4, 5, 2, 4];

export function seedSessions(now = Date.now()) {
  const templates = [
    [0, 95, 0, 1, 5, 'focused', 0],
    [1, 140, 1, 0, 4, 'competitive', 1],
    [2, 75, 2, 3, 5, 'chill', 2],
    [3, 110, 0, 0, 4, 'focused', 3],
    [4, 95, 3, 2, 4, 'chill', 4],
    [5, 60, 4, 0, 3, 'competitive', 5],
    [6, 120, 6, 6, 5, 'cozy', 6],
    [7, 45, 2, 2, 3, 'chill', 7],
    [9, 90, 0, 1, 5, 'focused', 8],
    [10, 65, 5, 3, 4, 'cozy', 9],
    [11, 120, 6, 7, 5, 'competitive', 0],
    [13, 75, 3, 4, 4, 'chill', 1],
    [14, 35, 2, 5, 3, 'chill', 2],
    [15, 80, 0, 0, 4, 'focused', 3],
    [16, 160, 6, 6, 5, 'cozy', 4],
    [18, 55, 4, 2, 4, 'competitive', 5],
    [19, 100, 1, 1, 5, 'focused', 6],
    [21, 130, 2, 3, 4, 'chill', 7],
    [22, 70, 5, 0, 3, 'competitive', 8],
    [23, 40, 3, 4, 4, 'chill', 9],
    [24, 90, 0, 2, 5, 'focused', 0],
    [26, 115, 6, 6, 5, 'cozy', 1],
    [27, 60, 4, 5, 3, 'chill', 2],
    [29, 150, 1, 0, 5, 'focused', 3],
    [30, 85, 3, 3, 4, 'chill', 4],
    [32, 45, 5, 2, 3, 'competitive', 5],
    [33, 70, 2, 4, 4, 'chill', 6],
    [34, 105, 0, 1, 5, 'focused', 7],
    [36, 125, 6, 6, 5, 'cozy', 8],
    [37, 55, 4, 5, 4, 'competitive', 9],
    [39, 95, 1, 0, 4, 'focused', 0],
    [40, 200, 7, 3, 5, 'cozy', 1],
    [42, 60, 3, 2, 3, 'chill', 2],
    [43, 80, 0, 4, 4, 'focused', 3],
    [45, 110, 6, 1, 5, 'competitive', 4],
    [46, 45, 2, 5, 3, 'chill', 5],
    [48, 65, 5, 0, 4, 'cozy', 6],
    [49, 90, 1, 3, 4, 'focused', 7],
    [51, 75, 3, 2, 4, 'chill', 8],
    [52, 130, 6, 6, 5, 'cozy', 9],
    [54, 50, 4, 4, 3, 'competitive', 0],
    [55, 85, 0, 1, 4, 'focused', 1],
    [57, 95, 2, 0, 5, 'chill', 2],
    [58, 60, 5, 5, 3, 'cozy', 3],
  ];

  const sessions = [];
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < templates.length; i += 1) {
    const [offset, minutes, gameIndex, ratingIndex, stars, mood, noteIndex] = templates[i];
    const [startHour, startMinute] = [18 + ((i * 3) % 5), (i * 17) % 60];
    let start;
    let end;

    if (offset === 0) {
      end = now - 22 * 60 * 1000;
      start = end - minutes * 60 * 1000;
    } else {
      start = new Date(today);
      start.setDate(start.getDate() - offset);
      start.setHours(startHour, startMinute, 0, 0);
      end = new Date(start.getTime() + minutes * 60 * 1000);
    }

    const game = seedGames()[gameIndex % GAME_SEED.length];
    sessions.push({
      id: makeId('session', i),
      gameId: game.id,
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
      durationSec: minutes * 60,
      rating: RATINGS[ratingIndex % RATINGS.length],
      mood,
      notes: NOTES[noteIndex % NOTES.length],
      source: 'seed',
    });
  }

  return sessions.sort((a, b) => new Date(b.start) - new Date(a.start));
}

export function createSeed(now = Date.now()) {
  return {
    version: 1,
    profile: {
      name: 'Alex Rivera',
      avatar: 'AR',
      weeklyGoalHours: 12,
      accent: 'lime',
      favorites: ['game_001', 'game_006'],
    },
    games: seedGames(),
    sessions: seedSessions(now),
    live: null,
    createdAt: now,
    updatedAt: now,
  };
}

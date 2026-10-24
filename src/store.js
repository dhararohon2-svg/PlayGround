import { createSeed, PLATFORMS, GENRES, paletteFor, ACCENTS } from './data.js';

export const STORAGE_KEY = 'playtrace.v1';

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function sanitizeState(raw, now = Date.now()) {
  if (!isObject(raw)) return createSeed(now);
  const seed = createSeed(now);
  const profile = isObject(raw.profile) ? raw.profile : {};
  const games = Array.isArray(raw.games) && raw.games.length
    ? raw.games.filter((game) => isObject(game) && game.id && game.title).map((game, index) => ({
      id: String(game.id),
      title: String(game.title).slice(0, 60),
      platform: PLATFORMS.includes(game.platform) ? game.platform : 'PC',
      genre: GENRES.includes(game.genre) ? game.genre : 'Indie',
      icon: typeof game.icon === 'string' ? game.icon : 'gamepad',
      color: typeof game.color === 'string' ? game.color : paletteFor('lime').a,
      shade: typeof game.shade === 'string' ? game.shade : paletteFor('lime').b,
      createdAt: game.createdAt || new Date(now).toISOString(),
      order: Number.isFinite(game.order) ? game.order : index,
    }))
    : seed.games;
  const gameIds = new Set(games.map((game) => game.id));
  const sessions = Array.isArray(raw.sessions)
    ? raw.sessions
      .filter((session) => isObject(session) && session.id && gameIds.has(session.gameId) && session.start)
      .map((session) => ({
        id: String(session.id),
        gameId: session.gameId,
        start: session.start,
        end: session.end || session.start,
        durationSec: Number.isFinite(session.durationSec) ? Math.max(0, session.durationSec) : 0,
        rating: Number.isFinite(session.rating) ? Math.min(5, Math.max(1, session.rating)) : 3,
        mood: typeof session.mood === 'string' ? session.mood : 'chill',
        notes: typeof session.notes === 'string' ? session.notes.slice(0, 400) : '',
        source: session.source || 'manual',
      }))
      .sort((a, b) => new Date(b.start) - new Date(a.start))
    : seed.sessions;

  const live = isObject(raw.live) && gameIds.has(raw.live.gameId)
    ? {
      gameId: raw.live.gameId,
      startedAt: Number(raw.live.startedAt) || now,
      accumulatedMs: Math.max(0, Number(raw.live.accumulatedMs) || 0),
      running: Boolean(raw.live.running),
      notes: typeof raw.live.notes === 'string' ? raw.live.notes.slice(0, 400) : '',
    }
    : null;

  return {
    version: 1,
    profile: {
      name: typeof profile.name === 'string' && profile.name.trim() ? profile.name.trim().slice(0, 40) : seed.profile.name,
      avatar: typeof profile.avatar === 'string' ? profile.avatar.slice(0, 3) : '',
      weeklyGoalHours: Math.min(60, Math.max(1, Number(profile.weeklyGoalHours) || seed.profile.weeklyGoalHours)),
      accent: ACCENTS.some((accent) => accent.id === profile.accent) ? profile.accent : 'lime',
      favorites: Array.isArray(profile.favorites) ? profile.favorites.filter((id) => gameIds.has(id)) : [],
    },
    games,
    sessions,
    live,
    createdAt: raw.createdAt || now,
    updatedAt: raw.updatedAt || now,
  };
}

export function loadState(storage, now = Date.now()) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return createSeed(now);
    return sanitizeState(JSON.parse(raw), now);
  } catch {
    return createSeed(now);
  }
}

export function saveState(storage, state) {
  state.updatedAt = Date.now();
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function exportState(state) {
  return JSON.stringify(state, null, 2);
}

export function parseImportedState(text, now = Date.now()) {
  const parsed = JSON.parse(text);
  if (!isObject(parsed) || !Array.isArray(parsed.games) || !Array.isArray(parsed.sessions)) {
    throw new Error('This backup is missing games or sessions.');
  }
  return sanitizeState(parsed, now);
}

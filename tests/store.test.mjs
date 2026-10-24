import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STORAGE_KEY,
  exportState,
  loadState,
  parseImportedState,
  sanitizeState,
  saveState,
} from '../src/store.js';
import { createSeed } from '../src/data.js';

const NOW = new Date('2026-10-23T21:00:00Z').getTime();

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, String(value)); },
    removeItem(key) { data.delete(key); },
    dump() { return Object.fromEntries(data); },
  };
}

test('loadState seeds a new install', () => {
  const state = loadState(memoryStorage(), NOW);
  assert.equal(state.games.length, 8);
  assert.equal(state.sessions.length, 44);
  assert.equal(state.profile.name, 'Alex Rivera');
  assert.equal(state.live, null);
  assert.ok(state.sessions.every((session) => state.games.some((game) => game.id === session.gameId)));
});

test('saveState and loadState round trip', () => {
  const storage = memoryStorage();
  const state = createSeed(NOW);
  state.profile.name = 'Sam';
  state.sessions = state.sessions.slice(0, 3);
  assert.equal(saveState(storage, state), true);
  assert.ok(storage.dump()[STORAGE_KEY]);
  const loaded = loadState(storage, NOW);
  assert.equal(loaded.profile.name, 'Sam');
  assert.equal(loaded.sessions.length, 3);
});

test('corrupt storage falls back to seed data', () => {
  const state = loadState(memoryStorage({ [STORAGE_KEY]: '{not json' }), NOW);
  assert.equal(state.sessions.length, 44);
  assert.equal(state.games.length, 8);
});

test('sanitizeState repairs malformed records', () => {
  const raw = {
    profile: { name: '  ', weeklyGoalHours: 999, accent: 'neon', favorites: ['game_001', 'nope'] },
    games: [
      { id: 'game_001', title: 'Game <One>', platform: 'PC', genre: 'RPG', color: '#fff', shade: '#000' },
      { id: 'bad' },
    ],
    sessions: [
      { id: 's1', gameId: 'game_001', start: '2026-10-20T10:00:00Z', end: '2026-10-20T11:00:00Z', durationSec: 3600, rating: 9, mood: 'focused', notes: 'x'.repeat(999) },
      { id: 's2', gameId: 'missing', start: '2026-10-20T10:00:00Z' },
    ],
    live: { gameId: 'missing', startedAt: 'nope' },
  };
  const state = sanitizeState(raw, NOW);
  assert.equal(state.games.length, 1);
  assert.equal(state.sessions.length, 1);
  assert.equal(state.sessions[0].rating, 5);
  assert.equal(state.sessions[0].notes.length, 400);
  assert.equal(state.profile.name, 'Alex Rivera');
  assert.equal(state.profile.weeklyGoalHours, 60);
  assert.equal(state.profile.accent, 'lime');
  assert.deepEqual(state.profile.favorites, ['game_001']);
  assert.equal(state.live, null);
});

test('empty session history is preserved on load', () => {
  const seed = createSeed(NOW);
  seed.sessions = [];
  const state = sanitizeState(seed, NOW);
  assert.deepEqual(state.sessions, []);
});

test('valid live session is restored', () => {
  const seed = createSeed(NOW);
  seed.live = {
    gameId: seed.games[0].id,
    startedAt: NOW - 5000,
    accumulatedMs: 1000,
    running: true,
    notes: 'still going',
  };
  const state = sanitizeState(seed, NOW);
  assert.equal(state.live.gameId, seed.games[0].id);
  assert.equal(state.live.running, true);
  assert.equal(state.live.notes, 'still going');
});

test('export and import produce an equivalent backup', () => {
  const seed = createSeed(NOW);
  const text = exportState(seed);
  const imported = parseImportedState(text, NOW);
  assert.equal(imported.games.length, seed.games.length);
  assert.equal(imported.sessions.length, seed.sessions.length);
  assert.equal(imported.profile.name, seed.profile.name);
});

test('import rejects backups without core collections', () => {
  assert.throws(() => parseImportedState('{"profile":{}}', NOW), /missing games or sessions/);
  assert.throws(() => parseImportedState('[]', NOW), /missing games or sessions/);
});

test('sanitize handles a non-object payload', () => {
  const state = sanitizeState(null, NOW);
  assert.equal(state.games.length, 8);
  assert.equal(state.sessions.length, 44);
});

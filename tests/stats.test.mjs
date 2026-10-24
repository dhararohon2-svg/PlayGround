import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addDays,
  averageSession,
  bestDay,
  currentWeek,
  dateKey,
  formatClock,
  formatDuration,
  groupSessionsByDay,
  longestStreak,
  moodMeta,
  previousWeek,
  rangeWindow,
  sessionSeconds,
  sessionsInRange,
  startOfDay,
  startOfWeek,
  streak,
  topGames,
  totalSeconds,
  trend,
  weekDays,
  weeklyTotals,
  weekHeatmap,
  traceWeek,
  achievements,
  insightList,
  breakdown,
} from '../src/stats.js';
import { createSeed } from '../src/data.js';

const NOW = new Date('2026-10-23T21:00:00Z').getTime();

function session(id, gameId, start, minutes, extra = {}) {
  return {
    id,
    gameId,
    start: new Date(start).toISOString(),
    end: new Date(new Date(start).getTime() + minutes * 60000).toISOString(),
    durationSec: minutes * 60,
    rating: 4,
    mood: 'focused',
    notes: '',
    ...extra,
  };
}

test('formatDuration handles seconds, minutes, and hours', () => {
  assert.equal(formatDuration(0), '0s');
  assert.equal(formatDuration(59), '59s');
  assert.equal(formatDuration(60), '1m');
  assert.equal(formatDuration(3599), '59m');
  assert.equal(formatDuration(3600), '1h');
  assert.equal(formatDuration(3660), '1h 1m');
  assert.equal(formatDuration(7200), '2h');
  assert.equal(formatDuration(5400, { compact: true }), '1.5h');
});

test('formatClock produces a stable HH:MM:SS timer', () => {
  assert.equal(formatClock(0), '00:00:00');
  assert.equal(formatClock(61), '00:01:01');
  assert.equal(formatClock(3661), '01:01:01');
  assert.equal(formatClock(360000), '100:00:00');
});

test('week helpers start on Monday', () => {
  const friday = new Date('2026-10-23T12:00:00').getTime();
  const monday = startOfWeek(friday);
  assert.equal(dateKey(monday), '2026-10-19');
  assert.equal(dateKey(addDays(monday, 4)), '2026-10-23');
  assert.equal(dateKey(addDays(monday, 7)), '2026-10-26');
});

test('sessionSeconds prefers the stored duration', () => {
  const item = session('a', 'g', '2026-10-20T10:00:00', 30);
  assert.equal(sessionSeconds(item), 1800);
  assert.equal(sessionSeconds({ ...item, durationSec: 0 }), 1800);
  assert.equal(sessionSeconds({ ...item, durationSec: 1200 }), 1200);
});

test('range and total helpers filter by start time', () => {
  const sessions = [
    session('a', 'g', '2026-10-19T10:00:00', 60),
    session('b', 'g', '2026-10-21T10:00:00', 30),
    session('c', 'g', '2026-10-26T10:00:00', 15),
  ];
  const week = currentWeek(sessions, NOW);
  assert.equal(week.length, 2);
  assert.equal(totalSeconds(week), 5400);
  assert.equal(sessionsInRange(sessions, startOfDay(NOW), addDays(startOfDay(NOW), 1)).length, 0);
  assert.equal(previousWeek(sessions, NOW).length, 0);
  assert.equal(averageSession(week), 2700);
});

test('streak counts consecutive days and tolerates a missing today', () => {
  const today = startOfDay(NOW);
  const sessions = [
    session('a', 'g', addDays(today, -1) + 20 * 3600000, 30),
    session('b', 'g', addDays(today, -2) + 20 * 3600000, 30),
    session('c', 'g', addDays(today, -3) + 20 * 3600000, 30),
    session('d', 'g', addDays(today, -6) + 20 * 3600000, 30),
  ];
  assert.equal(streak(sessions, NOW), 3);
  assert.equal(longestStreak(sessions), 3);
  assert.equal(streak([], NOW), 0);
  const withToday = [...sessions, session('e', 'g', today + 8 * 3600000, 15)];
  assert.equal(streak(withToday, NOW), 4);
});

test('weekDays and weeklyTotals build complete series', () => {
  const sessions = createSeed(NOW).sessions;
  const days = weekDays(sessions, NOW);
  assert.equal(days.length, 7);
  assert.equal(days.filter((day) => day.isToday).length, 1);
  assert.ok(days.reduce((sum, day) => sum + day.seconds, 0) > 0);
  const weeks = weeklyTotals(sessions, NOW, 8);
  assert.equal(weeks.length, 8);
  assert.equal(weeks[7].label, 'This wk');
  assert.ok(weeks[7].seconds > 0);
});

test('topGames ranks by playtime and ignores unknown games', () => {
  const games = [
    { id: 'g1', title: 'One' },
    { id: 'g2', title: 'Two' },
  ];
  const sessions = [
    session('a', 'g1', '2026-10-20T10:00:00', 30),
    session('b', 'g1', '2026-10-20T12:00:00', 30),
    session('c', 'g2', '2026-10-20T14:00:00', 90),
    session('d', 'missing', '2026-10-20T16:00:00', 300),
  ];
  const top = topGames(sessions, games, 5);
  assert.deepEqual(top.map((entry) => entry.gameId), ['g2', 'g1']);
  assert.equal(top[0].seconds, 5400);
  assert.equal(top[1].count, 2);
});

test('breakdown groups by a game field', () => {
  const games = [
    { id: 'g1', platform: 'PC', genre: 'RPG' },
    { id: 'g2', platform: 'Switch', genre: 'RPG' },
    { id: 'g3', platform: 'PC', genre: 'FPS' },
  ];
  const sessions = [
    session('a', 'g1', '2026-10-20T10:00:00', 30),
    session('b', 'g2', '2026-10-20T12:00:00', 45),
    session('c', 'g3', '2026-10-20T14:00:00', 60),
  ];
  assert.deepEqual(breakdown(sessions, games, 'platform').map((entry) => entry.label), ['PC', 'Switch']);
  assert.equal(breakdown(sessions, games, 'genre')[0].seconds, 4500);
});

test('trend reports direction and percentage', () => {
  assert.deepEqual(trend(120, 100), { direction: 'up', percent: 20 });
  assert.deepEqual(trend(80, 100), { direction: 'down', percent: 20 });
  assert.deepEqual(trend(100, 100), { direction: 'flat', percent: 0 });
  assert.deepEqual(trend(100, 0), { direction: 'up', percent: 100 });
});

test('heatmap returns 13 complete weeks with levels', () => {
  const sessions = createSeed(NOW).sessions;
  const heat = weekHeatmap(sessions, NOW, 13);
  assert.equal(heat.length, 13);
  assert.ok(heat.every((week) => week.days.length === 7));
  const cells = heat.flatMap((week) => week.days);
  assert.ok(cells.some((cell) => cell.level > 0));
  assert.ok(cells.every((cell) => cell.level >= 0 && cell.level <= 4));
});

test('traceWeek keeps session blocks inside the day', () => {
  const sessions = createSeed(NOW).sessions;
  const trace = traceWeek(sessions, NOW);
  assert.equal(trace.rows.length, 7);
  for (const row of trace.rows) {
    for (const block of row.items) {
      assert.ok(block.left >= 0 && block.left <= 100);
      assert.ok(block.width > 0);
      assert.ok(block.left + block.width <= 100.001);
    }
  }
});

test('groupSessionsByDay sorts newest first and totals correctly', () => {
  const sessions = [
    session('a', 'g', '2026-10-20T10:00:00', 30),
    session('b', 'g', '2026-10-21T10:00:00', 60),
    session('c', 'g', '2026-10-20T18:00:00', 15),
  ];
  const groups = groupSessionsByDay(sessions);
  assert.equal(groups[0].key, '2026-10-21');
  assert.equal(groups[1].sessions[0].id, 'c');
  assert.equal(groups[1].seconds, 2700);
});

test('bestDay and rangeWindow respect the requested window', () => {
  const sessions = createSeed(NOW).sessions;
  const best = bestDay(sessions, NOW, 30);
  assert.ok(best.seconds > 0);
  assert.equal(rangeWindow('week', NOW).label, 'This week');
  assert.equal(rangeWindow('month', NOW).label, 'Last 30 days');
  assert.equal(rangeWindow('all', NOW).label, 'All time');
});

test('achievements unlock from real session data', () => {
  const seed = createSeed(NOW);
  const unlocked = achievements(seed.sessions, seed.games);
  assert.equal(unlocked.length, 9);
  assert.ok(unlocked.find((item) => item.id === 'first').unlocked);
  assert.ok(unlocked.find((item) => item.id === 'marathon').unlocked);
  assert.ok(unlocked.every((item) => item.progress >= 0 && item.progress <= 1));
});

test('insights never throw on empty or full data', () => {
  assert.deepEqual(insightList([], [], NOW), []);
  const seed = createSeed(NOW);
  const insights = insightList(seed.sessions, seed.games, NOW);
  assert.ok(insights.length >= 2);
  assert.ok(insights.every((item) => typeof item.text === 'string' && item.text.length > 0));
});

test('moodMeta falls back for unknown moods', () => {
  assert.equal(moodMeta('focused').label, 'Focused');
  assert.equal(moodMeta('nonsense').label, 'Session');
});

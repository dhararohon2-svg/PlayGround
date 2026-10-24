export const DAY_MS = 24 * 60 * 60 * 1000;
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const WEEKDAYS_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function startOfDay(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function addDays(value, amount) {
  const date = new Date(value);
  date.setDate(date.getDate() + amount);
  return date.getTime();
}

export function startOfWeek(value) {
  const base = startOfDay(value);
  const weekday = (new Date(base).getDay() + 6) % 7;
  return addDays(base, -weekday);
}

export function dateKey(value) {
  const date = new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function sessionSeconds(session) {
  if (Number.isFinite(session.durationSec) && session.durationSec > 0) return session.durationSec;
  const start = new Date(session.start).getTime();
  const end = new Date(session.end).getTime();
  return Math.max(0, Math.round((end - start) / 1000));
}

export function sessionStart(session) {
  return new Date(session.start).getTime();
}

export function totalSeconds(sessions) {
  return sessions.reduce((sum, session) => sum + sessionSeconds(session), 0);
}

export function sessionsInRange(sessions, from, to) {
  return sessions.filter((session) => {
    const start = sessionStart(session);
    return start >= from && start < to;
  });
}

export function sessionsForGame(sessions, gameId) {
  return sessions.filter((session) => session.gameId === gameId);
}

export function formatDuration(seconds, options = {}) {
  const safe = Math.max(0, Math.round(seconds || 0));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  if (options.compact) {
    if (hours >= 1) return `${(safe / 3600).toFixed(hours >= 10 ? 0 : 1)}h`;
    if (safe >= 60) return `${minutes}m`;
    return `${safe}s`;
  }
  if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return `${safe}s`;
}

export function formatHours(seconds) {
  return `${(seconds / 3600).toFixed(1)}h`;
}

export function formatClock(seconds) {
  const safe = Math.max(0, Math.floor(seconds || 0));
  const hours = String(Math.floor(safe / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((safe % 3600) / 60)).padStart(2, '0');
  const secs = String(safe % 60).padStart(2, '0');
  return `${hours}:${minutes}:${secs}`;
}

export function formatDate(value, options = {}) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(new Date(value));
}

export function formatWeekday(value, long = false) {
  return new Intl.DateTimeFormat('en-US', { weekday: long ? 'long' : 'short' }).format(new Date(value));
}

export function formatTime(value) {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

export function formatRange(start, end) {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

export function dayLabel(value, now = Date.now()) {
  const key = dateKey(value);
  if (key === dateKey(now)) return 'Today';
  if (key === dateKey(addDays(now, -1))) return 'Yesterday';
  return formatWeekday(value, true);
}

export function currentWeek(sessions, now = Date.now()) {
  const start = startOfWeek(now);
  const end = addDays(start, 7);
  return sessionsInRange(sessions, start, end);
}

export function previousWeek(sessions, now = Date.now()) {
  const start = addDays(startOfWeek(now), -7);
  return sessionsInRange(sessions, start, addDays(start, 7));
}

export function weekDays(sessions, now = Date.now()) {
  const start = startOfWeek(now);
  return WEEKDAYS.map((label, index) => {
    const dayStart = addDays(start, index);
    const dayEnd = addDays(dayStart, 1);
    const items = sessionsInRange(sessions, dayStart, dayEnd);
    return {
      label,
      ts: dayStart,
      key: dateKey(dayStart),
      seconds: totalSeconds(items),
      count: items.length,
      isToday: dateKey(dayStart) === dateKey(now),
    };
  });
}

export function weeklyTotals(sessions, now = Date.now(), count = 8) {
  const thisWeek = startOfWeek(now);
  const weeks = [];
  for (let index = count - 1; index >= 0; index -= 1) {
    const start = addDays(thisWeek, -7 * index);
    const items = sessionsInRange(sessions, start, addDays(start, 7));
    weeks.push({
      start,
      label: index === 0 ? 'This wk' : formatDate(start),
      seconds: totalSeconds(items),
      count: items.length,
    });
  }
  return weeks;
}

export function streak(sessions, now = Date.now()) {
  const played = new Set(sessions.map((session) => dateKey(session.start)));
  let cursor = startOfDay(now);
  if (!played.has(dateKey(cursor))) cursor = addDays(cursor, -1);
  let count = 0;
  while (played.has(dateKey(cursor))) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
}

export function longestStreak(sessions) {
  const days = [...new Set(sessions.map((session) => dateKey(session.start)))].sort();
  let best = 0;
  let run = 0;
  let previous = null;
  for (const day of days) {
    const ts = new Date(`${day}T00:00:00`).getTime();
    run = previous !== null && ts - previous === DAY_MS ? run + 1 : 1;
    best = Math.max(best, run);
    previous = ts;
  }
  return best;
}

export function averageSession(sessions) {
  if (!sessions.length) return 0;
  return totalSeconds(sessions) / sessions.length;
}

export function topGames(sessions, games, limit = 4) {
  const map = new Map();
  for (const session of sessions) {
    const current = map.get(session.gameId) || { gameId: session.gameId, seconds: 0, count: 0 };
    current.seconds += sessionSeconds(session);
    current.count += 1;
    map.set(session.gameId, current);
  }
  const gameMap = new Map(games.map((game) => [game.id, game]));
  return [...map.values()]
    .filter((entry) => gameMap.has(entry.gameId))
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, limit)
    .map((entry) => ({ ...entry, game: gameMap.get(entry.gameId) }));
}

export function breakdown(sessions, games, field) {
  const gameMap = new Map(games.map((game) => [game.id, game]));
  const map = new Map();
  for (const session of sessions) {
    const game = gameMap.get(session.gameId);
    if (!game) continue;
    const key = game[field] || 'Other';
    const entry = map.get(key) || { label: key, seconds: 0, count: 0 };
    entry.seconds += sessionSeconds(session);
    entry.count += 1;
    map.set(key, entry);
  }
  return [...map.values()].sort((a, b) => b.seconds - a.seconds);
}

export function weekHeatmap(sessions, now = Date.now(), weeks = 13) {
  const currentStart = startOfWeek(now);
  const first = addDays(currentStart, -7 * (weeks - 1));
  const byDay = new Map();
  for (const session of sessions) {
    const key = dateKey(session.start);
    byDay.set(key, (byDay.get(key) || 0) + sessionSeconds(session));
  }
  const columns = [];
  for (let week = 0; week < weeks; week += 1) {
    const days = [];
    for (let day = 0; day < 7; day += 1) {
      const ts = addDays(first, week * 7 + day);
      const seconds = byDay.get(dateKey(ts)) || 0;
      days.push({
        ts,
        key: dateKey(ts),
        seconds,
        future: ts > now,
        level: seconds === 0 ? 0 : seconds < 1800 ? 1 : seconds < 3600 ? 2 : seconds < 7200 ? 3 : 4,
      });
    }
    columns.push({ start: addDays(first, week * 7), days });
  }
  return columns;
}

export function traceWeek(sessions, now = Date.now()) {
  const start = startOfWeek(now);
  const gameIds = [...new Set(sessions.map((session) => session.gameId))];
  const rows = WEEKDAYS.map((label, index) => {
    const dayStart = addDays(start, index);
    const dayEnd = addDays(dayStart, 1);
    const items = sessionsInRange(sessions, dayStart, dayEnd).map((session) => {
      const from = Math.max(sessionStart(session), dayStart);
      const to = Math.min(sessionStart(session) + sessionSeconds(session) * 1000, dayEnd);
      return {
        session,
        left: ((from - dayStart) / DAY_MS) * 100,
        width: Math.max(1.2, ((to - from) / DAY_MS) * 100),
      };
    });
    return { label, ts: dayStart, items, isToday: dateKey(dayStart) === dateKey(now) };
  });
  return { start, rows, gameIds };
}

export function bestDay(sessions, now = Date.now(), days = null) {
  const map = new Map();
  const from = days ? addDays(startOfDay(now), -(days - 1)) : 0;
  for (const session of sessions) {
    const start = sessionStart(session);
    if (start < from) continue;
    const key = dateKey(start);
    map.set(key, (map.get(key) || 0) + sessionSeconds(session));
  }
  let best = null;
  for (const [key, seconds] of map) {
    if (!best || seconds > best.seconds) best = { key, seconds };
  }
  return best;
}

export function trend(current, previous) {
  if (!previous) return current ? { direction: 'up', percent: 100 } : { direction: 'flat', percent: 0 };
  const percent = Math.round(((current - previous) / previous) * 100);
  if (percent === 0) return { direction: 'flat', percent: 0 };
  return { direction: percent > 0 ? 'up' : 'down', percent: Math.abs(percent) };
}

export function rangeWindow(range, now = Date.now()) {
  if (range === 'week') {
    return { from: startOfWeek(now), to: addDays(startOfWeek(now), 7), label: 'This week' };
  }
  if (range === 'month') {
    return { from: addDays(startOfDay(now), -29), to: addDays(startOfDay(now), 1), label: 'Last 30 days' };
  }
  return { from: 0, to: now + DAY_MS, label: 'All time' };
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function percent(value, total) {
  if (!total) return 0;
  return clamp((value / total) * 100, 0, 100);
}

export function uid(prefix = 'id') {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}${random}`;
}

export function moodMeta(id) {
  const moods = {
    focused: { label: 'Focused', icon: 'target' },
    chill: { label: 'Chill', icon: 'leaf' },
    competitive: { label: 'Competitive', icon: 'bolt' },
    cozy: { label: 'Cozy', icon: 'sprout' },
    tilted: { label: 'Tilted', icon: 'flame' },
  };
  return moods[id] || { label: 'Session', icon: 'gamepad' };
}

export function initials(name) {
  return String(name || 'Player')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'P';
}

export function groupSessionsByDay(sessions) {
  const groups = new Map();
  for (const session of sessions) {
    const key = dateKey(session.start);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(session);
  }
  return [...groups.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([key, items]) => ({
      key,
      ts: new Date(`${key}T00:00:00`).getTime(),
      sessions: items.sort((a, b) => sessionStart(b) - sessionStart(a)),
      seconds: totalSeconds(items),
    }));
}

export function achievements(sessions, games) {
  const total = totalSeconds(sessions);
  const bestStreak = longestStreak(sessions);
  const genres = new Set(games.filter((game) => sessions.some((s) => s.gameId === game.id)).map((game) => game.genre));
  const longest = sessions.reduce((max, session) => Math.max(max, sessionSeconds(session)), 0);
  const night = sessions.some((session) => {
    const hour = new Date(session.start).getHours();
    return hour >= 22 || hour < 4;
  });
  const weekend = sessions.filter((session) => {
    const day = new Date(session.start).getDay();
    return day === 0 || day === 6;
  }).length;
  const playedGames = new Set(sessions.map((session) => session.gameId)).size;

  return [
    { id: 'first', label: 'First trace', detail: 'Log your first session', icon: 'bolt', unlocked: sessions.length > 0, progress: Math.min(1, sessions.length) },
    { id: 'streak3', label: 'Momentum', detail: 'Play 3 days in a row', icon: 'flame', unlocked: bestStreak >= 3, progress: Math.min(1, bestStreak / 3) },
    { id: 'streak7', label: 'Week locked', detail: 'Play 7 days in a row', icon: 'calendar', unlocked: bestStreak >= 7, progress: Math.min(1, bestStreak / 7) },
    { id: 'hours50', label: '50 club', detail: 'Track 50 hours total', icon: 'clock', unlocked: total >= 50 * 3600, progress: Math.min(1, total / (50 * 3600)) },
    { id: 'marathon', label: 'Marathon', detail: 'A single 3-hour session', icon: 'trophy', unlocked: longest >= 3 * 3600, progress: Math.min(1, longest / (3 * 3600)) },
    { id: 'explorer', label: 'Explorer', detail: 'Play 4 different genres', icon: 'grid', unlocked: genres.size >= 4, progress: Math.min(1, genres.size / 4) },
    { id: 'nightowl', label: 'Night owl', detail: 'Start a session after 10pm', icon: 'moon', unlocked: night, progress: night ? 1 : 0 },
    { id: 'weekend', label: 'Weekend warrior', detail: '5 weekend sessions', icon: 'shield', unlocked: weekend >= 5, progress: Math.min(1, weekend / 5) },
    { id: 'library', label: 'Curator', detail: 'Play 6 different games', icon: 'library', unlocked: playedGames >= 6, progress: Math.min(1, playedGames / 6) },
  ];
}

export function insightList(sessions, games, now = Date.now()) {
  const thisWeek = currentWeek(sessions, now);
  const lastWeek = previousWeek(sessions, now);
  const currentSeconds = totalSeconds(thisWeek);
  const previousSeconds = totalSeconds(lastWeek);
  const top = topGames(thisWeek, games, 1)[0];
  const longest = sessions.reduce((best, session) => {
    if (!best) return session;
    return sessionSeconds(session) > sessionSeconds(best) ? session : best;
  }, null);
  const best = bestDay(sessions, now, 30);
  const insights = [];

  if (currentSeconds || previousSeconds) {
    const change = trend(currentSeconds, previousSeconds);
    if (change.direction === 'flat') {
      insights.push({ icon: 'stats', text: `You're tracking the same playtime as last week — ${formatDuration(currentSeconds)} so far.` });
    } else {
      insights.push({
        icon: change.direction === 'up' ? 'up' : 'down',
        text: `${change.direction === 'up' ? 'Up' : 'Down'} ${change.percent}% vs last week (${formatDuration(currentSeconds)} tracked).`,
        tone: change.direction,
      });
    }
  }
  if (top) {
    insights.push({ icon: 'target', text: `${top.game.title} leads this week with ${formatDuration(top.seconds)} across ${top.count} session${top.count === 1 ? '' : 's'}.` });
  }
  if (best && best.seconds > 0) {
    insights.push({ icon: 'calendar', text: `Your biggest day this month was ${formatDate(new Date(`${best.key}T00:00:00`), { weekday: 'short' })} with ${formatDuration(best.seconds)}.` });
  }
  if (longest) {
    const game = games.find((item) => item.id === longest.gameId);
    if (game) insights.push({ icon: 'trophy', text: `Longest trace: ${formatDuration(sessionSeconds(longest))} in ${game.title}.` });
  }
  return insights;
}

import { icon, gameIcon, logoMark } from './icons.js';
import {
  PLATFORMS,
  GENRES,
  GENRE_ICONS,
  PLATFORM_ICONS,
  MOODS,
  ACCENTS,
  GAME_PALETTES,
  GAME_SEED,
  createSeed,
} from './data.js';
import {
  loadState,
  saveState,
  parseImportedState,
  exportState,
} from './store.js';
import * as S from './stats.js';

const VIEWS = ['home', 'sessions', 'games', 'stats'];
const NAV = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'sessions', label: 'Sessions', icon: 'sessions' },
  { id: 'games', label: 'Games', icon: 'games' },
  { id: 'stats', label: 'Stats', icon: 'stats' },
];
const DONUT_COLORS = ['var(--accent)', '#5FE3D0', '#B79CFF', '#FF8A7A', '#F2C879', '#7DE3B5'];
const EMPTY = '—';
const NATIVE = Boolean(window.PlayTraceAndroid);

const storage = (() => {
  try {
    localStorage.setItem('playtrace.probe', '1');
    localStorage.removeItem('playtrace.probe');
    return localStorage;
  } catch {
    return {
      _data: new Map(),
      getItem(key) { return this._data.get(key) ?? null; },
      setItem(key, value) { this._data.set(key, String(value)); },
      removeItem(key) { this._data.delete(key); },
    };
  }
})();

const state = loadState(storage);

const ui = {
  view: 'home',
  sessionRange: 'all',
  sessionPlatform: 'all',
  sessionQuery: '',
  statsRange: 'week',
  modal: null,
  installPrompt: null,
  toastTimer: null,
  toastCounter: 0,
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function gameMap() {
  return new Map(state.games.map((game) => [game.id, game]));
}

function getGame(id) {
  return gameMap().get(id);
}

function viewFromHash() {
  const match = location.hash.match(/^#\/([a-z]+)/);
  return match && VIEWS.includes(match[1]) ? match[1] : 'home';
}

function applyAccent(id = state.profile.accent) {
  const accent = ACCENTS.find((item) => item.id === id) || ACCENTS[0];
  const rgb = hexToRgb(accent.value);
  const root = document.documentElement;
  root.style.setProperty('--accent', accent.value);
  root.style.setProperty('--accent-ink', accent.ink);
  root.style.setProperty('--accent-soft', `rgba(${rgb.join(', ')}, 0.12)`);
  root.style.setProperty('--accent-line', `rgba(${rgb.join(', ')}, 0.32)`);
}

function hexToRgb(hex) {
  const value = hex.replace('#', '');
  return [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16));
}

function coverStyle(game) {
  return `--g1:${esc(game.color)};--g2:${esc(game.shade)}`;
}

function avatarHtml(size = '') {
  const initials = S.initials(state.profile.name);
  return `<span class="avatar ${size}">${esc(initials)}</span>`;
}

function save() {
  saveState(storage, state);
}

function render() {
  applyAccent();
  renderRail();
  renderTopbar();
  renderView();
  renderTabbar();
  renderLiveDock();
  renderFooter();
}

function renderFooter() {
  const footer = $('.app-footer');
  if (!footer) return;
  footer.innerHTML = `<span>PlayTrace · local-first session tracking</span><span class="app-footer-dot" aria-hidden="true"></span><span>v1.0 · ${state.sessions.length} sessions stored</span>`;
}

function renderRail() {
  const rail = $('#rail');
  if (!rail) return;
  const now = Date.now();
  const week = S.currentWeek(state.sessions, now);
  const weekSeconds = S.totalSeconds(week);
  const goalSeconds = state.profile.weeklyGoalHours * 3600;
  const pct = S.percent(weekSeconds, goalSeconds);
  const remaining = Math.max(0, goalSeconds - weekSeconds);

  const links = NAV.map((item) => {
    const count = item.id === 'sessions' ? state.sessions.length : item.id === 'games' ? state.games.length : null;
    return `<a class="nav-link ${ui.view === item.id ? 'active' : ''}" href="#/${item.id}" data-nav="${item.id}">
      ${icon(item.icon)}
      <span>${item.label}</span>
      ${count !== null ? `<span class="nav-count">${count}</span>` : ''}
    </a>`;
  }).join('');

  rail.innerHTML = `
    <a class="brand" href="#/home" aria-label="PlayTrace home">
      ${logoMark('rail')}
      <span>
        <span class="brand-word">PlayTrace</span>
        <span class="brand-sub">Session tracker</span>
      </span>
    </a>
    <div class="nav-group">
      <span class="nav-label">Workspace</span>
      ${links}
    </div>
    <div class="rail-spacer"></div>
    <div class="rail-goal">
      <div class="rail-goal-label">
        <span>Weekly goal</span>
        ${icon('target')}
      </div>
      <div class="rail-goal-value">${S.formatDuration(weekSeconds)} <span>/ ${state.profile.weeklyGoalHours}h</span></div>
      <div class="rail-progress"><span style="width:${pct}%"></span></div>
      <div class="rail-goal-foot">
        <span>${remaining > 0 ? `${S.formatDuration(remaining)} to go` : 'Goal complete'}</span>
        <span>${Math.round(pct)}%</span>
      </div>
    </div>
    <button class="rail-profile" type="button" data-action="open-settings" aria-label="Open profile settings">
      ${avatarHtml()}
      <span>
        <span class="rail-profile-name">${esc(state.profile.name)}</span>
        <span class="rail-profile-sub">${S.streak(state.sessions, now)}-day streak</span>
      </span>
      ${icon('sliders')}
    </button>`;
}

function renderTopbar() {
  const topbar = $('#topbar');
  if (!topbar) return;
  const now = new Date();
  const date = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(now);
  const total = S.streak(state.sessions, Date.now());
  const installed = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const installButton = ui.installPrompt && !NATIVE
    ? `<button class="btn btn--ghost btn--sm" type="button" data-action="install-app">${icon('install')} Install app</button>`
    : '';
  topbar.innerHTML = `
    <div class="topbar-left">
      <div class="mobile-brand">
        ${logoMark('mobile')}
        <span class="mobile-brand-word">PlayTrace</span>
      </div>
      <div class="topbar-date">
        <strong>${esc(date)}</strong>
        <span>${state.sessions.length} sessions · ${S.formatDuration(S.totalSeconds(state.sessions))} tracked</span>
      </div>
    </div>
    <div class="topbar-actions">
      <span class="status-chip"><span class="status-dot"></span>${installed ? 'Installed app' : 'Offline ready'}</span>
      <span class="streak-chip" title="${total}-day streak">${icon('flame')} ${total} day${total === 1 ? '' : 's'}</span>
      ${installButton}
      <button class="btn btn--ghost btn--sm hide-sm" type="button" data-action="log-session">${icon('plus')} Log session</button>
      <button class="avatar avatar--sm" type="button" data-action="open-settings" aria-label="Open profile settings">${esc(S.initials(state.profile.name))}</button>
    </div>`;
}

function renderTabbar() {
  const tabbar = $('#tabbar');
  if (!tabbar) return;
  const items = ['home', 'sessions', 'start', 'games', 'stats'].map((id) => {
    if (id === 'start') {
      return `<div class="tab-fab"><button type="button" data-action="start-session" aria-label="Start a session">${icon('play')}<span>Start</span></button></div>`;
    }
    const item = NAV.find((nav) => nav.id === id);
    return `<a class="tab-link ${ui.view === id ? 'is-active' : ''}" href="#/${id}">
      ${icon(item.icon)}<span>${item.label}</span>
    </a>`;
  }).join('');
  tabbar.innerHTML = items;
}

function pageHead({ kicker, title, sub, actions = '', kickerIcon = 'sparkles' }) {
  return `<header class="page-head">
    <div>
      <span class="page-kicker">${icon(kickerIcon)} ${kicker}</span>
      <h1>${title}</h1>
      ${sub ? `<p class="page-sub">${sub}</p>` : ''}
    </div>
    ${actions ? `<div class="page-actions">${actions}</div>` : ''}
  </header>`;
}

function renderView() {
  const host = $('#view');
  if (!host) return;
  if (ui.modal) return;
  const views = { home: homeView, sessions: sessionsView, games: gamesView, stats: statsView };
  host.innerHTML = (views[ui.view] || homeView)();
}

function greeting(now = new Date()) {
  const hour = now.getHours();
  if (hour < 5) return 'Late night session?';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function homeView() {
  const now = Date.now();
  const week = S.currentWeek(state.sessions, now);
  const previous = S.previousWeek(state.sessions, now);
  const weekSeconds = S.totalSeconds(week);
  const previousSeconds = S.totalSeconds(previous);
  const todaySeconds = S.totalSeconds(S.sessionsInRange(state.sessions, S.startOfDay(now), S.addDays(S.startOfDay(now), 1)));
  const todaySessions = S.sessionsInRange(state.sessions, S.startOfDay(now), S.addDays(S.startOfDay(now), 1));
  const days = S.weekDays(state.sessions, now);
  const goalSeconds = state.profile.weeklyGoalHours * 3600;
  const goalPct = S.percent(weekSeconds, goalSeconds);
  const remaining = Math.max(0, goalSeconds - weekSeconds);
  const currentStreak = S.streak(state.sessions, now);
  const bestStreak = S.longestStreak(state.sessions);
  const weekTrend = S.trend(weekSeconds, previousSeconds);
  const monthSessions = S.sessionsInRange(state.sessions, S.addDays(S.startOfDay(now), -29), S.addDays(S.startOfDay(now), 1));
  const top = S.topGames(monthSessions, state.games, 4);
  const recent = state.sessions.slice(0, 4);
  const insight = S.insightList(state.sessions, state.games, now)[0];
  const avg = S.averageSession(week);
  const today = days.find((day) => day.isToday);
  const firstName = state.profile.name.split(/\s+/)[0];
  const live = state.live ? getGame(state.live.gameId) : null;
  const trendClass = weekTrend.direction === 'down' ? 'delta--down' : weekTrend.direction === 'flat' ? 'delta--flat' : '';

  const kpis = `
    <div class="kpi-grid">
      <article class="kpi">
        <div class="kpi-top"><span>This week</span><span class="kpi-icon">${icon('clock')}</span></div>
        <div class="kpi-value">${S.formatDuration(weekSeconds)}</div>
        <div class="kpi-sub">
          <span class="delta ${trendClass}">${icon(weekTrend.direction === 'down' ? 'down' : weekTrend.direction === 'up' ? 'up' : 'stats')} ${weekTrend.percent}%</span>
          <span>vs last week</span>
        </div>
      </article>
      <article class="kpi">
        <div class="kpi-top"><span>Today</span><span class="kpi-icon">${icon('bolt')}</span></div>
        <div class="kpi-value">${S.formatDuration(todaySeconds)}</div>
        <div class="kpi-sub"><span>${todaySessions.length} session${todaySessions.length === 1 ? '' : 's'} logged</span></div>
      </article>
      <article class="kpi">
        <div class="kpi-top"><span>Avg session</span><span class="kpi-icon">${icon('timer')}</span></div>
        <div class="kpi-value">${week.length ? S.formatDuration(avg) : '—'}</div>
        <div class="kpi-sub"><span>${week.length} sessions this week</span></div>
      </article>
      <article class="kpi">
        <div class="kpi-top"><span>Streak</span><span class="kpi-icon">${icon('flame')}</span></div>
        <div class="kpi-value">${currentStreak} <small>day${currentStreak === 1 ? '' : 's'}</small></div>
        <div class="kpi-sub"><span>Best run: ${bestStreak} days</span></div>
      </article>
    </div>`;

  const goalCard = `
    <section class="card span-5 goal-card">
      <div class="card-head">
        <div>
          <h2>Weekly goal</h2>
          <p>Keep the trace alive</p>
        </div>
        <span class="streak-chip">${icon('flame')} ${currentStreak} day streak</span>
      </div>
      <div class="goal-main">
        <div class="ring" role="img" aria-label="${Math.round(goalPct)} percent of weekly goal complete">
          <svg viewBox="0 0 120 120">
            <circle class="ring-track" cx="60" cy="60" r="52"/>
            <circle class="ring-fill" cx="60" cy="60" r="52" pathLength="100" stroke-dasharray="${Math.min(100, goalPct)} 100"/>
          </svg>
          <div class="ring-center"><strong>${Math.round(goalPct)}%</strong><span>of goal</span></div>
        </div>
        <div class="goal-copy">
          <span class="goal-eyebrow">${icon('target')} ${state.profile.weeklyGoalHours}h target</span>
          <div class="goal-hours">${S.formatDuration(weekSeconds)} <span>/ ${state.profile.weeklyGoalHours}h</span></div>
          <p class="goal-caption">${remaining > 0 ? `${S.formatDuration(remaining)} left to hit this week's target.` : 'Target cleared. Everything from here is bonus playtime.'}</p>
        </div>
      </div>
      <div class="goal-actions">
        <button class="btn btn--primary" type="button" data-action="start-session">${icon(live ? 'pause' : 'play')} ${live ? 'Session live' : 'Start session'}</button>
        <button class="btn btn--ghost" type="button" data-action="log-session">${icon('plus')} Log manually</button>
      </div>
    </section>`;

  const chartCard = `
    <section class="card span-7 chart-card">
      <div class="card-head">
        <div>
          <h2>Weekly rhythm</h2>
          <p>Playtime by day · Mon to Sun</p>
        </div>
        <div class="card-side">
          <span class="status-dot"></span>
          <span>Today ${today ? S.formatDuration(today.seconds) : '0m'}</span>
        </div>
      </div>
      ${barChart(days, { tooltipLabel: (day) => `${day.label} · ${S.formatDuration(day.seconds)}` })}
      <div class="chart-legend">
        <span class="legend-item"><span class="legend-swatch"></span> Today</span>
        <span class="legend-item"><span class="legend-swatch legend-swatch--muted"></span> Playtime</span>
        <span class="legend-item" style="margin-left:auto">${week.length} sessions · ${S.formatDuration(weekSeconds)}</span>
      </div>
    </section>`;

  const topCard = `
    <section class="card span-5">
      <div class="card-head">
        <div>
          <h2>Top games</h2>
          <p>Last 30 days</p>
        </div>
        <a class="text-link" href="#/games">Library ${icon('arrow')}</a>
      </div>
      <div class="game-list">
        ${top.length ? top.map((entry) => gameRow(entry, top[0].seconds)).join('') : `<div class="recent-empty">${icon('games')} Play a session to populate your top games.</div>`}
      </div>
    </section>`;

  const recentCard = `
    <section class="card span-7">
      <div class="card-head">
        <div>
          <h2>Recent traces</h2>
          <p>Your latest logged sessions</p>
        </div>
        <a class="text-link" href="#/sessions">View all ${icon('arrow')}</a>
      </div>
      <div class="recent-list">
        ${recent.length ? recent.map((session) => recentItem(session)).join('') : `<div class="recent-empty">${icon('sessions')} No sessions yet. Start the timer or log one manually.</div>`}
      </div>
    </section>`;

  return `
    ${pageHead({
      kicker: 'Overview',
      title: `${greeting()}, <em>${esc(firstName)}</em>`,
      sub: `Here's the shape of your play this week. ${currentStreak > 1 ? `You're on a ${currentStreak}-day streak.` : 'Start a session to build a streak.'}`,
      actions: `
        <button class="btn btn--ghost" type="button" data-action="log-session">${icon('plus')} Log session</button>
        <button class="btn btn--primary" type="button" data-action="start-session">${icon('play')} Start session</button>`,
      kickerIcon: 'sparkles',
    })}
    ${kpis}
    <div class="dash-grid">
      ${goalCard}
      ${chartCard}
      ${topCard}
      ${recentCard}
      ${insight ? `<div class="insight-strip span-12">${icon(insight.icon)}<span>${esc(insight.text)}</span></div>` : ''}
    </div>`;
}

function barChart(items, options = {}) {
  const max = Math.max(...items.map((item) => item.seconds), 1);
  return `<div class="bar-stage">
    <div class="bar-grid"><span></span><span></span><span></span><span></span></div>
    <div class="bar-cols" style="grid-template-columns:repeat(${items.length}, minmax(0, 1fr))">
      ${items.map((item) => {
        const height = item.seconds ? Math.max(3, Math.round((item.seconds / max) * 100)) : 0;
        const tooltip = options.tooltipLabel ? options.tooltipLabel(item) : `${item.label} · ${S.formatDuration(item.seconds)}`;
        return `<div class="bar-col ${item.isToday ? 'is-today' : ''}" title="${esc(tooltip)}">
          <div class="bar-shell"><div class="bar ${item.isToday ? 'is-today' : ''} ${item.seconds ? '' : 'is-empty'}" style="height:${height}%"></div></div>
          <span class="bar-day">${esc(item.label)}</span>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

function gameRow(entry, maxSeconds) {
  const pct = S.percent(entry.seconds, maxSeconds || 1);
  return `<div class="game-row">
    <div class="mini-cover" style="${coverStyle(entry.game)}">${gameIcon(entry.game.icon)}</div>
    <div class="game-row-main">
      <div class="game-row-title">${esc(entry.game.title)}</div>
      <div class="game-row-meta">${esc(entry.game.genre)} · ${entry.count} session${entry.count === 1 ? '' : 's'}</div>
      <div class="mini-progress"><span style="width:${pct}%;background:${esc(entry.game.color)}"></span></div>
    </div>
    <div class="game-row-value">${S.formatDuration(entry.seconds)}<span>${Math.round(pct)}% of top</span></div>
  </div>`;
}

function recentItem(session) {
  const game = getGame(session.gameId);
  if (!game) return '';
  return `<a class="recent-item" href="#/sessions">
    <div class="mini-cover mini-cover--lg" style="${coverStyle(game)}">${gameIcon(game.icon)}</div>
    <div class="recent-main">
      <div class="recent-title">${esc(game.title)}</div>
      <div class="recent-meta">${S.dayLabel(session.start)} · ${S.formatRange(session.start, session.end)}</div>
    </div>
    <div class="recent-side">
      <span class="recent-duration">${S.formatDuration(S.sessionSeconds(session))}</span>
      ${starRow(session.rating)}
    </div>
  </a>`;
}

function starRow(rating) {
  const safe = Math.round(Number(rating) || 0);
  return `<span class="stars" aria-label="${safe} out of 5">${[1, 2, 3, 4, 5].map((value) => `<span class="${value <= safe ? 'is-on' : ''}">${icon('star')}</span>`).join('')}</span>`;
}

function sessionsView() {
  const now = Date.now();
  const games = gameMap();
  let filtered = [...state.sessions];

  if (ui.sessionRange === 'week') {
    filtered = S.sessionsInRange(filtered, S.startOfWeek(now), S.addDays(S.startOfWeek(now), 7));
  }
  if (ui.sessionRange === 'month') {
    filtered = S.sessionsInRange(filtered, S.addDays(S.startOfDay(now), -29), S.addDays(S.startOfDay(now), 1));
  }
  if (ui.sessionPlatform !== 'all') {
    filtered = filtered.filter((session) => games.get(session.gameId)?.platform === ui.sessionPlatform);
  }
  if (ui.sessionQuery.trim()) {
    const query = ui.sessionQuery.trim().toLowerCase();
    filtered = filtered.filter((session) => {
      const game = games.get(session.gameId);
      return [game?.title, game?.genre, game?.platform, session.notes, session.mood]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }

  const groups = S.groupSessionsByDay(filtered);
  const total = S.totalSeconds(filtered);
  const platformSet = [...new Set(state.games.map((game) => game.platform))];
  const rangeButtons = [
    ['all', 'All'],
    ['week', 'This week'],
    ['month', '30 days'],
  ].map(([value, label]) => `<button type="button" class="${ui.sessionRange === value ? 'is-active' : ''}" data-action="set-session-range" data-range="${value}">${label}</button>`).join('');

  const list = groups.length
    ? `<div class="session-groups">
        ${groups.map((group) => `
          <div class="session-group">
            <div class="session-group-head">
              <h3>${esc(S.dayLabel(group.ts))}</h3>
              <span>${S.formatDate(group.ts, { month: 'short', day: 'numeric' })}</span>
              <span class="group-total">${S.formatDuration(group.seconds)}</span>
            </div>
            ${group.sessions.map((session) => sessionItem(session)).join('')}
          </div>`).join('')}
      </div>`
    : `<div class="empty-state">
        <div class="empty-icon">${icon('search')}</div>
        <h3>No sessions match</h3>
        <p>Try a different range or clear the search. You can also log a brand-new session.</p>
        <button class="btn btn--primary" type="button" data-action="log-session">${icon('plus')} Log session</button>
      </div>`;

  return `
    ${pageHead({
      kicker: 'Journal',
      title: 'Session log',
      sub: `${filtered.length} session${filtered.length === 1 ? '' : 's'} · ${S.formatDuration(total)} tracked${ui.sessionRange === 'all' ? ' all time' : ui.sessionRange === 'week' ? ' this week' : ' in 30 days'}.`,
      actions: `<button class="btn btn--primary" type="button" data-action="log-session">${icon('plus')} Log session</button>`,
      kickerIcon: 'sessions',
    })}
    <div class="filters">
      <div class="segmented" role="group" aria-label="Session range">${rangeButtons}</div>
      <select class="select" id="session-platform" aria-label="Filter by platform">
        <option value="all">All platforms</option>
        ${platformSet.map((platform) => `<option value="${esc(platform)}" ${ui.sessionPlatform === platform ? 'selected' : ''}>${esc(platform)}</option>`).join('')}
      </select>
      <div class="search-field">
        ${icon('search')}
        <input id="session-search" type="search" placeholder="Search games, notes, moods" value="${esc(ui.sessionQuery)}" autocomplete="off">
      </div>
    </div>
    ${list}`;
}

function sessionItem(session) {
  const game = getGame(session.gameId);
  if (!game) return '';
  const mood = S.moodMeta(session.mood);
  return `<article class="session-item">
    <div class="mini-cover" style="${coverStyle(game)}">${gameIcon(game.icon)}</div>
    <div class="session-main">
      <div class="session-title"><span class="session-title-text">${esc(game.title)}</span> <span class="mood-pill">${icon(mood.icon)} ${esc(mood.label)}</span></div>
      <div class="session-meta">${S.dayLabel(session.start)} · ${S.formatRange(session.start, session.end)} · ${esc(game.platform)}</div>
      ${session.notes ? `<div class="session-notes">${esc(session.notes)}</div>` : ''}
    </div>
    <div class="session-side">
      <div class="session-duration">
        <strong>${S.formatDuration(S.sessionSeconds(session))}</strong>
        <span>${starRow(session.rating)}</span>
      </div>
      <div class="session-tools">
        <button class="icon-btn" type="button" data-action="edit-session" data-id="${esc(session.id)}" aria-label="Edit session">${icon('edit')}</button>
        <button class="icon-btn icon-btn--danger" type="button" data-action="delete-session" data-id="${esc(session.id)}" aria-label="Delete session">${icon('trash')}</button>
      </div>
    </div>
  </article>`;
}

function gamesView() {
  const now = Date.now();
  const map = new Map(state.sessions.reduce((entries, session) => {
    const current = entries.get(session.gameId) || { seconds: 0, count: 0, last: 0 };
    current.seconds += S.sessionSeconds(session);
    current.count += 1;
    current.last = Math.max(current.last, new Date(session.start).getTime());
    entries.set(session.gameId, current);
    return entries;
  }, new Map()));

  const enriched = state.games.map((game) => ({
    game,
    ...(map.get(game.id) || { seconds: 0, count: 0, last: 0 }),
    favorite: state.profile.favorites.includes(game.id),
  })).sort((a, b) => {
    if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
    if (b.seconds !== a.seconds) return b.seconds - a.seconds;
    return a.game.title.localeCompare(b.game.title);
  });

  const totalSeconds = S.totalSeconds(state.sessions);
  const maxSeconds = Math.max(...enriched.map((entry) => entry.seconds), 1);
  const installed = [...state.games].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const mostPlayed = enriched[0];

  const cards = enriched.length
    ? enriched.map((entry) => {
      const { game, seconds, count, favorite } = entry;
      const pct = S.percent(seconds, maxSeconds);
      return `<article class="game-card">
        <div class="game-cover" style="${coverStyle(game)}">
          <div class="cover-actions">
            <button class="icon-btn ${favorite ? 'is-fav' : ''}" type="button" data-action="toggle-favorite" data-id="${esc(game.id)}" aria-label="${favorite ? 'Remove from favorites' : 'Add to favorites'}">${icon('star')}</button>
            <button class="icon-btn" type="button" data-action="edit-game" data-id="${esc(game.id)}" aria-label="Edit game">${icon('edit')}</button>
            <button class="icon-btn" type="button" data-action="delete-game" data-id="${esc(game.id)}" aria-label="Delete game">${icon('trash')}</button>
          </div>
          <span class="cover-glyph">${gameIcon(game.icon)}</span>
          <h3>${esc(game.title)}</h3>
          <div class="cover-tags"><span class="cover-tag">${esc(game.platform)}</span><span class="cover-tag">${esc(game.genre)}</span></div>
        </div>
        <div class="game-card-body">
          <div class="game-stats">
            <div class="game-hours">${S.formatDuration(seconds)} <span>played</span></div>
            <div class="game-sessions"><strong>${count}</strong>session${count === 1 ? '' : 's'}</div>
          </div>
          <div class="game-bar"><span style="width:${Math.max(seconds ? 2 : 0, pct)}%"></span></div>
        </div>
      </article>`;
    }).join('')
    : `<div class="empty-state span-12">
        <div class="empty-icon">${icon('games')}</div>
        <h3>Your library is empty</h3>
        <p>Add the games you play to start tracing sessions, playtime, and patterns.</p>
        <button class="btn btn--primary" type="button" data-action="add-game">${icon('plus')} Add a game</button>
      </div>`;

  return `
    ${pageHead({
      kicker: 'Library',
      title: 'Your games',
      sub: `${state.games.length} game${state.games.length === 1 ? '' : 's'} · ${S.formatDuration(totalSeconds)} tracked across ${state.sessions.length} sessions.`,
      actions: `<button class="btn btn--primary" type="button" data-action="add-game">${icon('plus')} Add game</button>`,
      kickerIcon: 'grid',
    })}
    <div class="summary-strip">
      <div class="summary-item"><strong>${state.games.length}</strong><span>Games</span></div>
      <div class="summary-divider"></div>
      <div class="summary-item"><strong>${S.formatDuration(totalSeconds)}</strong><span>Total playtime</span></div>
      <div class="summary-divider"></div>
      <div class="summary-item"><strong>${mostPlayed ? esc(mostPlayed.game.title) : EMPTY}</strong><span>Most played</span></div>
      <div class="summary-divider"></div>
      <div class="summary-item"><strong>${installed ? esc(installed.title) : EMPTY}</strong><span>Recently added</span></div>
    </div>
    <div class="game-grid">${cards}</div>`;
}

function statsView() {
  const now = Date.now();
  const range = S.rangeWindow(ui.statsRange, now);
  const filtered = S.sessionsInRange(state.sessions, range.from, range.to);
  const total = S.totalSeconds(filtered);
  const best = S.bestDay(state.sessions, now, ui.statsRange === 'all' ? null : ui.statsRange === 'week' ? 7 : 30);
  const favoriteGame = S.topGames(state.sessions, state.games, 1)[0];
  const genreData = S.breakdown(filtered, state.games, 'genre');
  const platformData = S.breakdown(filtered, state.games, 'platform');
  const weeks = S.weeklyTotals(state.sessions, now, 8).map((week, index, list) => ({
    label: index === list.length - 1 ? 'Now' : S.formatDate(week.start, { month: 'numeric', day: 'numeric' }),
    seconds: week.seconds,
    isToday: index === list.length - 1,
  }));
  const heatmap = S.weekHeatmap(state.sessions, now, 13);
  const trace = S.traceWeek(state.sessions, now);
  const achievements = S.achievements(state.sessions, state.games);
  const records = buildRecords(now);
  const rangeButtons = [
    ['week', 'Week'],
    ['month', '30 days'],
    ['all', 'All'],
  ].map(([value, label]) => `<button type="button" class="${ui.statsRange === value ? 'is-active' : ''}" data-action="set-stats-range" data-range="${value}">${label}</button>`).join('');

  return `
    ${pageHead({
      kicker: 'Analytics',
      title: 'Your play patterns',
      sub: `${range.label} · ${S.formatDuration(total)} across ${filtered.length} session${filtered.length === 1 ? '' : 's'}.`,
      actions: `<div class="segmented" role="group" aria-label="Stats range">${rangeButtons}</div>`,
      kickerIcon: 'stats',
    })}
    <div class="stats-kpis">
      <div class="stat-box"><div class="stat-box-label">Playtime</div><div class="stat-box-value">${S.formatDuration(total)}</div><div class="stat-box-sub">${range.label}</div></div>
      <div class="stat-box"><div class="stat-box-label">Sessions</div><div class="stat-box-value">${filtered.length}</div><div class="stat-box-sub">${filtered.length ? `${S.formatDuration(S.averageSession(filtered))} average` : 'No sessions in range'}</div></div>
      <div class="stat-box"><div class="stat-box-label">Best day</div><div class="stat-box-value">${best ? S.formatDuration(best.seconds) : '—'}</div><div class="stat-box-sub">${best ? S.formatDate(new Date(`${best.key}T00:00:00`), { weekday: 'long' }) : 'Log a session to see'}</div></div>
      <div class="stat-box"><div class="stat-box-label">Most played</div><div class="stat-box-value" style="font-size:20px">${favoriteGame ? esc(favoriteGame.game.title) : '—'}</div><div class="stat-box-sub">${favoriteGame ? `${S.formatDuration(favoriteGame.seconds)} all time` : 'No games yet'}</div></div>
    </div>
    <div class="dash-grid">
      <section class="card span-7 chart-card">
        <div class="card-head">
          <div><h2>Playtime trend</h2><p>Last 8 weeks</p></div>
          <div class="card-side">${weekTotalLabel(weeks)}</div>
        </div>
        ${barChart(weeks)}
        <div class="chart-legend">
          <span class="legend-item"><span class="legend-swatch"></span> This week</span>
          <span class="legend-item"><span class="legend-swatch legend-swatch--muted"></span> Previous weeks</span>
          <span class="legend-item" style="margin-left:auto">${S.formatDuration(weeks.reduce((sum, week) => sum + week.seconds, 0))} total</span>
        </div>
      </section>
      <section class="card span-5">
        <div class="card-head"><div><h2>Genre mix</h2><p>${range.label}</p></div></div>
        ${donutChart(genreData, total)}
      </section>
      <section class="card span-5">
        <div class="card-head"><div><h2>Platform split</h2><p>Where you play</p></div></div>
        ${platformChart(platformData, total)}
      </section>
      <section class="card span-7">
        <div class="card-head"><div><h2>Personal records</h2><p>All-time highlights</p></div><span class="text-link">${icon('trophy')} ${records.unlocked}</span></div>
        <div class="records-list">
          ${records.items.map((record) => `<div class="record-row">
            <div class="record-icon">${icon(record.icon)}</div>
            <div class="record-main"><div class="record-label">${esc(record.label)}</div><div class="record-value">${esc(record.value)}</div></div>
            <div class="record-side">${esc(record.side)}</div>
          </div>`).join('')}
        </div>
      </section>
      <section class="card span-12">
        <div class="card-head">
          <div><h2>Activity map</h2><p>13 weeks of playtime</p></div>
          <span class="card-side">${state.sessions.length} sessions</span>
        </div>
        <div class="heat-wrap">
          <div class="heat-days" aria-hidden="true"><span>Mon</span><span></span><span>Wed</span><span></span><span>Fri</span><span></span><span>Sun</span></div>
          <div class="heat-scroll"><div class="heat">
            ${heatmap.map((week) => `<div class="heat-week">${week.days.map((day) => `<span class="heat-cell ${day.future ? 'is-future' : ''}" data-level="${day.level}" title="${esc(S.formatDate(day.ts, { weekday: 'short', month: 'short', day: 'numeric' }))} · ${esc(S.formatDuration(day.seconds))}"></span>`).join('')}</div>`).join('')}
          </div></div>
        </div>
        <div class="heat-legend"><span>Less</span><span class="heat-cell" data-level="0"></span><span class="heat-cell" data-level="1"></span><span class="heat-cell" data-level="2"></span><span class="heat-cell" data-level="3"></span><span class="heat-cell" data-level="4"></span><span>More</span></div>
      </section>
      <section class="card span-12">
        <div class="card-head">
          <div><h2>Weekly trace</h2><p>Every session, mapped across the day</p></div>
          <span class="card-side">${S.formatDuration(S.totalSeconds(S.currentWeek(state.sessions, now)))} this week</span>
        </div>
        ${traceChart(trace)}
        ${traceLegend(trace)}
      </section>
      <section class="card span-12">
        <div class="card-head"><div><h2>Milestones</h2><p>Unlocked as your trace grows</p></div><span class="card-side">${achievements.filter((item) => item.unlocked).length} / ${achievements.length}</span></div>
        <div class="achievements">
          ${achievements.map((item) => `<div class="achievement ${item.unlocked ? 'is-unlocked' : ''}">
            <div class="achievement-medal">${icon(item.icon)}</div>
            <div class="achievement-main">
              <div class="achievement-title">${esc(item.label)}</div>
              <div class="achievement-detail">${esc(item.detail)}</div>
              <div class="achievement-progress"><span style="width:${Math.round(item.progress * 100)}%"></span></div>
            </div>
          </div>`).join('')}
        </div>
      </section>
    </div>`;
}

function weekTotalLabel(weeks) {
  const last = weeks[weeks.length - 1];
  return `<span class="status-dot"></span><span>${S.formatDuration(last?.seconds || 0)} this week</span>`;
}

function donutChart(data, total) {
  const top = data.slice(0, 5);
  const restSeconds = data.slice(5).reduce((sum, entry) => sum + entry.seconds, 0);
  if (restSeconds > 0) top.push({ label: 'Other', seconds: restSeconds, count: 0 });
  const sum = top.reduce((acc, entry) => acc + entry.seconds, 0);
  let offset = 0;
  const segments = top.map((entry, index) => {
    const pct = sum ? (entry.seconds / sum) * 100 : 0;
    const dash = Math.max(0, pct - 1.6);
    const markup = `<circle class="donut-seg" cx="60" cy="60" r="44" pathLength="100" stroke="${DONUT_COLORS[index % DONUT_COLORS.length]}" stroke-dasharray="${dash} ${100 - dash}" stroke-dashoffset="${-offset}"/>`;
    offset += pct;
    return { entry, color: DONUT_COLORS[index % DONUT_COLORS.length], markup };
  });

  return `<div class="donut-layout">
    <div class="donut-wrap">
      <svg viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="44" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="13"/>
        ${segments.map((segment) => segment.markup).join('')}
      </svg>
      <div class="donut-center"><strong>${total ? S.formatDuration(total, { compact: true }) : '0h'}</strong><span>tracked</span></div>
    </div>
    <div class="donut-legend">
      ${top.length ? segments.map((segment) => `<div class="donut-row">
        <span class="donut-dot" style="background:${segment.color}"></span>
        <span>${esc(segment.entry.label)}</span>
        <strong>${sum ? Math.round((segment.entry.seconds / sum) * 100) : 0}%</strong>
      </div>`).join('') : `<div class="recent-empty">${icon('stats')} No sessions in this range.</div>`}
    </div>
  </div>`;
}

function platformChart(data, total) {
  if (!data.length) return `<div class="recent-empty">${icon('monitor')} Log a session to see your platform split.</div>`;
  return `<div class="platform-list">
    ${data.map((entry) => {
      const pct = S.percent(entry.seconds, total);
      return `<div class="platform-row">
        <div class="platform-icon">${icon(PLATFORM_ICONS[entry.label] || 'gamepad')}</div>
        <div class="platform-main">
          <div class="platform-top"><strong>${esc(entry.label)}</strong><span>${S.formatDuration(entry.seconds)} · ${Math.round(pct)}%</span></div>
          <div class="platform-track"><span style="width:${pct}%"></span></div>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

function buildRecords(now) {
  const longest = state.sessions.reduce((best, session) => {
    if (!best) return session;
    return S.sessionSeconds(session) > S.sessionSeconds(best) ? session : best;
  }, null);
  const longestGame = longest ? getGame(longest.gameId) : null;
  const best = S.bestDay(state.sessions, now);
  const favorite = S.topGames(state.sessions, state.games, 1)[0];
  const bestStreak = S.longestStreak(state.sessions);
  const items = [
    { icon: 'trophy', label: 'Longest session', value: longest ? `${longestGame?.title || 'Session'} · ${S.formatDate(longest.start)}` : EMPTY, side: longest ? S.formatDuration(S.sessionSeconds(longest)) : EMPTY },
    { icon: 'calendar', label: 'Biggest day', value: best ? S.formatDate(new Date(`${best.key}T00:00:00`), { weekday: 'long', month: 'short', day: 'numeric' }) : EMPTY, side: best ? S.formatDuration(best.seconds) : EMPTY },
    { icon: 'target', label: 'Most played', value: favorite ? favorite.game.title : EMPTY, side: favorite ? S.formatDuration(favorite.seconds) : EMPTY },
    { icon: 'flame', label: 'Longest streak', value: `${bestStreak} days in a row`, side: `${S.streak(state.sessions, now)} now` },
  ];
  return {
    items,
    unlocked: `${items.filter((item) => item.value !== EMPTY).length} records`,
  };
}

function traceChart(trace) {
  const now = Date.now();
  const hourTicks = ['12a', '6a', '12p', '6p', '12a'];
  return `<div class="trace-scroll"><div class="trace">
    <div class="trace-hours"><span></span><div class="trace-hour-ticks">${hourTicks.map((tick) => `<span>${tick}</span>`).join('')}</div></div>
    ${trace.rows.map((row) => {
      const nowPct = row.isToday ? ((now - row.ts) / S.DAY_MS) * 100 : null;
      return `<div class="trace-row ${row.isToday ? 'is-today' : ''}">
        <span class="trace-day">${row.label}</span>
        <div class="trace-lane">
          ${row.items.map((item) => {
            const game = getGame(item.session.gameId);
            return `<span class="trace-block" style="left:${item.left}%;width:${item.width}%;--g1:${esc(game?.color || 'var(--accent)')}" title="${esc(game?.title || 'Session')} · ${esc(S.formatRange(item.session.start, item.session.end))}"></span>`;
          }).join('')}
          ${nowPct !== null ? `<span class="trace-now" style="left:${Math.min(100, Math.max(0, nowPct))}%"></span>` : ''}
        </div>
      </div>`;
    }).join('')}
  </div></div>`;
}

function traceLegend(trace) {
  const ids = [...new Set(trace.rows.flatMap((row) => row.items.map((item) => item.session.gameId)))];
  const games = ids.map((id) => getGame(id)).filter(Boolean).slice(0, 5);
  if (!games.length) return '';
  return `<div class="chart-legend">${games.map((game) => `<span class="legend-item"><span class="legend-swatch" style="background:${esc(game.color)}"></span>${esc(game.title)}</span>`).join('')}</div>`;
}

function renderLiveDock() {
  const host = $('#live-dock');
  if (!host) return;
  if (!state.live) {
    host.innerHTML = '';
    return;
  }
  const game = getGame(state.live.gameId);
  if (!game) {
    state.live = null;
    save();
    host.innerHTML = '';
    return;
  }
  const elapsed = Math.floor(liveSeconds());
  host.innerHTML = `<div class="live-dock" role="region" aria-label="Live session">
    <span class="live-pulse ${state.live.running ? '' : 'is-paused'}"></span>
    <div class="mini-cover" style="${coverStyle(game)}">${gameIcon(game.icon)}</div>
    <div class="live-main">
      <div class="live-label">${state.live.running ? 'Now tracking' : 'Paused'} <span>· ${esc(game.platform)}</span></div>
      <div class="live-title">${esc(game.title)}</div>
    </div>
    <div class="live-time ${state.live.running ? '' : 'is-paused'}">${S.formatClock(elapsed)}</div>
    <div class="live-actions">
      <button class="icon-btn" type="button" data-action="toggle-live" aria-label="${state.live.running ? 'Pause session' : 'Resume session'}">${icon(state.live.running ? 'pause' : 'play')}</button>
      <button class="icon-btn icon-btn--stop" type="button" data-action="stop-live" aria-label="Stop session">${icon('stop')}</button>
    </div>
  </div>`;
}

function liveSeconds() {
  if (!state.live) return 0;
  return (state.live.accumulatedMs + (state.live.running ? Date.now() - state.live.startedAt : 0)) / 1000;
}

function tickLive() {
  if (!state.live) return;
  const label = $('.live-time');
  if (label) label.textContent = S.formatClock(Math.floor(liveSeconds()));
}

function openModal(type, payload = {}) {
  ui.modal = { type, ...payload };
  renderModal();
  document.body.classList.add('modal-open');
  requestAnimationFrame(() => {
    const editable = type === 'log-session' || type === 'game-form';
    const target = editable
      ? $('.modal-body input[type="text"], .modal-body input[type="number"], .modal-body input[type="date"], .modal-body select, .modal-body textarea')
      : $('.modal');
    target?.focus({ preventScroll: true });
  });
}

function closeModal() {
  ui.modal = null;
  const host = $('#modal-root');
  if (host) host.innerHTML = '';
  document.body.classList.remove('modal-open');
}

function renderModal() {
  const host = $('#modal-root');
  if (!host) return;
  if (!ui.modal) {
    host.innerHTML = '';
    return;
  }
  const content = {
    'log-session': logSessionModal,
    'start-session': startSessionModal,
    'live-save': liveSaveModal,
    'game-form': gameFormModal,
    settings: settingsModal,
    confirm: confirmModal,
  }[ui.modal.type];
  if (!content) {
    closeModal();
    return;
  }
  host.innerHTML = content();
}

function modalShell({ title, sub, body, foot, wide = false, iconName = '' }) {
  return `<div class="modal-backdrop" data-modal-backdrop="true">
    <div class="modal ${wide ? 'modal--wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1">
      <div class="modal-head">
        <div>
          <h2 id="modal-title">${title}</h2>
          ${sub ? `<p>${sub}</p>` : ''}
        </div>
        <button class="icon-btn icon-btn--line" type="button" data-action="close-modal" aria-label="Close">${icon('close')}</button>
      </div>
      <div class="modal-body">${body}</div>
      ${foot ? `<div class="modal-foot">${foot}</div>` : ''}
    </div>
  </div>`;
}

function gameOptions(selectedId) {
  return state.games
    .slice()
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((game) => `<option value="${esc(game.id)}" ${game.id === selectedId ? 'selected' : ''}>${esc(game.title)} · ${esc(game.platform)}</option>`)
    .join('');
}

function dateValue(value) {
  const date = new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function timeValue(value) {
  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function ratingInput(value, compact = false) {
  return `<div class="rating-input" ${compact ? 'style="gap:2px"' : ''}>
    <input type="hidden" name="rating" value="${value}">
    ${[1, 2, 3, 4, 5].map((star) => `<button type="button" class="${star <= value ? 'is-on' : ''}" data-action="set-rating" data-value="${star}" aria-label="${star} star${star === 1 ? '' : 's'}">${icon('star')}</button>`).join('')}
  </div>`;
}

function moodInput(value) {
  return `<div class="mood-input">
    ${MOODS.map((mood) => `<input type="radio" id="mood-${mood.id}" name="mood" value="${mood.id}" ${mood.id === value ? 'checked' : ''}>
      <label for="mood-${mood.id}">${icon(S.moodMeta(mood.id).icon)} ${esc(mood.label)}</label>`).join('')}
  </div>`;
}

function logSessionModal() {
  const editing = ui.modal.session ? state.sessions.find((item) => item.id === ui.modal.session) : null;
  const lastGame = state.sessions[0]?.gameId || state.games[0]?.id;
  const start = editing ? new Date(editing.start) : new Date(Date.now() - 60 * 60 * 1000);
  const duration = editing ? Math.max(1, Math.round(S.sessionSeconds(editing) / 60)) : 60;
  const rating = editing ? editing.rating : 4;
  const mood = editing ? editing.mood : 'focused';

  const body = `<form id="session-form" autocomplete="off">
    <input type="hidden" name="id" value="${editing ? esc(editing.id) : ''}">
    <div class="field">
      <label for="session-game">Game</label>
      <select id="session-game" name="gameId" required>${gameOptions(editing?.gameId || lastGame)}</select>
    </div>
    <div class="field-row">
      <div class="field">
        <label for="session-date">Date</label>
        <input id="session-date" type="date" name="date" required value="${dateValue(start)}">
      </div>
      <div class="field">
        <label for="session-time">Start time</label>
        <input id="session-time" type="time" name="time" required value="${timeValue(start)}">
      </div>
    </div>
    <div class="field">
      <label for="session-duration">Duration (minutes)</label>
      <input id="session-duration" type="number" name="duration" min="1" max="720" step="1" required value="${duration}">
      <span class="field-hint">A 90 minute session is logged as 1h 30m.</span>
    </div>
    <div class="field">
      <span class="field-label">Session rating</span>
      ${ratingInput(rating)}
    </div>
    <div class="field">
      <span class="field-label">Mood</span>
      ${moodInput(mood)}
    </div>
    <div class="field" style="margin-bottom:0">
      <label for="session-notes">Notes <span style="font-weight:500;text-transform:none;letter-spacing:0">(optional)</span></label>
      <textarea id="session-notes" name="notes" maxlength="400" placeholder="What stood out? A boss, a rank, a run, a moment?">${editing ? esc(editing.notes) : ''}</textarea>
    </div>
  </form>`;

  return modalShell({
    title: editing ? 'Edit session' : 'Log a session',
    sub: editing ? 'Adjust the details of this trace.' : 'Add a past session to your journal.',
    body,
    foot: `<button class="btn btn--ghost" type="button" data-action="close-modal">Cancel</button>
      <button class="btn btn--primary" type="submit" form="session-form">${icon('check')} ${editing ? 'Save changes' : 'Log session'}</button>`,
  });
}

function startSessionModal() {
  const sorted = [...state.games].sort((a, b) => {
    const aLast = Math.max(0, ...state.sessions.filter((session) => session.gameId === a.id).map((session) => new Date(session.start).getTime()));
    const bLast = Math.max(0, ...state.sessions.filter((session) => session.gameId === b.id).map((session) => new Date(session.start).getTime()));
    return bLast - aLast;
  });
  const defaultId = sorted[0]?.id;
  const body = `<form id="start-form" autocomplete="off">
    <div class="field">
      <span class="field-label">What are you playing?</span>
      <div class="choice-grid">
        ${sorted.map((game) => `<input type="radio" id="start-${esc(game.id)}" name="gameId" value="${esc(game.id)}" ${game.id === defaultId ? 'checked' : ''}>
          <label class="choice" for="start-${esc(game.id)}">
            <span class="choice-cover" style="${coverStyle(game)}">${gameIcon(game.icon)}</span>
            <span class="choice-main"><span class="choice-title">${esc(game.title)}</span><span class="choice-meta">${esc(game.platform)}</span></span>
          </label>`).join('')}
      </div>
    </div>
    <div class="field" style="margin-bottom:0">
      <label for="start-notes">Session note <span style="font-weight:500;text-transform:none;letter-spacing:0">(optional)</span></label>
      <input id="start-notes" type="text" name="notes" maxlength="400" placeholder="Anything you want to remember?">
    </div>
  </form>`;

  return modalShell({
    title: 'Start a session',
    sub: 'The timer keeps running in the background and survives a reload.',
    body,
    foot: `<button class="btn btn--ghost" type="button" data-action="close-modal">Cancel</button>
      <button class="btn btn--primary" type="submit" form="start-form">${icon('play')} Start tracking</button>`,
  });
}

function liveSaveModal() {
  if (!state.live) {
    closeModal();
    return '';
  }
  const game = getGame(state.live.gameId);
  const seconds = Math.floor(liveSeconds());
  const body = `<form id="live-save-form" autocomplete="off">
    <div class="kpi" style="display:flex;align-items:center;gap:13px;margin-bottom:16px;padding:14px">
      <div class="mini-cover mini-cover--lg" style="${coverStyle(game)}">${gameIcon(game.icon)}</div>
      <div style="flex:1;min-width:0">
        <div class="record-label">Session complete</div>
        <div style="font-size:15px;font-weight:700;margin-top:2px">${esc(game.title)}</div>
        <div class="record-label" style="margin-top:3px">${esc(game.platform)} · ${esc(game.genre)}</div>
      </div>
      <div style="text-align:right">
        <div class="live-time" style="color:var(--accent)">${S.formatClock(seconds)}</div>
        <div class="record-label">duration</div>
      </div>
    </div>
    <input type="hidden" name="duration" value="${seconds}">
    <input type="hidden" name="live" value="1">
    <div class="field">
      <span class="field-label">How did it go?</span>
      ${ratingInput(4)}
    </div>
    <div class="field">
      <span class="field-label">Mood</span>
      ${moodInput('focused')}
    </div>
    <div class="field" style="margin-bottom:0">
      <label for="live-notes">Notes <span style="font-weight:500;text-transform:none;letter-spacing:0">(optional)</span></label>
      <textarea id="live-notes" name="notes" maxlength="400" placeholder="A win, a build, a moment worth remembering.">${esc(state.live.notes || '')}</textarea>
    </div>
  </form>`;

  return modalShell({
    title: 'Save your trace',
    sub: 'Add a rating and mood, then drop it into your journal.',
    body,
    foot: `<button class="btn btn--danger modal-foot-spacer" type="button" data-action="discard-live">Discard</button>
      <button class="btn btn--ghost" type="button" data-action="close-modal">Keep paused</button>
      <button class="btn btn--primary" type="submit" form="live-save-form">${icon('check')} Save session</button>`,
  });
}

function gameFormModal() {
  const editing = ui.modal.game ? getGame(ui.modal.game) : null;
  const selectedPalette = GAME_PALETTES.find((palette) => palette.a === editing?.color) || GAME_PALETTES[0];
  const body = `<form id="game-form" autocomplete="off">
    <input type="hidden" name="id" value="${editing ? esc(editing.id) : ''}">
    <div class="field">
      <label for="game-title">Game title</label>
      <input id="game-title" type="text" name="title" maxlength="60" required placeholder="e.g. Baldur's Gate 3" value="${editing ? esc(editing.title) : ''}">
    </div>
    <div class="field-row">
      <div class="field">
        <label for="game-platform">Platform</label>
        <select id="game-platform" name="platform">${PLATFORMS.map((platform) => `<option value="${platform}" ${editing?.platform === platform ? 'selected' : ''}>${platform}</option>`).join('')}</select>
      </div>
      <div class="field">
        <label for="game-genre">Genre</label>
        <select id="game-genre" name="genre">${GENRES.map((genre) => `<option value="${genre}" ${editing?.genre === genre ? 'selected' : ''}>${genre}</option>`).join('')}</select>
      </div>
    </div>
    <div class="field" style="margin-bottom:0">
      <span class="field-label">Cover accent</span>
      <div class="swatches">
        ${GAME_PALETTES.map((palette) => `<input type="radio" id="palette-${palette.id}" name="palette" value="${palette.id}" ${palette.id === selectedPalette.id ? 'checked' : ''}>
          <label class="swatch" for="palette-${palette.id}" style="--swatch:${palette.a}" title="${palette.id}"></label>`).join('')}
      </div>
      <span class="field-hint">Cover art is generated from the genre icon and accent.</span>
    </div>
  </form>`;

  return modalShell({
    title: editing ? 'Edit game' : 'Add a game',
    sub: editing ? 'Update the details for this title.' : 'Build out your library so every session has a home.',
    body,
    foot: `<button class="btn btn--ghost" type="button" data-action="close-modal">Cancel</button>
      <button class="btn btn--primary" type="submit" form="game-form">${icon('check')} ${editing ? 'Save game' : 'Add game'}</button>`,
  });
}

function settingsModal() {
  const accents = ACCENTS.map((accent) => `<input type="radio" id="accent-${accent.id}" name="accent" value="${accent.id}" ${state.profile.accent === accent.id ? 'checked' : ''}>
    <label class="accent-option" for="accent-${accent.id}"><span class="accent-dot" style="--swatch:${accent.value}"></span>${accent.label}</label>`).join('');
  const quickGoals = [5, 8, 10, 12, 15, 20].map((hours) => `<button type="button" class="${state.profile.weeklyGoalHours === hours ? 'is-active' : ''}" data-action="goal-preset" data-hours="${hours}">${hours}h</button>`).join('');

  const body = `<form id="settings-form" autocomplete="off">
    <div class="settings-section">
      <h3>Profile</h3>
      <div class="field">
        <label for="profile-name">Display name</label>
        <input id="profile-name" type="text" name="name" maxlength="40" required value="${esc(state.profile.name)}">
      </div>
      <div class="field" style="margin-bottom:0">
        <label for="goal-hours">Weekly goal (hours)</label>
        <input id="goal-hours" type="number" name="goal" min="1" max="60" step="1" required value="${state.profile.weeklyGoalHours}">
        <div class="goal-quick">${quickGoals}</div>
      </div>
    </div>
    <div class="settings-section">
      <h3>Accent</h3>
      <div class="accent-options">${accents}</div>
    </div>
    <div class="settings-section">
      <h3>Data</h3>
      <div class="data-row">
        <main><h4>Export backup</h4><p>Download a JSON copy of games, sessions, and settings.</p></main>
        <button class="btn btn--soft btn--sm" type="button" data-action="export-data">${icon('download')} Export</button>
      </div>
      <div class="data-row">
        <main><h4>Import backup</h4><p>Restore a PlayTrace JSON backup from another device.</p></main>
        <label class="btn btn--soft btn--sm" for="import-file">${icon('upload')} Import</label>
        <input class="file-input" id="import-file" type="file" accept="application/json,.json">
      </div>
      <div class="data-row">
        <main><h4>Reset demo data</h4><p>Restore the sample library and 60 days of sessions.</p></main>
        <button class="btn btn--soft btn--sm" type="button" data-action="reset-demo">${icon('refresh')} Reset</button>
      </div>
      <div class="data-row">
        <main><h4>Clear session history</h4><p>Keep your games and profile, remove all traces.</p></main>
        <button class="btn btn--danger btn--sm" type="button" data-action="clear-sessions">${icon('trash')} Clear</button>
      </div>
    </div>
    <div class="settings-section">
      <h3>Install & about</h3>
      ${NATIVE ? '' : `<div class="data-row">
        <main><h4>Install PlayTrace</h4><p>Add it to your Android home screen and play offline.</p></main>
        <button class="btn btn--soft btn--sm" type="button" data-action="install-app">${icon('install')} Install</button>
      </div>`}
      <div class="about-line"><span>Version</span><strong>1.0.0</strong></div>
      <div class="about-line"><span>Storage</span><strong>${state.sessions.length} sessions · ${state.games.length} games</strong></div>
      <div class="about-line"><span>Data stays</span><strong>on this device</strong></div>
      ${NATIVE ? '<div class="about-line"><span>Build</span><strong>Android app</strong></div>' : ''}
    </div>
  </form>`;

  return modalShell({
    title: 'Settings',
    sub: 'Tune your goal, accent, and local data.',
    body,
    foot: `<button class="btn btn--ghost" type="button" data-action="close-modal">Cancel</button>
      <button class="btn btn--primary" type="submit" form="settings-form">${icon('check')} Save settings</button>`,
    wide: true,
  });
}

function confirmModal() {
  const payload = ui.modal;
  const meta = {
    'delete-session': { title: 'Delete this session?', message: 'This trace will be removed from your journal. This cannot be undone.', confirm: 'Delete session', danger: true },
    'delete-game': { title: 'Remove this game?', message: 'The game and every session linked to it will be removed. This cannot be undone.', confirm: 'Remove game', danger: true },
    'discard-live': { title: 'Discard this session?', message: 'The timer data for this session will be thrown away.', confirm: 'Discard session', danger: true },
    'clear-sessions': { title: 'Clear all sessions?', message: 'Every session is removed, but your games, profile, and goal stay intact.', confirm: 'Clear history', danger: true },
    'reset-demo': { title: 'Reset to demo data?', message: 'Your current games and sessions are replaced with the PlayTrace demo library.', confirm: 'Reset data', danger: false },
    import: { title: 'Replace with this backup?', message: 'Current games and sessions will be replaced by the imported backup.', confirm: 'Import backup', danger: false },
  }[payload.kind] || { title: 'Are you sure?', message: 'This action cannot be undone.', confirm: 'Confirm', danger: true };

  return modalShell({
    title: meta.title,
    body: `<p class="confirm-copy">${meta.message}${payload.detail ? `<br><br><strong>${esc(payload.detail)}</strong>` : ''}</p>`,
    foot: `<button class="btn btn--ghost" type="button" data-action="close-modal">Cancel</button>
      <button class="btn ${meta.danger ? 'btn--danger' : 'btn--primary'}" type="button" data-action="confirm-modal">${icon(meta.danger ? 'trash' : 'check')} ${meta.confirm}</button>`,
  });
}

function showToast(message, iconName = 'check') {
  const root = $('#toast-root');
  if (!root) return;
  const id = ++ui.toastCounter;
  root.innerHTML = `<div class="toast" data-toast="${id}">${icon(iconName)}<span>${esc(message)}</span></div>`;
  clearTimeout(ui.toastTimer);
  ui.toastTimer = setTimeout(() => {
    const element = $('.toast');
    if (!element) return;
    element.classList.add('is-out');
    setTimeout(() => { if (root.querySelector(`[data-toast="${id}"]`)) root.innerHTML = ''; }, 260);
  }, 2800);
}

function rerenderPreservingFocus() {
  const active = document.activeElement;
  const id = active?.id;
  let position = null;
  try { position = active?.selectionStart; } catch { position = null; }
  renderView();
  if (id) {
    const element = document.getElementById(id);
    if (element) {
      element.focus({ preventScroll: true });
      if (position !== null && typeof element.setSelectionRange === 'function') {
        try { element.setSelectionRange(position, position); } catch {}
      }
    }
  }
}

function startLive(gameId, notes) {
  state.live = {
    gameId,
    startedAt: Date.now(),
    accumulatedMs: 0,
    running: true,
    notes: notes || '',
  };
  save();
  closeModal();
  render();
  const game = getGame(gameId);
  showToast(`Tracking ${game?.title || 'session'}`, 'play');
}

function toggleLive() {
  if (!state.live) return;
  if (state.live.running) {
    state.live.accumulatedMs += Date.now() - state.live.startedAt;
    state.live.running = false;
  } else {
    state.live.startedAt = Date.now();
    state.live.running = true;
  }
  save();
  renderLiveDock();
  if (ui.modal?.type === 'live-save') renderModal();
}

function stopLive() {
  if (!state.live) return;
  if (state.live.running) {
    state.live.accumulatedMs += Date.now() - state.live.startedAt;
    state.live.running = false;
  }
  save();
  renderLiveDock();
  openModal('live-save');
}

function saveLiveSession(form) {
  if (!state.live) return;
  const data = new FormData(form);
  const seconds = Math.floor(liveSeconds());
  if (seconds < 1) {
    showToast('Session is too short to save.', 'info');
    return;
  }
  const end = new Date();
  const start = new Date(end.getTime() - seconds * 1000);
  state.sessions.unshift({
    id: S.uid('session'),
    gameId: state.live.gameId,
    start: start.toISOString(),
    end: end.toISOString(),
    durationSec: seconds,
    rating: Number(data.get('rating')) || 4,
    mood: data.get('mood') || 'focused',
    notes: String(data.get('notes') || '').slice(0, 400),
    source: 'live',
  });
  state.sessions.sort((a, b) => new Date(b.start) - new Date(a.start));
  state.live = null;
  save();
  closeModal();
  render();
  showToast(`Saved ${S.formatDuration(seconds)} session`, 'check');
}

function saveManualSession(form) {
  const data = new FormData(form);
  const gameId = String(data.get('gameId') || '');
  const date = String(data.get('date') || '');
  const time = String(data.get('time') || '');
  const duration = Number(data.get('duration'));
  const id = String(data.get('id') || '');
  if (!getGame(gameId)) { showToast('Choose a game first.', 'info'); return; }
  if (!date || !time) { showToast('Add a date and start time.', 'info'); return; }
  if (!Number.isFinite(duration) || duration < 1 || duration > 720) { showToast('Duration must be between 1 and 720 minutes.', 'info'); return; }
  const start = new Date(`${date}T${time}`);
  if (Number.isNaN(start.getTime())) { showToast('That date and time is not valid.', 'info'); return; }
  if (start.getTime() > Date.now() + 5 * 60 * 1000) { showToast('Start time cannot be in the future.', 'info'); return; }
  const end = new Date(start.getTime() + duration * 60 * 1000);
  const session = {
    id: id || S.uid('session'),
    gameId,
    start: start.toISOString(),
    end: end.toISOString(),
    durationSec: duration * 60,
    rating: Number(data.get('rating')) || 3,
    mood: String(data.get('mood') || 'chill'),
    notes: String(data.get('notes') || '').slice(0, 400),
    source: 'manual',
  };
  if (id) {
    const index = state.sessions.findIndex((item) => item.id === id);
    if (index >= 0) state.sessions[index] = session;
    showToast('Session updated', 'check');
  } else {
    state.sessions.unshift(session);
    showToast('Session logged', 'check');
  }
  state.sessions.sort((a, b) => new Date(b.start) - new Date(a.start));
  save();
  closeModal();
  render();
}

function saveGame(form) {
  const data = new FormData(form);
  const title = String(data.get('title') || '').trim();
  const platform = String(data.get('platform') || 'PC');
  const genre = String(data.get('genre') || 'Indie');
  const palette = GAME_PALETTES.find((item) => item.id === data.get('palette')) || GAME_PALETTES[0];
  const id = String(data.get('id') || '');
  if (!title) { showToast('Give the game a title.', 'info'); return; }
  if (id) {
    const game = getGame(id);
    if (game) {
      game.title = title.slice(0, 60);
      game.platform = platform;
      game.genre = genre;
      game.icon = GENRE_ICONS[genre] || 'gamepad';
      game.color = palette.a;
      game.shade = palette.b;
    }
    showToast('Game updated', 'check');
  } else {
    state.games.push({
      id: S.uid('game'),
      title: title.slice(0, 60),
      platform,
      genre,
      icon: GENRE_ICONS[genre] || 'gamepad',
      color: palette.a,
      shade: palette.b,
      createdAt: new Date().toISOString(),
      order: state.games.length,
    });
    showToast('Game added to library', 'check');
  }
  save();
  closeModal();
  render();
}

function saveSettings(form) {
  const data = new FormData(form);
  const name = String(data.get('name') || '').trim();
  const goal = Number(data.get('goal'));
  const accent = String(data.get('accent') || state.profile.accent);
  if (!name) { showToast('Display name cannot be empty.', 'info'); return; }
  if (!Number.isFinite(goal) || goal < 1 || goal > 60) { showToast('Weekly goal must be between 1 and 60 hours.', 'info'); return; }
  state.profile.name = name.slice(0, 40);
  state.profile.weeklyGoalHours = goal;
  state.profile.accent = ACCENTS.some((item) => item.id === accent) ? accent : state.profile.accent;
  save();
  closeModal();
  render();
  showToast('Settings saved', 'check');
}

function confirmAction() {
  const payload = ui.modal;
  if (!payload) return;
  if (payload.kind === 'delete-session') {
    state.sessions = state.sessions.filter((session) => session.id !== payload.id);
    showToast('Session deleted', 'trash');
  }
  if (payload.kind === 'delete-game') {
    const game = getGame(payload.id);
    state.games = state.games.filter((item) => item.id !== payload.id);
    state.sessions = state.sessions.filter((session) => session.gameId !== payload.id);
    state.profile.favorites = state.profile.favorites.filter((id) => id !== payload.id);
    if (state.live?.gameId === payload.id) state.live = null;
    showToast(`${game?.title || 'Game'} removed`, 'trash');
  }
  if (payload.kind === 'discard-live') {
    state.live = null;
    showToast('Live session discarded', 'trash');
  }
  if (payload.kind === 'clear-sessions') {
    state.sessions = [];
    state.live = null;
    showToast('Session history cleared', 'trash');
  }
  if (payload.kind === 'reset-demo') {
    const fresh = createSeed();
    Object.assign(state, fresh);
    showToast('Demo data restored', 'refresh');
  }
  if (payload.kind === 'import') {
    Object.assign(state, payload.imported);
    showToast('Backup imported', 'check');
  }
  save();
  closeModal();
  render();
}

function exportData() {
  const json = exportState(state);
  const filename = `playtrace-backup-${S.dateKey(Date.now())}.json`;
  if (NATIVE) {
    try {
      window.PlayTraceAndroid.exportBackup(json, filename);
      showToast('Choose where to save your backup', 'download');
    } catch (error) {
      showToast('Could not open the file picker.', 'info');
    }
    return;
  }
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast('Backup downloaded', 'download');
}

async function importData(file) {
  try {
    const text = await file.text();
    const imported = parseImportedState(text);
    openModal('confirm', {
      kind: 'import',
      imported,
      detail: `${imported.games.length} games · ${imported.sessions.length} sessions`,
    });
  } catch (error) {
    showToast(error.message || 'Could not read that backup.', 'info');
  }
}

function installApp() {
  if (!ui.installPrompt) {
    showToast('Open your browser menu and choose Install app.', 'install');
    return;
  }
  ui.installPrompt.prompt();
  ui.installPrompt.userChoice.then(() => {
    ui.installPrompt = null;
    renderTopbar();
  }).catch(() => {});
}

function setRatingButton(button) {
  const value = Number(button.dataset.value);
  const group = button.closest('.rating-input');
  if (!group) return;
  const hidden = group.querySelector('input[name="rating"]');
  if (hidden) hidden.value = value;
  group.querySelectorAll('button[data-action="set-rating"]').forEach((item) => {
    item.classList.toggle('is-on', Number(item.dataset.value) <= value);
  });
}

function handleAction(element) {
  const action = element.dataset.action;
  if (!action) return;
  const id = element.dataset.id;

  if (action === 'start-session') {
    if (state.live) {
      showToast('A session is already being tracked.', 'pause');
      return;
    }
    if (!state.games.length) {
      openModal('game-form');
      showToast('Add a game before starting a session.', 'games');
      return;
    }
    openModal('start-session');
    return;
  }
  if (action === 'log-session') {
    if (!state.games.length) {
      openModal('game-form');
      showToast('Add a game before logging a session.', 'games');
      return;
    }
    openModal('log-session');
    return;
  }
  if (action === 'add-game') { openModal('game-form'); return; }
  if (action === 'edit-game') { openModal('game-form', { game: id }); return; }
  if (action === 'edit-session') { openModal('log-session', { session: id }); return; }
  if (action === 'open-settings') { openModal('settings'); return; }
  if (action === 'close-modal') { closeModal(); return; }
  if (action === 'toggle-live') { toggleLive(); return; }
  if (action === 'stop-live') { stopLive(); return; }
  if (action === 'discard-live') { openModal('confirm', { kind: 'discard-live' }); return; }
  if (action === 'set-rating') { setRatingButton(element); return; }
  if (action === 'install-app') { installApp(); return; }
  if (action === 'export-data') { exportData(); return; }
  if (action === 'delete-session') {
    const session = state.sessions.find((item) => item.id === id);
    const game = session ? getGame(session.gameId) : null;
    openModal('confirm', { kind: 'delete-session', id, detail: game ? `${game.title} · ${S.formatDuration(S.sessionSeconds(session))}` : '' });
    return;
  }
  if (action === 'delete-game') {
    const game = getGame(id);
    const count = state.sessions.filter((session) => session.gameId === id).length;
    openModal('confirm', { kind: 'delete-game', id, detail: game ? `${game.title} · ${count} session${count === 1 ? '' : 's'} linked` : '' });
    return;
  }
  if (action === 'toggle-favorite') {
    const favorites = new Set(state.profile.favorites);
    if (favorites.has(id)) favorites.delete(id); else favorites.add(id);
    state.profile.favorites = [...favorites];
    save();
    renderView();
    return;
  }
  if (action === 'reset-demo') { openModal('confirm', { kind: 'reset-demo' }); return; }
  if (action === 'clear-sessions') { openModal('confirm', { kind: 'clear-sessions' }); return; }
  if (action === 'confirm-modal') { confirmAction(); return; }
  if (action === 'set-session-range') {
    ui.sessionRange = element.dataset.range;
    renderView();
    return;
  }
  if (action === 'set-stats-range') {
    ui.statsRange = element.dataset.range;
    renderView();
    return;
  }
  if (action === 'goal-preset') {
    const input = $('#goal-hours');
    if (input) input.value = element.dataset.hours;
    $$('.goal-quick button').forEach((button) => button.classList.toggle('is-active', button === element));
    return;
  }
}

function handleSubmit(event) {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  event.preventDefault();
  if (form.id === 'session-form') saveManualSession(form);
  if (form.id === 'live-save-form') saveLiveSession(form);
  if (form.id === 'game-form') saveGame(form);
  if (form.id === 'settings-form') saveSettings(form);
  if (form.id === 'start-form') {
    const data = new FormData(form);
    const gameId = String(data.get('gameId') || '');
    if (!getGame(gameId)) { showToast('Choose a game first.', 'info'); return; }
    startLive(gameId, String(data.get('notes') || ''));
  }
}

function bindEvents() {
  document.addEventListener('click', (event) => {
    const backdrop = event.target.closest('[data-modal-backdrop]');
    if (backdrop && event.target === backdrop) {
      closeModal();
      return;
    }
    const target = event.target.closest('[data-action]');
    if (target) handleAction(target);
  });

  document.addEventListener('submit', handleSubmit);

  document.addEventListener('input', (event) => {
    if (event.target.id === 'session-search') {
      ui.sessionQuery = event.target.value;
      rerenderPreservingFocus();
    }
  });

  document.addEventListener('change', (event) => {
    if (event.target.id === 'session-platform') {
      ui.sessionPlatform = event.target.value;
      renderView();
    }
    if (event.target.id === 'import-file' && event.target.files?.[0]) {
      const file = event.target.files[0];
      importData(file);
      event.target.value = '';
    }
    if (event.target.name === 'accent') {
      applyAccent(event.target.value);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && ui.modal) closeModal();
    if (event.key === '/' && !ui.modal && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '')) {
      const search = $('#session-search');
      if (search) { event.preventDefault(); search.focus(); }
    }
  });

  window.addEventListener('hashchange', () => {
    ui.view = viewFromHash();
    closeModal();
    render();
    window.scrollTo({ top: 0, behavior: 'instant' });
  });

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    ui.installPrompt = event;
    renderTopbar();
  });

  window.addEventListener('appinstalled', () => {
    ui.installPrompt = null;
    showToast('PlayTrace installed', 'install');
    renderTopbar();
  });

  setInterval(tickLive, 1000);
}

function boot() {
  if (!location.hash) history.replaceState(null, '', '#/home');
  ui.view = viewFromHash();
  bindEvents();
  render();
  setTimeout(() => {
    const bootScreen = $('#boot');
    if (!bootScreen) return;
    bootScreen.classList.add('is-done');
    setTimeout(() => bootScreen.remove(), 600);
  }, 420);

  window.__playTraceBack = () => {
    if (ui.modal) {
      closeModal();
      return true;
    }
    return false;
  };

  if (!NATIVE && 'serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {});
    });
  }
}

boot();

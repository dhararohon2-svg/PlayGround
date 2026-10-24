const ICONS = {
  logo: '<path d="M2 13h4.2L9 5l3.4 14L15.8 10H22"/>',
  home: '<path d="M3.5 10.7 12 3.5l8.5 7.2"/><path d="M5.5 9.4V20h13V9.4"/><path d="M9.5 20v-5.5h5V20"/>',
  sessions: '<path d="M8 6h12"/><path d="M8 12h12"/><path d="M8 18h12"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>',
  games: '<path d="M7.2 8h9.6c1.8 0 3 1.1 3.4 2.7l1.2 4.8c.3 1.4-.6 2.7-2 2.9-1 .1-1.8-.5-2.4-1.3L15.6 15H8.4L7 17.1c-.6.8-1.4 1.4-2.4 1.3-1.4-.2-2.3-1.5-2-2.9l1.2-4.8C4.2 9.1 5.4 8 7.2 8Z"/><path d="M8 10.5v3"/><path d="M6.5 12h3"/><circle cx="15.8" cy="11.4" r=".9"/><circle cx="17.8" cy="13.1" r=".9"/>',
  stats: '<path d="M4 20V11"/><path d="M10 20V4"/><path d="M16 20v-6"/><path d="M22 20H2"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  play: '<path d="M8 5.5v13l11-6.5-11-6.5Z"/>',
  pause: '<path d="M9 5v14"/><path d="M15 5v14"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2.5"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  close: '<path d="m6 6 12 12"/><path d="m18 6-12 12"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  star: '<path d="m12 3.5 2.7 5.5 6 .9-4.35 4.25 1.03 6-5.38-2.83L6.62 20.2l1.03-6L3.3 9.9l6-.9L12 3.5Z"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M8 3v4"/><path d="M16 3v4"/><path d="M3.5 10h17"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  flame: '<path d="M12.2 3c.5 3-2.7 4.2-2.7 7 0 1.2.8 2.2 2 2.2 1.7 0 2.4-1.6 2.1-3.1 2.2 1.5 3.6 3.7 3.6 6.2A5.7 5.7 0 0 1 11.5 21 5.9 5.9 0 0 1 5.6 15c0-4 3.4-6.1 6.6-12Z"/>',
  trophy: '<path d="M8 4h8v4a4 4 0 0 1-8 0V4Z"/><path d="M8 5H4.5v2A3.5 3.5 0 0 0 8 10.5"/><path d="M16 5h3.5v2A3.5 3.5 0 0 1 16 10.5"/><path d="M12 12v5"/><path d="M8 21h8"/><path d="M9.5 17h5l1 4h-7l1-4Z"/>',
  trash: '<path d="M4.5 7h15"/><path d="M9 7V4.5h6V7"/><path d="m6.5 7 .8 12.2A1.8 1.8 0 0 0 9.1 21h5.8a1.8 1.8 0 0 0 1.8-1.8L17.5 7"/><path d="M10 11v6"/><path d="M14 11v6"/>',
  edit: '<path d="M4 20h4l10.5-10.5a2.8 2.8 0 0 0-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>',
  download: '<path d="M12 3.5v11"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M4 20h16"/>',
  upload: '<path d="M12 20.5v-11"/><path d="M7.5 13.5 12 9l4.5 4.5"/><path d="M4 4h16"/>',
  install: '<path d="M12 3.5v10"/><path d="m8 10 4 4 4-4"/><path d="M5 16.5v2.2A1.8 1.8 0 0 0 6.8 20.5h10.4a1.8 1.8 0 0 0 1.8-1.8v-2.2"/>',
  sparkles: '<path d="M12 3.5 13.6 8l4.4 1.6-4.4 1.6L12 15.7l-1.6-4.5L6 9.6 10.4 8 12 3.5Z"/><path d="M19 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z"/><path d="M5 15.5l.6 1.6 1.6.6-1.6.6L5 20l-.6-1.7-1.6-.6 1.6-.6L5 15.5Z"/>',
  check: '<path d="m4.5 12.5 4.6 4.5L19.5 6.5"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  sword: '<path d="m14.5 4.5 5 1-1 5L9 20l-2 .5L3 22l1.5-4L14.5 4.5Z"/><path d="m5 15 4 4"/><path d="m14 6 4 4"/>',
  leaf: '<path d="M20 4c-8 0-14 3.5-14 9.5A6.5 6.5 0 0 0 12.5 20C18.5 20 20 12 20 4Z"/><path d="M4 21c2-5 5.5-8 10-10"/>',
  cards: '<rect x="7.5" y="3.5" width="11" height="15" rx="2.2" transform="rotate(8 13 11)"/><rect x="5" y="6" width="10.5" height="14.5" rx="2.2"/><path d="m10.3 10 1.5 2.6 1.5-2.6-1.5-2.6-1.5 2.6Z"/>',
  car: '<path d="m4 14 1.4-4.2A2.4 2.4 0 0 1 7.7 8h8.6a2.4 2.4 0 0 1 2.3 1.8L20 14"/><path d="M3.5 14h17v4.2h-2v1.3h-2.5v-1.3h-8v1.3H5.5v-1.3h-2V14Z"/><path d="M6.5 16.5h.01"/><path d="M17.5 16.5h.01"/>',
  sprout: '<path d="M12 21v-7"/><path d="M12 14C12 9.5 9 7 4 7c0 5 3 7 8 7Z"/><path d="M12 12c0-3.5 2.5-5.5 7-5.5 0 4-2.5 5.5-7 5.5Z"/><path d="M8 21h8"/>',
  crown: '<path d="m3.5 8 4 3 4.5-6 4.5 6 4-3-2 10h-13l-2-10Z"/><path d="M6 21h12"/>',
  ghost: '<path d="M5 20V11a7 7 0 0 1 14 0v9l-2.3-1.7L14.4 20 12 18.3 9.6 20l-2.3-1.7L5 20Z"/><circle cx="9.5" cy="11" r=".9"/><circle cx="14.5" cy="11" r=".9"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z"/>',
  medal: '<circle cx="12" cy="14.5" r="5.5"/><path d="m8.5 9.5-3-5"/><path d="m15.5 9.5 3-5"/><path d="M12 12.5v4"/>',
  bolt: '<path d="M13.5 3 5 13.5h5L9.5 21 19 10.5h-5L13.5 3Z"/>',
  up: '<path d="M12 19V5"/><path d="m6 11 6-6 6 6"/>',
  down: '<path d="M12 5v14"/><path d="m6 13 6 6 6-6"/>',
  sliders: '<path d="M4 7h9"/><path d="M17 7h3"/><circle cx="15" cy="7" r="2"/><path d="M4 17h3"/><path d="M11 17h9"/><circle cx="9" cy="17" r="2"/>',
  monitor: '<rect x="3" y="4.5" width="18" height="12" rx="2.5"/><path d="M9 20.5h6"/><path d="M12 16.5v4"/>',
  tv: '<rect x="3" y="7" width="18" height="12" rx="2.5"/><path d="m8 3 4 4 4-4"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  gamepad: '<path d="M7.2 8h9.6c1.8 0 3 1.1 3.4 2.7l1.2 4.8c.3 1.4-.6 2.7-2 2.9-1 .1-1.8-.5-2.4-1.3L15.6 15H8.4L7 17.1c-.6.8-1.4 1.4-2.4 1.3-1.4-.2-2.3-1.5-2-2.9l1.2-4.8C4.2 9.1 5.4 8 7.2 8Z"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/><path d="M12 8h.01"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.4 6"/><path d="M20 4.5V11h-6.5"/>',
  grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6"/>',
  arrow: '<path d="M4 12h16"/><path d="m14 6 6 6-6 6"/>',
  filter: '<path d="M3.5 5.5h17"/><path d="M6.5 12h11"/><path d="M10 18.5h4"/>',
  rocket: '<path d="M13.5 5.5c2-2 5-2.5 6.5-2 .5 1.5 0 4.5-2 6.5L12 16l-4-4 5.5-6.5Z"/><path d="m8 12-3.5.5L3 16l4-.5"/><path d="m12 16-.5 3.5L8 21l.5-4"/><circle cx="16" cy="8" r="1.3"/>',
  pin: '<path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 5.5a3.5 3.5 0 0 1 0 6.5"/><path d="M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>',
  shield: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 7.8 7.5 9.5 4.3-1.7 7.5-4.9 7.5-9.5V6L12 3Z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  timer: '<circle cx="12" cy="13" r="7.5"/><path d="M12 9.5V13l2.5 1.5"/><path d="M9 2.5h6"/><path d="M12 2.5v3"/>',
  library: '<path d="M4.5 4.5h5v15h-5z"/><path d="M9.5 4.5h5v15h-5z"/><path d="m14.5 6 4.2-1 3.3 12.9-4.2 1z"/>',
};

export function icon(name, className = '') {
  const body = ICONS[name] || ICONS.sparkles;
  return `<svg class="icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
}

export function gameIcon(name) {
  return icon(name || 'gamepad', 'game-glyph');
}

export function logoMark(suffix = 'a') {
  return `<svg class="logo-mark" viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <rect x="1.5" y="1.5" width="45" height="45" rx="14" fill="url(#lg-${suffix})" stroke="rgba(255,255,255,.14)"/>
    <path d="M8 26h6.5l3-11 5.5 20 3.5-9H40" stroke="#0B1206" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
    <defs><linearGradient id="lg-${suffix}" x1="8" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse"><stop stop-color="#D9FF74"/><stop offset="1" stop-color="#9BE53E"/></linearGradient></defs>
  </svg>`;
}

# PlayGround

<!-- omgithub:readme:start -->
## 🚀 Build, play, and remix with OMGithub

**Created using [OMGithub.com](https://omgithub.com).**

[![OMGithub](https://img.shields.io/badge/OMGithub-Open%20project-orange?style=for-the-badge)](https://omgithub.com/dhararohon2-svg/PlayGround)
[![GitHub](https://img.shields.io/badge/GitHub-Source-181717?logo=github&style=for-the-badge)](https://github.com/dhararohon2-svg/PlayGround)

- 🎮 [Open the project](https://omgithub.com/dhararohon2-svg/PlayGround).
- ✨ [Remix this project](https://omgithub.com/?remix=dhararohon2-svg%2FPlayGround).
- 💻 [Explore the source](https://github.com/dhararohon2-svg/PlayGround).
- 🛠️ [Check build runs](https://github.com/dhararohon2-svg/PlayGround/actions).
- 🐛 [Report an issue](https://github.com/dhararohon2-svg/PlayGround/issues).
- 👤 [Explore the creator's projects](https://omgithub.com/dhararohon2-svg).
- 🌍 [Create with OMGithub](https://omgithub.com).
<!-- omgithub:readme:end -->

# PlayTrace — Game Session Tracker

PlayTrace is a local-first game session tracker for Android and the web. Start a live timer, log past sessions, and see where your playtime actually goes. Everything is stored on-device in `localStorage`; there are no accounts, servers, or analytics.

## Features

- **Live tracking** with pause/resume, a persistent dock, and wall-clock recovery after a reload or app restart.
- **Manual logging** with game, date/time, duration, rating, mood, and notes.
- **Session journal** with range/platform filters, search, day grouping, edit, and delete.
- **Game library** with generated cover art, favorites, platforms, genres, and per-game playtime.
- **Analytics** for weekly playtime, streaks, 8-week trends, genre/platform splits, records, a 13-week heatmap, and a weekly trace timeline.
- **Local data controls**: JSON export/import, demo reset, clear history, accent themes, and a weekly goal.
- **Installable PWA** with offline shell caching, plus a native Android WebView wrapper that bundles the same UI.
- **Responsive layout** with a desktop rail and a mobile tab bar + floating start button.

## Run the web app

The app is plain HTML, CSS, and ES modules. No build step is required.

```bash
python3 -m http.server 3002
# open http://localhost:3002/
```

`start.sh` does the same thing. During development, unregister the service worker (or clear site data) after editing assets, because the offline shell is cached.

## Test

```bash
node --test tests/*.test.mjs
```

The suite covers date/week math, aggregation, streaks, heatmap/timeline bounds, seed integrity, state sanitization, backup round-trips, and the web/Android asset contract.

## Build the Android app

Requirements: JDK 17 and Android SDK platform 36. The Gradle wrapper is included.

```bash
cd android
./gradlew assembleDebug
```

The debug APK is written to `android/app/build/outputs/apk/debug/app-debug.apk` (package `com.playtrace.app`, minSdk 26, targetSdk 36).

The `syncWebAssets` Gradle task copies `index.html`, `styles.css`, `manifest.webmanifest`, `src/`, `icons/`, and `assets/` into the APK automatically before every build, so the web app remains the single source of truth. The wrapper serves those files through `WebViewAssetLoader` on `https://appassets.androidplatform.net`, which keeps ES modules and `localStorage` working. The service worker is intentionally skipped in the native app because the assets are already local.

Android-specific behavior:

- System bar insets are applied to a container around the WebView, so content stays clear of the status bar and gesture navigation.
- The back gesture/button closes an open modal first, then walks WebView history, then exits.
- Export uses the system document picker (`ACTION_CREATE_DOCUMENT`); import uses the system file chooser.
- WebView debugging is enabled only for debuggable builds.

## Project layout

```
index.html              app shell
styles.css              design system, layout, responsive rules
src/app.js              rendering, routing, modals, timer, actions
src/data.js             platforms, genres, moods, palettes, seed data
src/stats.js            pure date/duration/aggregation helpers
src/store.js            localStorage load/save, sanitization, backup parsing
src/icons.js            inline SVG icon set and logo
manifest.webmanifest    PWA metadata
sw.js                   offline shell cache
icons/                  app icons
assets/fonts/           local Manrope + Space Grotesk woff2 files
tests/                  Node test suite
android/                Gradle WebView wrapper
```

## Data model

State is stored under `playtrace.v1`:

```json
{
  "version": 1,
  "profile": { "name": "Alex Rivera", "weeklyGoalHours": 12, "accent": "lime", "favorites": [] },
  "games": [{ "id": "game_001", "title": "Elden Ring", "platform": "PC", "genre": "RPG" }],
  "sessions": [{ "id": "session_001", "gameId": "game_001", "start": "...", "end": "...", "durationSec": 3600 }],
  "live": null
}
```

A live timer stores `gameId`, `startedAt`, `accumulatedMs`, `running`, and `notes`, so elapsed time is recomputed from the wall clock rather than a drifting interval.

## Notes

- The initial demo library is generated relative to the current date (8 games and 44 sessions, including a current streak) and is only written to storage after the first change.
- Fonts are Manrope and Space Grotesk, distributed under the SIL Open Font License.
- The UI is intentionally dependency-free; there is no root `package.json` so the static preview runtime can serve the app directly.

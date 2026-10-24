import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path), 'utf8');
const present = (path) => existsSync(join(root, path));

test('the app shell references local files that exist', () => {
  const html = read('index.html');
  const refs = [
    ...html.matchAll(/(?:href|src)="([^"]+)"/g),
    ...html.matchAll(/content="([^"]+\.png)"/g),
  ]
    .map((match) => match[1])
    .filter((ref) => !/^(https?:|#|data:)/.test(ref));

  assert.ok(refs.length >= 5);
  for (const ref of refs) {
    assert.ok(present(ref), `missing shell asset: ${ref}`);
  }
});

test('the manifest points at real icons and metadata', () => {
  const manifest = JSON.parse(read('manifest.webmanifest'));
  assert.equal(manifest.name, 'PlayTrace — Game Session Tracker');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.theme_color, '#070b09');
  assert.ok(manifest.icons.length >= 3);
  for (const icon of manifest.icons) {
    assert.ok(present(icon.src), `missing manifest icon: ${icon.src}`);
  }
});

test('the service worker shell is complete and versioned', () => {
  const sw = read('sw.js');
  const version = sw.match(/const VERSION = '([^']+)'/);
  assert.ok(version, 'missing service worker version');
  assert.match(version[1], /^playtrace-v\d+$/);

  const shellBlock = sw.match(/const SHELL = \[([\s\S]*?)\];/);
  assert.ok(shellBlock, 'missing service worker shell');
  const entries = [...shellBlock[1].matchAll(/'([^']+)'/g)].map((match) => match[1]);
  assert.ok(entries.includes('./index.html'));
  for (const entry of entries) {
    if (entry === './') continue;
    assert.ok(present(entry.replace(/^\.\//, '')), `missing cached asset: ${entry}`);
  }
});

test('the Android wrapper targets the local web bundle', () => {
  const activity = read('android/app/src/main/java/com/playtrace/app/MainActivity.java');
  assert.match(activity, /appassets\.androidplatform\.net\/assets\/index\.html/);
  assert.match(activity, /addPathHandler\("\/assets\/"/);
  assert.match(activity, /setDomStorageEnabled\(true\)/);
  assert.match(activity, /PlayTraceAndroid/);
  assert.match(activity, /registerOnBackInvokedCallback/);

  const gradle = read('android/app/build.gradle');
  assert.match(gradle, /compileSdk 36/);
  assert.match(gradle, /minSdk 26/);
  assert.match(gradle, /targetSdk 36/);
  assert.match(gradle, /syncWebAssets/);
  assert.match(gradle, /include 'src\/\*\*'/);
  assert.match(gradle, /include 'assets\/\*\*'/);
});

test('the Android manifest keeps the app private and launcher-visible', () => {
  const manifest = read('android/app/src/main/AndroidManifest.xml');
  assert.match(manifest, /android:usesCleartextTraffic="false"/);
  assert.match(manifest, /android:exported="true"/);
  assert.match(manifest, /android\.intent\.action\.MAIN/);
  assert.match(manifest, /android\.intent\.category\.LAUNCHER/);
  assert.match(manifest, /android:theme="@style\/Theme\.PlayTrace"/);
});

test('no root package.json shadows the static preview runtime', () => {
  assert.equal(present('package.json'), false);
});

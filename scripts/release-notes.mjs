#!/usr/bin/env node
// Writes the GitHub release text for a keyless Shore APK.
// Usage: node scripts/release-notes.mjs <version> [apk] > notes.md
// Reads only git history and the APK file, so it runs the same locally and in CI.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';

const [version = 'dev', apk] = process.argv.slice(2);
const repo = process.env.GITHUB_REPOSITORY || 'taynotfound/shore';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
const head = git('rev-parse', 'HEAD');

// Previous release: the newest v0.8.* tag that isn't this commit.
let previous = '';
try {
  previous = git('describe', '--tags', '--abbrev=0', '--match', 'v0.8.*', 'HEAD^');
} catch { /* first release, or tags not fetched */ }
const range = previous ? [`${previous}..HEAD`] : ['-n', '15', 'HEAD'];

const SEP = '\u001e', END = '\u001f';
const commits = git('log', ...range, `--pretty=format:%H${SEP}%s${SEP}%b${END}`)
  .split(END).map((c) => c.trim()).filter(Boolean).map((c) => {
    const [sha, subject, body = ''] = c.split(SEP);
    const files = git('show', '--name-only', '--pretty=format:', sha).split('\n').filter(Boolean);
    return { sha, subject: subject.trim(), body: clean(body), files };
  });

function clean(text) {
  return text.split('\n').filter((l) => !/^(Co-Authored-By|Signed-off-by):/i.test(l)).join('\n').trim();
}

// Areas a commit touched, worded for people installing the APK rather than for developers.
const AREAS = [
  ['TV app', (f) => f.startsWith('app/') || /assets-android\/(?!companion)/.test(f)],
  ['Android side', (f) => f.startsWith('android/') && !f.includes('/companion/')],
  ['Phone companion', (f) => f.includes('/companion/')],
  ['Wallpapers', (f) => /wallpaper|OnlineWallpapers/i.test(f)],
  ['Translations', (f) => f === 'app/i18n.js'],
  ['Website', (f) => f.startsWith('site/')],
  ['Docs', (f) => f.startsWith('docs/') || /\.md$/.test(f)],
  ['Build and checks', (f) => f.startsWith('scripts/') || f.startsWith('.github/') || f === 'package.json'],
];
const areasOf = (files) => AREAS.filter(([, test]) => files.some(test)).map(([name]) => name);
const userFacing = (c) => areasOf(c.files).some((a) => ['TV app', 'Android side', 'Phone companion', 'Wallpapers', 'Translations'].includes(a));

const latest = commits[0] || { subject: 'Shore ' + version, body: '', files: [] };
const highlights = commits.filter(userFacing);
const allAreas = [...new Set(commits.flatMap((c) => areasOf(c.files)))];
const short = (sha) => sha.slice(0, 7);
const link = (sha) => `[\`${short(sha)}\`](https://github.com/${repo}/commit/${sha})`;
const quote = (text) => text.split('\n').map((l) => l ? '> ' + l : '>').join('\n');

const out = [];
// Branded header. Images are pinned to this commit so old releases keep the artwork they shipped with.
const raw = (path) => `https://raw.githubusercontent.com/${repo}/${head}/${path}`;
out.push('<div align="center">', '');
out.push(`<img src="${raw('docs/brand/banner.gif')}" width="100%" alt="Shore: a calm home screen for Google TV">`, '');
out.push('**A calm home screen for Google TV: your apps, your HDMI devices, a beautiful picture and the time. Nothing else.**', '');
out.push(`[Website](https://taynotfound.github.io/shore/) · [README](https://github.com/${repo}#readme) · [All releases](https://github.com/${repo}/releases) · [Install steps](#install-or-update)`, '');
out.push('</div>', '', '---', '');
out.push(`## ${latest.subject}`, '');
if (latest.body) out.push(unwrap(latest.body), '');

if (highlights.length > 1) {
  out.push('### Also in this update', '');
  highlights.slice(1, 8).forEach((c) => out.push(`- **${c.subject}**${c.body ? ': ' + firstSentence(c.body) : ''}`));
  if (highlights.length > 8) out.push(`- …and ${highlights.length - 8} more in the changelog below.`);
  out.push('');
} else if (!highlights.length) {
  out.push('_No changes to the app itself in this build (website, docs or tooling only). Updating is optional._', '');
}

// Commit bodies are wrapped at ~72 columns; join wrapped lines but keep paragraphs and lists.
function unwrap(text) {
  return text.split(/\n\s*\n/).map((p) => /^\s*[-*] /m.test(p) ? p : p.replace(/\s*\n\s*/g, ' ')).join('\n\n');
}

function firstSentence(text) {
  // Bulleted bodies: the first bullet is the summary.
  if (/^\s*[-*] /.test(text)) text = text.split(/\n\s*[-*] /)[0].replace(/^\s*[-*] /, '');
  const flat = text.replace(/\s+/g, ' ').trim();
  const m = flat.match(/^(.{20,220}?[.!?])(\s|$)/);
  return m ? m[1] : flat.length > 220 ? flat.slice(0, 217) + '…' : flat;
}

if (allAreas.length) out.push(`**Touches:** ${allAreas.join(' · ')}`, '');

out.push(`<img src="${raw('docs/images/tcl/home.jpg')}" width="100%" alt="Shore on a TCL TV">`, '');

out.push('### Install or update', '');
out.push(`1. Download **\`shore-${version}.apk\`** below (or open \`github.com/${repo}/releases/latest\` in a TV browser or the Downloader app).`);
out.push('2. Install it. On a TV, allow *Install unknown apps* for the app you downloaded it with, or from a computer run `adb install -r shore-' + version + '.apk`.');
out.push('3. Updating keeps your settings, photos and Home layout: every release is signed with the same key, so it installs over the old one.');
out.push('4. First install only: set Shore as Home and, optionally, turn on the remote-button service and Notification access (see the README).', '');

out.push('### What works in this build', '');
out.push('This APK is **keyless**: it contains no API keys at all.', '');
out.push('| Works out of the box | Needs your own key and a build from source |');
out.push('| --- | --- |');
out.push('| Weather, Now Playing, album art, screensaver, phone companion, My photos | Unsplash themes |');
out.push('| NASA Astronomy Picture, NASA Image Library, Bing, Wikimedia, Picsum | Pexels and Klipy animated wallpapers |');
out.push('| Bundled Shore wallpapers and animated loops | Top Shelf recommendations (TMDB, YouTube, Twitch) |', '');

if (apk && existsSync(apk)) {
  const sha = createHash('sha256').update(readFileSync(apk)).digest('hex');
  const mb = (statSync(apk).size / 1048576).toFixed(1);
  out.push(`<sub>\`shore-${version}.apk\` · ${mb} MB · SHA-256 \`${sha}\`</sub>`, '');
}

// Collapsible changelog: one line per commit, with the full message folded underneath when there is one.
out.push('<details>', `<summary><b>Changelog</b>: ${previous ? `${commits.length} change${commits.length === 1 ? '' : 's'} since ${previous}` : `last ${commits.length} changes`}</summary>`, '');
commits.forEach((c) => {
  const tags = areasOf(c.files);
  out.push(`- ${link(c.sha)} **${c.subject}**${tags.length ? ' <sub>' + tags.join(', ') + '</sub>' : ''}`);
  // The newest commit's message is already the headline above.
  if (c.body && c !== latest) out.push('', quote(c.body).replace(/^/gm, '  '), '');
});
if (previous) out.push(`Full diff: [${previous}…v${version}](https://github.com/${repo}/compare/${previous}...v${version})`);
out.push('', '</details>');

process.stdout.write(out.join('\n') + '\n');

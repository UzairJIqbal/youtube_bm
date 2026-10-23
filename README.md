# YouTube Study Bookmarks

A Chrome extension (Manifest V3) for learners: bookmark moments in YouTube videos with one key, add notes and tags, loop clips, and export to Markdown/Obsidian. Everything is stored locally; there is no backend.

## Features (v1.0)

- **Alt+B** bookmarks the current moment, titled from the video's chapter
- **Alt+C** twice saves a clip (start → end) that can be looped
- Bookmark and clip buttons in the player, markers on the progress bar
- Popup: jump, loop, edit title/note/tags, nudge or type the start time, search
- Library page: every bookmark across all videos, with search, tag filters and Markdown export
- Optional automatic rewind on capture (Settings)
- Markdown export per video (copy or .md) and for everything (Settings)
- JSON backup and import, including files from the original version of this extension
- Automatic migration of bookmarks saved by the original version

## Development

```sh
npm install
npm run build   # type-check, then build popup/options/service worker and the content script into dist/
npm run lint
npm run zip     # build and package dist/ as youtube-study-bookmarks.zip for the Chrome Web Store
npm run e2e     # load dist/ into Playwright Chromium and test it against real YouTube videos
npm run store-assets  # regenerate the store screenshots and promo tiles
```

`npm run e2e` needs a network connection and the Playwright browser (`npx playwright install chromium`). It runs headless in a throwaway profile, so it never touches your own Chrome.

Load `dist/` at `chrome://extensions` → Developer mode → **Load unpacked**. Rebuild and click reload after changes.

## Layout

| Path | What it is |
|---|---|
| `public/manifest.json` | Extension manifest (copied to `dist/`) |
| `public/content.css` | Styles injected into YouTube, all prefixed `ytsb-` |
| `src/content/` | Content script: player buttons, capture, loop, markers. `player.ts` holds every YouTube selector |
| `src/background/` | Service worker: forwards keyboard shortcuts to the tab, migrates old data |
| `src/popup/`, `popup.html` | Toolbar popup (React) |
| `src/options/`, `options.html` | Settings, shortcuts, backup/import, Pro waitlist (React) |
| `src/library/`, `library.html` | Library of all bookmarks with search and tag filters (React) |
| `e2e/` | End-to-end test against live YouTube |
| `store-assets/` | Harness that renders the Chrome Web Store screenshots |
| `src/shared/` | Storage, types, time formatting, Markdown, backup format, messages |

The content script is built separately (`vite.content.config.ts`) as a single classic script, because Chrome content scripts can't be ES modules.

## Data

`chrome.storage.local`, one key per video: `video:<videoId>` → `{ videoId, videoTitle, bookmarks[], updatedAt }`, plus `settings`. Every view listens to `chrome.storage.onChanged`, so the popup, settings page and player stay in sync.

## Publishing

Store listing copy, permission justifications and the privacy disclosure are in [CHROMEWEBSTORE.md](CHROMEWEBSTORE.md); the privacy policy is [PRIVACY.md](PRIVACY.md), published from [docs/](docs/) with GitHub Pages.

Pushing a tag like `v1.0.1` runs the release workflow, which builds, lints and attaches the store zip to a GitHub release.

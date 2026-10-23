# Chrome Web Store Listing — YouTube Study Bookmarks

> Last Updated: 2026-10-23

## Store Listing

**Extension Name**
YouTube Study Bookmarks

**Short Description** (124 characters)
Bookmark moments in YouTube lectures with one key, add notes, loop the parts you need and export to Markdown or Obsidian.

**Detailed Description**

Save the moments that matter in long YouTube lectures, courses and tutorials, without pausing to type.

ONE KEY TO CAPTURE
Press Alt+B to bookmark the current moment. Each bookmark is titled automatically from the video's chapter, so you don't have to type anything while you watch. Add a note or tags later, when you have time.

CLIP & LOOP
Press Alt+C at the start and again at the end of an explanation to save it as a clip. Hit Loop to replay just that part until it sinks in.

SEE YOUR BOOKMARKS ON THE VIDEO
Your bookmarks and clips appear as markers on the progress bar. Hover over one to see its note.

FIX TIMING IN ONE CLICK
Pressed a little late? Nudge any bookmark a second earlier or later, type an exact time, or set an automatic rewind of a few seconds for every capture.

EXPORT TO YOUR NOTES
Copy a video's bookmarks as Markdown with clickable timestamp links. Paste them into Obsidian, Notion, Logseq or any notes app, or download a .md file. Export is always free.

HOW TO USE IT
1. Open any YouTube video.
2. Press Alt+B to bookmark, or Alt+C twice to save a clip. You can also use the two new buttons in the player.
3. Click the toolbar icon to see your bookmarks, jump to one, loop a clip, add notes and tags, or copy everything as Markdown.
4. Change the shortcuts at any time from the Settings page.

PRIVATE BY DESIGN
Your bookmarks are stored only in your browser. There's no account, no tracking and no analytics, and nothing is sent to any server. Back up and restore your bookmarks as a file from the Settings page.

NO LIMITS
No cap on bookmarks, notes or exports. A Pro version with sync, Notion and share links is planned. Everything in the free version will stay free.

Moving from the previous version of this extension? Your existing bookmarks are moved over automatically, and you can import older backup files from the Settings page.

**Category**
Productivity (alternative: Education, if offered in the dashboard)

**Single Purpose**
Lets users save, annotate, replay and export timestamped bookmarks for YouTube videos.

**Primary Language**
English

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon | 128×128 PNG | ✅ Ready | public/icons/icon-128.png |
| Screenshot 1 | 1280×800 | ✅ Ready | store-assets/out/screenshot-1-capture.png |
| Screenshot 2 | 1280×800 | ✅ Ready | store-assets/out/screenshot-2-notes.png |
| Screenshot 3 | 1280×800 | ✅ Ready | store-assets/out/screenshot-3-loop.png |
| Screenshot 4 | 1280×800 | ✅ Ready | store-assets/out/screenshot-4-export.png |
| Small Promo Tile | 440×280 | ✅ Ready | store-assets/out/promo-small-440x280.png |
| Marquee Promo Tile | 1400×560 | ✅ Ready | store-assets/out/promo-marquee-1400x560.png |

Regenerate all of them with `npm run store-assets`. It renders the real popup component with sample data next to a mock of the player, using headless Chrome. Swapping one for a real capture from a lecture video is a good upgrade once the extension is installed.

### Screenshot Notes
1. A lecture video with the player buttons, progress-bar markers and the "Bookmarked 12:34" toast. Caption: "One key to capture".
2. The popup open next to the video, with titled bookmarks, a note and tags. Caption: "Add notes when you have time".
3. A clip looping, with the Loop button active in the popup. Caption: "Loop the part you need".
4. The Markdown export pasted into Obsidian, with clickable timestamps. Caption: "Export to your notes".

## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| storage | permissions | Saves the user's bookmarks, notes, tags and settings in their own browser, so they're still there next time they open the video. |
| https://www.youtube.com/* | host_permissions | Adds the bookmark and clip buttons and the bookmark markers to the YouTube player, reads the current playback time and chapter title when the user saves a bookmark, and lets the popup tell which YouTube video is open so it can show that video's bookmarks. The extension runs on no other site. |

The keyboard shortcuts (`commands`) and the settings page (`options_page`) need no permission.

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** No. All data stays on the user's device.

What the extension stores locally: the video ID and title of each video the user bookmarks, the bookmark times, and the titles, notes and tags the user writes. None of this leaves the device unless the user exports a file.

| Data Type | Collected? | Transmitted Off-Device? | Purpose | Shared with Third Parties? |
|-----------|-----------|------------------------|---------|---------------------------|
| Personally identifiable info | No | No | — | No |
| Health info | No | No | — | No |
| Financial info | No | No | — | No |
| Authentication info | No | No | — | No |
| Personal communications | No | No | — | No |
| Location | No | No | — | No |
| Web history | No | No | — | No |
| User activity | No | No | — | No |
| Website content | No | No | — | No |

Note for the dashboard form: the bookmarks the user creates (video ID, title and time) are stored locally only and never collected by the developer. If the reviewer considers them "website content" or "web history", declare them as stored on-device only and not transmitted.

### Data Use Certification
- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

## Privacy Policy

**Privacy Policy URL**
⬜ Not hosted yet. The draft is in [PRIVACY.md](PRIVACY.md). Publish it, for example with GitHub Pages or a Notion page, and put the URL here.

## Distribution

**Visibility**: Public
**Regions**: All regions

## Developer Info

**Publisher Name**
⬜ To fill in

**Contact Email**
⬜ To fill in (shown publicly on the listing; a dedicated support address is better than a personal one)

**Support URL / Email**
⬜ To fill in, for example the GitHub Issues page

**Homepage URL**
⬜ Optional

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 1.0.0 | 2026-10-23 | Full rebuild. Hotkeys (Alt+B, Alt+C), automatic chapter titles, notes and tags, editable time with nudge and automatic rewind, Clip & Loop, progress-bar markers, Markdown export, backup and import, settings page. Bookmarks from the previous version are moved over automatically. Removed the `tabs` permission. | Draft |

## Review Notes

### Known Issues / Limitations
- Works on www.youtube.com watch and live pages. Shorts, embedded players on other sites and music.youtube.com are not supported in v1.0.
- YouTube tabs that were open before installing need a reload. The popup says so.
- Chapter titles are only available for videos that have chapters. Others are left untitled and show their time.
- Before submitting, replace `WAITLIST_URL` in `src/shared/config.ts` with the real waitlist form link.

### Rejection History
None yet.

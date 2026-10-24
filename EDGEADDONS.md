# Microsoft Edge Add-ons Listing — YouTube Study Bookmarks

> Last Updated: 2026-10-24

Edge runs Chrome extensions, so the package is the same `youtube-study-bookmarks.zip` built by `npm run zip`. Registering as an Edge developer is free. The store copy and privacy answers match [CHROMEWEBSTORE.md](CHROMEWEBSTORE.md), which is the source for anything not repeated here.

## 1. Register (one time)

1. Open https://partner.microsoft.com/dashboard/microsoftedge/overview and sign in with a Microsoft account.
2. Choose **Individual** account type, fill in the publisher display name and contact details, and verify your email.

## 2. Packages

Click **Create new extension** and upload `youtube-study-bookmarks.zip`. The dashboard reads the name, version and permissions from the manifest.

## 3. Availability

| Field | Value |
|---|---|
| Visibility | Public |
| Markets | All markets |

## 4. Properties

| Field | Value |
|---|---|
| Category | Productivity |
| Does the extension access, collect or transmit personal information? | No. Bookmarks are stored in the user's browser and never leave the device. |
| Privacy policy URL | https://uzairjiqbal.github.io/youtube_bm/privacy.html |
| Website URL | https://uzairjiqbal.github.io/youtube_bm/ |
| Support contact | https://github.com/UzairJIqbal/youtube_bm/issues |
| Mature content | No |

## Privacy

| Field | Value |
|---|---|
| Single purpose | Lets users save, annotate, replay and export timestamped bookmarks for YouTube videos. |
| Justification for `storage` | Saves the user's bookmarks, notes, tags and settings in their own browser, so they're still there next time they open the video. |
| Justification for `https://www.youtube.com/*` | Adds the bookmark and clip buttons and the bookmark markers to the YouTube player, reads the current playback time and chapter title when the user saves a bookmark, and lets the popup tell which YouTube video is open so it can show that video's bookmarks. The extension runs on no other site. |
| Remote code | No. All code is in the package. |
| Data collected | None. Leave every data type unticked: bookmarks are stored on the user's device and never sent anywhere. |
| Certifications | Tick all three: not sold to third parties, not used for unrelated purposes, not used for creditworthiness or lending. |
| Privacy policy URL | https://uzairjiqbal.github.io/youtube_bm/privacy.html |

## 5. Store listing (English)

**Description**
Paste the **Detailed Description** from [CHROMEWEBSTORE.md](CHROMEWEBSTORE.md#store-listing). It's over the 250-character minimum and mentions no browser by name.

**Short description** (if the form asks for one)
Bookmark moments in YouTube lectures with one key, add notes, loop clips and export to Markdown or Obsidian.

**Search terms** (7 terms, 13 words)
youtube bookmarks · timestamp notes · video notes · study tool · lecture notes · obsidian · markdown export

**Images**

| Field | Size | File |
|---|---|---|
| Extension store logo | 300×300 | store-assets/out/edge-logo-300x300.png |
| Small promotional tile | 440×280 | store-assets/out/promo-small-440x280.png |
| Large promotional tile | 1400×560 | store-assets/out/promo-marquee-1400x560.png |
| Screenshots 1–5 | 1280×800 | store-assets/out/screenshot-1-capture.png … screenshot-5-library.png |

## 6. Notes for certification

Paste this into the **Notes for certification** box on the submit page:

> No account or login is needed. To test: open any YouTube video with chapters (for example a long lecture), press Alt+B to save a bookmark, then press Alt+C twice a few seconds apart to save a clip. Click the toolbar icon to see both, add a note, click Loop on the clip and click Copy Markdown. Library (from the popup) searches every saved bookmark. All data is stored locally with chrome.storage; the extension makes no network requests.

## Version History

| Version | Date | Changes | Status |
|---|---|---|---|
| 1.0.1 | 2026-10-24 | First Edge release. The Settings page opens Edge's own shortcuts page. | Draft |

## Review Notes

Certification usually takes up to 7 business days. If it's rejected, the email lists the policy and the fix goes in the Version History above.

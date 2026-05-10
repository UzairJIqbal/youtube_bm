# YouTube Bookmark Extension - System Design Document

**Version:** 1.0  
**Author:** Development Team  
**Date:** 2026  
**Status:** Complete Design

---

## 1. Executive Summary

The YouTube Bookmark Extension is a Chrome extension that allows users to bookmark specific timestamps in YouTube videos with custom descriptions. The extension persists bookmarks across devices using Chrome's sync storage and provides a clean UI for managing and accessing saved timestamps.

**Core Features:**

- Bookmark YouTube video timestamps
- View all bookmarks for current video
- Delete bookmarks
- Cross-device synchronization
- Persistent storage

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────┐
│         YOUTUBE PAGE                │
│  (where user watches videos)        │
│                                     │
│  ┌─────────────────────────────┐   │
│  │    contentScript.js         │   │
│  │ ├── Inject bookmark button  │   │
│  │ ├── Capture timestamps      │   │
│  │ └── Manage bookmark data    │   │
│  └─────────────────────────────┘   │
└──────────────┬──────────────────────┘
               │
        Messages (IPC)
               │
┌──────────────▼──────────────────────┐
│      CHROME EXTENSION CORE           │
│                                      │
│  ┌──────────────────────────────┐  │
│  │    background.js             │  │
│  │ ├── Message routing          │  │
│  │ ├── Detect page changes      │  │
│  │ └── Manage service worker    │  │
│  └──────────────────────────────┘  │
│                                      │
│  ┌──────────────────────────────┐  │
│  │    chrome.storage.sync       │  │
│  │ ├── Persistent storage       │  │
│  │ ├── Cross-device sync        │  │
│  │ └── Bookmark data            │  │
│  └──────────────────────────────┘  │
└──────────────┬──────────────────────┘
               │
        Messages (IPC)
               │
┌──────────────▼──────────────────────┐
│         POPUP UI                     │
│  (extension popup window)            │
│                                      │
│  ┌──────────────────────────────┐  │
│  │    popup.js (React)          │  │
│  │ ├── Display bookmarks        │  │
│  │ ├── Handle user interactions │  │
│  │ └── Send delete requests     │  │
│  └──────────────────────────────┘  │
│                                      │
│  ┌──────────────────────────────┐  │
│  │    App.tsx (React Component) │  │
│  │ ├── Render bookmark list     │  │
│  │ ├── Manage popup state       │  │
│  │ └── Update UI                │  │
│  └──────────────────────────────┘  │
└──────────────────────────────────────┘
```

### 2.2 Component Responsibilities

| Component                     | Responsibility                               | Key Files             |
| ----------------------------- | -------------------------------------------- | --------------------- |
| **Content Script**            | Inject UI into YouTube, capture interactions | `contentScript.js`    |
| **Background Service Worker** | Route messages, detect page changes          | `background.js`       |
| **Popup UI**                  | Display and manage bookmarks                 | `App.tsx`, `popup.js` |
| **Storage Layer**             | Persist bookmarks across sessions            | `chrome.storage.sync` |
| **Utilities**                 | Helper functions                             | `utils.ts`            |

---

## 3. Data Model

### 3.1 Storage Structure

```javascript
// chrome.storage.sync structure

{
    // Key: YouTube Video ID
    // Value: JSON string of bookmark array

    "0n809nd4Zu4": "[
        {
            "time": 3119.001277,
            "desc": "Bookmark at :00:51:59"
        },
        {
            "time": 1016.612461,
            "desc": "Bookmark at :00:16:56"
        }
    ]",

    "62ZDQf7EYls": "[
        {
            "time": 5.212264,
            "desc": "Bookmark at :00:00:05"
        }
    ]"
}
```

### 3.2 Bookmark Object Schema

```typescript
interface Bookmark {
	time: number; // Video timestamp in seconds (float)
	desc: string; // User-friendly description (formatted as HH:MM:SS)
}

interface BookmarkStorage {
	[videoId: string]: string; // Serialized JSON array of Bookmarks
}
```

### 3.3 Message Contracts

#### NEW Video Message (background.js → contentScript.js)

```javascript
{
    type: "NEW",
    videoId: "0n809nd4Zu4"  // YouTube video ID
}
```

#### DELETE Bookmark Message (popup.js → contentScript.js)

```javascript
{
    type: "DELETE",
    value: 3119.001277  // Bookmark timestamp to delete
}
```

#### RESPONSE Message (contentScript.js → popup.js)

```javascript
[
	{
		time: 3119.001277,
		desc: "Bookmark at :00:51:59",
	},
	// ... other bookmarks
];
```

---

## 4. Data Flow

### 4.1 Add Bookmark Flow

```
User clicks bookmark button on YouTube
        ↓
contentScript.js detects click
        ↓
getCurrentTime() retrieves video timestamp
        ↓
getTime() converts seconds to HH:MM:SS format
        ↓
Create bookmark object:
{
    time: 3119.001277,
    desc: "Bookmark at :00:51:59"
}
        ↓
fetchBookmarks() retrieves current bookmarks for video
        ↓
Append new bookmark to array
        ↓
Sort bookmarks by time
        ↓
chrome.storage.sync.set() saves to storage
{
    [currentVideo]: JSON.stringify(updatedArray)
}
        ↓
✅ Bookmark saved permanently
```

### 4.2 View Bookmarks Flow

```
User opens extension popup
        ↓
popup.js/App.tsx initializes
        ↓
getCurrentTab() retrieves current YouTube tab
        ↓
Extract video ID from URL parameters
        ↓
Check if YouTube video page:
├── YES: proceed
└── NO: show "Not a YouTube video page"
        ↓
chrome.storage.sync.get([videoId], callback)
        ↓
contentScript → popup: send bookmarks array
        ↓
viewBookmark() function:
├── Clear previous bookmarks from DOM
├── Loop through bookmarks array
├── addnewBookmark() creates HTML for each
└── Insert into bookmarks container
        ↓
✅ Bookmarks displayed in popup UI
```

### 4.3 Delete Bookmark Flow

```
User clicks delete button in popup
        ↓
onDelete() function executes in popup.js
        ↓
Extract bookmark timestamp from DOM
        ↓
removeChild() - DELETE from UI immediately
(provides instant user feedback)
        ↓
chrome.tabs.sendMessage() sends to contentScript
{
    type: "DELETE",
    value: 3119.001277
}
        ↓
contentScript.js receives message
        ↓
allCurrentVideoBookmarks.filter()
removes bookmark where time === value
        ↓
chrome.storage.sync.set() saves updated array
        ↓
response() sends back updated bookmarks
        ↓
popup.js viewBookmark() callback
updates UI with new list
        ↓
✅ Bookmark permanently deleted from storage
```

### 4.4 Page Navigation Flow

```
User clicks new YouTube video
        ↓
URL changes from:
https://youtube.com/watch?v=oldVideoId
to:
https://youtube.com/watch?v=newVideoId
        ↓
background.js chrome.tabs.onUpdated listener fires
        ↓
Check if URL includes "youtube.com/watch"
        ↓
Extract new video ID from URL parameters
        ↓
chrome.tabs.sendMessage(tabId, {
    type: "NEW",
    videoId: newVideoId
})
        ↓
contentScript.js receives message
        ↓
currentVideo = newVideoId
        ↓
newVideoLoaded() checks if bookmark button exists
├── YES: skip (button already injected)
└── NO: inject button (first time on this video)
        ↓
fetchBookmarks() retrieves bookmarks for new video
        ↓
✅ Ready for new video
```

---

## 5. File Structure

```
youtube-bookmark-extension/
│
├── public/                          # Static extension files
│   ├── manifest.json               # Extension configuration
│   ├── background.js               # Background service worker
│   ├── contentScript.js            # Content script for YouTube pages
│   ├── popup.js                    # Popup initialization
│   ├── utils.ts                    # Utility functions
│   └── assets/
│       └── bookmark.png            # Bookmark button icon
│
├── src/                            # React source files
│   ├── App.tsx                     # Main React component (Popup UI)
│   ├── App.css                     # Popup styling
│   ├── main.tsx                    # React entry point
│   ├── index.css                   # Global styles
│   └── index.html                  # Popup HTML
│
├── dist/                           # Compiled output (generated by Vite)
│   ├── index.html
│   ├── manifest.json
│   ├── background.js
│   ├── contentScript.js
│   ├── popup.js
│   ├── assets/
│   └── (bundled React code)
│
├── vite.config.ts                  # Vite build configuration
├── tsconfig.json                   # TypeScript configuration
├── package.json                    # Dependencies
└── README.md                        # Documentation
```

---

## 6. Communication Protocols

### 6.1 Message Passing (Chrome IPC)

```
┌────────────────────────────────────────────┐
│  INTER-PROCESS COMMUNICATION (IPC)         │
└────────────────────────────────────────────┘

popup.js ←→ contentScript.js
│
├── Channel: chrome.tabs.sendMessage()
├── Direction: popup sends, contentScript responds
├── Message Type: { type, value }
└── Response: Updated bookmarks array

background.js → contentScript.js
│
├── Channel: chrome.tabs.sendMessage()
├── Direction: one-way notification
├── Message Type: { type: "NEW", videoId }
└── No response expected
```

### 6.2 Storage Access Pattern

```
All files can read/write to chrome.storage.sync

Read:
chrome.storage.sync.get([key], (result) => {
    const data = result[key];
})

Write:
chrome.storage.sync.set({
    [key]: JSON.stringify(data)
})

Key naming: videoId (e.g., "0n809nd4Zu4")
Value format: JSON stringified bookmark array
```

---

## 7. State Management

### 7.1 contentScript.js State

```javascript
let currentVideo = ""; // Current video ID
let allCurrentVideoBookmarks = []; // Current video's bookmarks in memory
let youtubeRightControls = null; // Reference to YouTube controls
let youtubePlayer = null; // Reference to video player
```

**State Lifecycle:**

- Initialized when message arrives from background.js
- Updated when bookmarks are added/deleted
- Persisted to chrome.storage.sync
- Fetched fresh when new video loads

### 7.2 popup.js State (React)

```typescript
// Via App.tsx React component
const [bookmarks, setBookmarks] = useState([]);
const [currentTab, setCurrentTab] = useState(null);
const [isYouTubeVideo, setIsYouTubeVideo] = useState(false);
```

**State Lifecycle:**

- Initialized on popup open
- Updated when delete message responds
- Cleared when switching videos

---

## 8. Error Handling

### 8.1 Error Scenarios

| Scenario                                    | Handling                                         | File             |
| ------------------------------------------- | ------------------------------------------------ | ---------------- |
| Message received before contentScript ready | Guard check: `if (!object \|\| !object.type)`    | contentScript.js |
| chrome.storage fails                        | Check `chrome.runtime.lastError` inside callback | All files        |
| User not on YouTube video                   | Show message: "Not a YouTube video page"         | popup.js         |
| Bookmark time extraction fails              | Log and skip that bookmark                       | contentScript.js |
| Storage quota exceeded                      | Graceful degradation (likely won't happen)       | All files        |

### 8.2 Error Checking Pattern

```javascript
// Inside chrome API callbacks, ALWAYS check:
chrome.storage.sync.get([key], (result) => {
	if (chrome.runtime.lastError) {
		console.log(chrome.runtime.lastError);
		return; // Stop execution
	}
	// Safe to proceed with result
});
```

---

## 9. Extension Manifest Configuration

```json
{
	"manifest_version": 3,
	"name": "YouTube Bookmarks",
	"version": "1.0",

	"permissions": ["storage", "scripting", "tabs"],

	"action": {
		"default_popup": "index.html",
		"default_title": "YouTube Bookmarks"
	},

	"background": {
		"service_worker": "background.js"
	},

	"content_scripts": [
		{
			"matches": ["https://www.youtube.com/*"],
			"js": ["contentScript.js"]
		}
	],

	"web_accessible_resources": [
		{
			"resources": ["assets/bookmark.png"],
			"matches": ["https://www.youtube.com/*"]
		}
	]
}
```

---

## 10. User Workflows

### 10.1 Workflow: Add a Bookmark

1. User opens YouTube video
2. User clicks the bookmark button (injected by extension)
3. Bookmark is immediately saved to storage
4. User sees visual feedback (bookmark added)

**Time:** Instant

### 10.2 Workflow: View Bookmarks

1. User clicks extension icon
2. Popup opens showing current video's bookmarks
3. Each bookmark shows timestamp and description
4. Bookmarks sorted by time

**Time:** 200-500ms

### 10.3 Workflow: Delete a Bookmark

1. User sees bookmark in popup
2. User clicks delete button
3. Bookmark disappears from UI immediately
4. Storage updates in background
5. On refresh, bookmark stays deleted

**Time:** Instant (UI), 100-200ms (storage)

### 10.4 Workflow: Cross-Device Access

1. User bookmarks video on laptop
2. Opens same video on phone
3. Bookmarks automatically sync via chrome.storage.sync
4. All devices see same bookmarks

**Time:** Depends on Chrome sync (usually 1-5 seconds)

---

## 11. Performance Considerations

### 11.1 Optimization Strategies

| Area                 | Strategy                                          | Benefit                       |
| -------------------- | ------------------------------------------------- | ----------------------------- |
| **UI Update**        | Remove from DOM immediately, update storage async | Instant feedback              |
| **Storage Access**   | Fetch only current video bookmarks                | Minimal data transfer         |
| **Message Passing**  | Only send updated bookmarks when needed           | Reduces IPC overhead          |
| **JSON Parsing**     | Parse only once per video load                    | CPU efficiency                |
| **Bookmark Sorting** | Sort on save, not on display                      | O(n log n) once, not repeated |

### 11.2 Storage Limits

- **Per key:** 8KB (sufficient for ~100 bookmarks per video)
- **Total:** 100KB (sufficient for hundreds of bookmarks across videos)
- **Sync:** Automatic, no manual management needed

---

## 12. Security Considerations

### 12.1 Security Measures

| Threat                 | Mitigation                                 |
| ---------------------- | ------------------------------------------ |
| **XSS in popup**       | React escapes all user input automatically |
| **Malicious messages** | Guard checks validate message structure    |
| **Storage tampering**  | Only extension code can modify storage     |
| **Cross-site access**  | Content script limited to youtube.com      |

### 12.2 Data Privacy

- Bookmarks stored locally in user's Chrome profile
- Synced only to user's Google account (if syncing enabled)
- No third-party servers involved
- No tracking or analytics

---

## 13. Future Enhancements

### 13.1 Potential Features

1. **Labels/Categories** - Tag bookmarks with custom categories
2. **Search** - Search bookmarks by description
3. **Export/Import** - Backup bookmarks to JSON
4. **Notes** - Add longer notes to bookmarks
5. **Sharing** - Share bookmark links with others
6. **Statistics** - Show bookmark frequency per video
7. **Keyboard Shortcuts** - Quick bookmark with hotkey

### 13.2 Scalability

Current design scales to:

- **Unlimited videos** (only limited by storage quota)
- **~100 bookmarks per video** (8KB limit per key)
- **Multiple users** (independent Chrome profiles)

---

## 14. Testing Strategy

### 14.1 Test Coverage

```
Unit Tests:
├── getTime() - timestamp conversion
├── fetchBookmarks() - storage retrieval
└── viewBookmark() - DOM manipulation

Integration Tests:
├── Add bookmark flow
├── Delete bookmark flow
├── View bookmarks flow
└── Cross-video navigation

E2E Tests:
├── User creates bookmark
├── User deletes bookmark
├── User switches videos
└── Bookmarks persist on refresh
```

### 14.2 Manual Testing Checklist

- [ ] Bookmark button appears on YouTube
- [ ] Bookmarks save correctly
- [ ] Popup shows bookmarks
- [ ] Delete removes bookmark
- [ ] Refresh preserves bookmarks
- [ ] Different videos have separate bookmarks
- [ ] Cross-device sync works
- [ ] Error messages display appropriately

---

## 15. Deployment & Maintenance

### 15.1 Build Process

```bash
# Development
npm install
npm run dev

# Production
npm run build
# Output: dist/ folder ready for Chrome Web Store
```

### 15.2 Chrome Web Store Submission

1. Build extension: `npm run build`
2. Create developer account on Chrome Web Store
3. Upload `dist/` folder
4. Complete store listing details
5. Submit for review

### 15.3 Version Management

- Semver versioning (Major.Minor.Patch)
- Update manifest.json version for each release
- Keep CHANGELOG documenting updates
- Test on Chrome beta before release

---

## 16. Conclusion

The YouTube Bookmark Extension follows a clean, modular architecture with clear separation of concerns:

- **contentScript.js** manages bookmark data and YouTube integration
- **background.js** routes messages and detects navigation
- **popup.js** provides user interface and sends user actions
- **chrome.storage.sync** persists data across devices

This design ensures reliability, scalability, and maintainability while providing a smooth user experience.

---

**Document Version:** 1.0  
**Last Updated:** 2026  
**Status:** Complete and Production-Ready

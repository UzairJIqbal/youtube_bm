youtube_ym (Chrome Extension Project)
│
├── 📋 Configuration Files
│ ├── manifest.json ← Chrome extension configuration
│ ├── vite.config.ts ← Vite build configuration
│ ├── tsconfig.json ← TypeScript configuration
│ ├── package.json ← Dependencies
│ └── eslint.config.js ← Code linting
│
├── 🎨 Frontend UI (React + Vite)
│ └── src/
│ ├── App.tsx ← Main React component (Popup UI)
│ ├── main.tsx ← React entry point
│ ├── App.css ← Modern styling
│ ├── index.css ← Global CSS + CSS variables
│ └── assets/ ← UI assets
│
├── 🔌 Chrome Extension Scripts
│ └── public/
│ ├── manifest.json ← Extension manifest
│ ├── contentScript.js ← Injects bookmark button into YouTube
│ │ └── Listens for: NEW, PLAY, DELETE messages
│ │ └── Manages: currentTime, bookmark creation
│ │
│ ├── popup.js ← Popup UI controller
│ │ ├── createSearchBarInput() ← Search functionality
│ │ ├── filterbookmarks() ← Filter logic
│ │ ├── viewBookmark() ← Render bookmarks
│ │ ├── onPlay() ← Play bookmark
│ │ ├── onDelete() ← Delete bookmark
│ │ └── fetchAndUpdateBookmarks() ← Storage management
│ │
│ ├── background.js ← Service worker
│ ├── utils.js ← Helper utilities
│ │
│ └── assets/
│ ├── bookmark.png ← Bookmark icon
│ ├── play.png ← Play icon
│ ├── delete.png ← Delete icon
│ └── ext-icon.png ← Extension icon
│
├── 📄 Documentation
│ ├── README.md
│ └── system-design.md
│
└── 📦 Build Output
└── dist/ ← Compiled extension files

YouTube Video Page (youtube.com)
│
├── contentScript.js (Injected)
│ │
│ └─ Bookmark Button Clicked
│ │
│ ├─ Get current timestamp
│ ├─ Create bookmark object {time, desc, title}
│ └─ Save to chrome.storage.sync
│
Popup Window (Extension UI)
│
├── popup.js (Updates state)
│ │
│ ├─ fetchAndUpdateBookmarks()
│ │ └─ Reads from chrome.storage.sync
│ │ └─ Updates: updatedvideoBookmarks[]
│ │
│ ├─ filterbookmarks(searchQuery)
│ │ └─ Filters updatedvideoBookmarks
│ │ └─ Returns filtered array
│ │
│ └─ viewBookmark(filteredArray)
│ └─ Renders to DOM via App.tsx
│
└── App.tsx (React Component)
├─ <div className="container">
│ ├─ Title & Search Bar
│ │ └─ createSearchBarInput() → triggers filter
│ │
│ └─ <div id="bookmarks">
│ ├─ Bookmark List
│ │ └─ Play & Delete buttons
│ │
│ └─ onDelete() → Deletes from storage → Re-fetches → Re-renders

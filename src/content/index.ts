import type { ContentMessage, ContentState } from "../shared/messages";
import { addBookmark, getSettings, getVideo, onVideosChanged } from "../shared/storage";
import { formatTime } from "../shared/time";
import { isClip, type Bookmark } from "../shared/types";
import { getVideoIdFromUrl } from "../shared/youtube";
import {
	getChapterTitleSoon,
	getProgressBar,
	getRightControls,
	getVideoElement,
	getVideoTitle,
	waitFor,
} from "./player";

const BOOKMARK_ICON =
	'<svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><path fill="currentColor" d="M7 4h10a1 1 0 0 1 1 1v15l-6-3.5L6 20V5a1 1 0 0 1 1-1zm1 2v10.5l4-2.3 4 2.3V6H8z"/><path fill="currentColor" d="M11 7.5h2v2h2v2h-2v2h-2v-2H9v-2h2z"/></svg>';
const CLIP_ICON =
	'<svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><path fill="currentColor" d="M4 6h2v12H4zm14 0h2v12h-2zM8 11h8v2H8z"/><path fill="currentColor" d="M9 8l-3 4 3 4zm6 0v8l3-4z"/></svg>';

let videoId: string | null = null;
/** When the current video was opened; the chapter label isn't ready for a moment after. */
let openedAt = 0;
let pendingClipStart: number | null = null;
let loop: { start: number; end: number } | null = null;
let bookmarks: Bookmark[] = [];

// ---------- Toast ----------

let toastTimer: ReturnType<typeof setTimeout> | undefined;

function toast(text: string): void {
	const host = document.querySelector("#movie_player") ?? document.body;
	let el = document.querySelector<HTMLDivElement>(".ytsb-toast");
	if (!el) {
		el = document.createElement("div");
		el.className = "ytsb-toast";
		el.setAttribute("role", "status");
	}
	if (el.parentElement !== host) host.appendChild(el);
	el.textContent = text;
	el.classList.add("ytsb-toast--visible");
	clearTimeout(toastTimer);
	toastTimer = setTimeout(() => el?.classList.remove("ytsb-toast--visible"), 2200);
}

// ---------- Capture ----------

async function captureTime(): Promise<number | null> {
	const video = getVideoElement();
	if (!video || !videoId) return null;
	const { offsetSeconds } = await getSettings();
	return Math.max(0, video.currentTime - offsetSeconds);
}

async function addPointBookmark(): Promise<void> {
	const start = await captureTime();
	if (start === null || !videoId) return;
	await addBookmark(videoId, getVideoTitle(), {
		start,
		title: await getChapterTitleSoon(Date.now() - openedAt < 5000 ? 1500 : 0),
		note: "",
		tags: [],
	});
	toast(`Bookmarked ${formatTime(start)}`);
}

async function toggleClip(): Promise<void> {
	const time = await captureTime();
	if (time === null || !videoId) return;

	if (pendingClipStart === null) {
		pendingClipStart = time;
		renderButtons();
		toast(`Clip starts at ${formatTime(time)} — press again to set the end`);
		return;
	}

	const start = Math.min(pendingClipStart, time);
	// Use the raw time for the end: the offset only corrects late starts.
	const end = Math.max(pendingClipStart, getVideoElement()?.currentTime ?? time);
	pendingClipStart = null;
	renderButtons();
	if (end - start < 1) {
		toast("Clip cancelled (too short)");
		return;
	}
	await addBookmark(videoId, getVideoTitle(), {
		start,
		end,
		title: await getChapterTitleSoon(Date.now() - openedAt < 5000 ? 1500 : 0),
		note: "",
		tags: [],
	});
	toast(`Saved clip ${formatTime(start)}–${formatTime(end)}`);
}

// ---------- Loop ----------

function onTimeUpdate(this: HTMLVideoElement): void {
	if (loop && this.currentTime >= loop.end) {
		this.currentTime = loop.start;
	}
}

function startLoop(start: number, end: number): void {
	const video = getVideoElement();
	if (!video) return;
	loop = { start, end };
	video.currentTime = start;
	void video.play();
	toast(`Looping ${formatTime(start)}–${formatTime(end)}`);
}

function stopLoop(): void {
	if (!loop) return;
	loop = null;
	toast("Loop stopped");
}

// ---------- Player buttons ----------

function makeButton(className: string, icon: string, onClick: () => void): HTMLButtonElement {
	const button = document.createElement("button");
	button.className = `ytp-button ytsb-button ${className}`;
	button.innerHTML = icon;
	button.addEventListener("click", (e) => {
		e.stopPropagation();
		onClick();
	});
	return button;
}

function renderButtons(): void {
	const controls = getRightControls();
	if (!controls) return;

	let bookmarkBtn = controls.querySelector<HTMLButtonElement>(".ytsb-bookmark");
	let clipBtn = controls.querySelector<HTMLButtonElement>(".ytsb-clip");
	if (!bookmarkBtn) {
		bookmarkBtn = makeButton("ytsb-bookmark", BOOKMARK_ICON, () => void addPointBookmark());
		clipBtn = makeButton("ytsb-clip", CLIP_ICON, () => void toggleClip());
		controls.prepend(bookmarkBtn, clipBtn);
	}
	bookmarkBtn.title = "Bookmark this moment (Alt+B)";
	bookmarkBtn.setAttribute("aria-label", bookmarkBtn.title);
	if (clipBtn) {
		const pending = pendingClipStart !== null;
		clipBtn.title = pending
			? `Clip started at ${formatTime(pendingClipStart ?? 0)} — click to set the end (Alt+C)`
			: "Start a clip (Alt+C)";
		clipBtn.setAttribute("aria-label", clipBtn.title);
		clipBtn.classList.toggle("ytsb-button--active", pending);
	}
}

// ---------- Progress-bar markers ----------

function renderMarkers(): void {
	const bar = getProgressBar();
	const video = getVideoElement();
	if (!bar) return;

	let layer = bar.querySelector<HTMLDivElement>(".ytsb-markers");
	if (!layer) {
		layer = document.createElement("div");
		layer.className = "ytsb-markers";
		bar.appendChild(layer);
	}
	layer.replaceChildren();

	const duration = video?.duration;
	if (!duration || !Number.isFinite(duration)) return;

	for (const b of bookmarks) {
		const marker = document.createElement("div");
		marker.className = isClip(b) ? "ytsb-marker ytsb-marker--clip" : "ytsb-marker";
		marker.style.left = `${(b.start / duration) * 100}%`;
		if (isClip(b)) marker.style.width = `${((b.end - b.start) / duration) * 100}%`;
		const label = `${formatTime(b.start)}${b.title ? ` · ${b.title}` : ""}`;
		marker.title = b.note ? `${label}\n${b.note}` : label;
		layer.appendChild(marker);
	}
}

async function refreshBookmarks(): Promise<void> {
	bookmarks = videoId ? ((await getVideo(videoId))?.bookmarks ?? []) : [];
	renderMarkers();
}

// ---------- Navigation ----------

let boundVideo: HTMLVideoElement | null = null;

async function onNavigate(): Promise<void> {
	const id = getVideoIdFromUrl(location.href);
	if (id !== videoId) {
		videoId = id;
		openedAt = Date.now();
		pendingClipStart = null;
		loop = null;
	}
	if (!videoId) return;

	const controls = await waitFor(getRightControls);
	if (!controls) return;
	renderButtons();

	const video = getVideoElement();
	if (video && video !== boundVideo) {
		boundVideo?.removeEventListener("timeupdate", onTimeUpdate);
		boundVideo?.removeEventListener("durationchange", renderMarkers);
		video.addEventListener("timeupdate", onTimeUpdate);
		video.addEventListener("durationchange", renderMarkers);
		boundVideo = video;
	}
	await refreshBookmarks();
}

// ---------- Messages ----------

chrome.runtime.onMessage.addListener((message: ContentMessage, _sender, sendResponse) => {
	switch (message.type) {
		case "PLAY": {
			const video = getVideoElement();
			if (video) video.currentTime = message.seconds;
			loop = null;
			sendResponse(true);
			return false;
		}
		case "LOOP":
			startLoop(message.start, message.end);
			sendResponse(true);
			return false;
		case "STOP_LOOP":
			stopLoop();
			sendResponse(true);
			return false;
		case "GET_STATE": {
			const state: ContentState = {
				videoId,
				videoTitle: videoId ? getVideoTitle() : "",
				currentTime: getVideoElement()?.currentTime ?? 0,
				pendingClipStart,
				loop,
			};
			sendResponse(state);
			return false;
		}
		case "COMMAND":
			(async () => {
				if (message.command === "add-bookmark") await addPointBookmark();
				else await toggleClip();
				sendResponse(true);
			})();
			return true;
	}
	return false;
});

onVideosChanged(() => void refreshBookmarks());
document.addEventListener("yt-navigate-finish", () => void onNavigate());
void onNavigate();

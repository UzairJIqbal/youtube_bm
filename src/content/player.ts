// Every YouTube DOM selector lives here, so a YouTube redesign is a one-file fix.

export function getVideoElement(): HTMLVideoElement | null {
	return (
		document.querySelector<HTMLVideoElement>("#movie_player video.html5-main-video") ??
		document.querySelector<HTMLVideoElement>("video.html5-main-video") ??
		document.querySelector<HTMLVideoElement>("#movie_player video")
	);
}

export function getRightControls(): HTMLElement | null {
	return document.querySelector<HTMLElement>("#movie_player .ytp-right-controls");
}

export function getProgressBar(): HTMLElement | null {
	return document.querySelector<HTMLElement>("#movie_player .ytp-progress-bar");
}

export function getChapterTitle(): string {
	const el = document.querySelector("#movie_player .ytp-chapter-title-content");
	return el?.textContent?.trim() ?? "";
}

export function getVideoTitle(): string {
	const el =
		document.querySelector("h1.ytd-watch-metadata yt-formatted-string") ??
		document.querySelector("h1.ytd-watch-metadata");
	const text = el?.textContent?.trim();
	if (text) return text;
	return document.title.replace(/^\(\d+\)\s*/, "").replace(/\s*-\s*YouTube$/, "");
}

/** Resolves once `find` returns an element, or with null after the timeout. */
export function waitFor<T>(find: () => T | null, timeoutMs = 15000): Promise<T | null> {
	const found = find();
	if (found) return Promise.resolve(found);
	return new Promise((resolve) => {
		const observer = new MutationObserver(() => {
			const el = find();
			if (el) {
				observer.disconnect();
				clearTimeout(timer);
				resolve(el);
			}
		});
		const timer = setTimeout(() => {
			observer.disconnect();
			resolve(null);
		}, timeoutMs);
		observer.observe(document.documentElement, { childList: true, subtree: true });
	});
}

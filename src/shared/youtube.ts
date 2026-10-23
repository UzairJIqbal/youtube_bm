const VIDEO_ID = /^[\w-]{11}$/;

/** Extracts the video ID from a youtube.com watch or live URL. */
export function getVideoIdFromUrl(url: string | undefined): string | null {
	if (!url) return null;
	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		return null;
	}
	if (!/(^|\.)youtube\.com$/.test(parsed.hostname)) return null;

	if (parsed.pathname === "/watch") {
		const id = parsed.searchParams.get("v");
		return id && VIDEO_ID.test(id) ? id : null;
	}
	const live = parsed.pathname.match(/^\/live\/([\w-]{11})/);
	return live ? live[1] : null;
}

export function watchUrl(videoId: string, seconds?: number): string {
	const base = `https://www.youtube.com/watch?v=${videoId}`;
	return seconds === undefined ? base : `${base}&t=${Math.floor(seconds)}s`;
}

import type { Bookmark, VideoRecord } from "./types";

function matches(record: VideoRecord, b: Bookmark, words: string[]): boolean {
	const haystack = [record.videoTitle, b.title, b.note, ...b.tags.map((t) => `#${t}`)]
		.join(" ")
		.toLowerCase();
	return words.every((w) => haystack.includes(w));
}

/**
 * Keeps the bookmarks that contain every word of the query (in the video title, bookmark
 * title, note or #tags) and carry the tag, if one is given. Videos left empty are dropped.
 */
export function filterVideos(videos: VideoRecord[], query: string, tag: string | null): VideoRecord[] {
	const words = query.toLowerCase().split(/\s+/).filter(Boolean);
	return videos
		.map((v) => ({
			...v,
			bookmarks: v.bookmarks.filter((b) => (!tag || b.tags.includes(tag)) && matches(v, b, words)),
		}))
		.filter((v) => v.bookmarks.length > 0);
}

/** Every tag with how many bookmarks use it, most used first, then alphabetically. */
export function countTags(videos: VideoRecord[]): [tag: string, count: number][] {
	const counts = new Map<string, number>();
	for (const v of videos) for (const b of v.bookmarks) for (const t of b.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
	return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

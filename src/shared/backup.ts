import type { Bookmark, VideoRecord } from "./types";
import { newId } from "./storage";

export interface BackupFile {
	app: "yt-study-bookmarks";
	version: 1;
	exportedAt: string;
	videos: VideoRecord[];
}

export function createBackup(videos: VideoRecord[]): BackupFile {
	return { app: "yt-study-bookmarks", version: 1, exportedAt: new Date().toISOString(), videos };
}

interface LegacyBookmark {
	time?: number;
	desc?: string;
}

function fromLegacy(videoId: string, items: LegacyBookmark[]): VideoRecord {
	const bookmarks: Bookmark[] = items
		.filter((i) => typeof i.time === "number")
		.map((i) => ({
			id: newId(),
			start: i.time as number,
			title: (i.desc ?? "").replace(/^Bookmark at :?[\d:]+$/, ""),
			note: "",
			tags: [],
			createdAt: Date.now(),
		}));
	return { videoId, videoTitle: "", bookmarks, updatedAt: Date.now() };
}

function parseLegacyValue(value: unknown): LegacyBookmark[] {
	if (Array.isArray(value)) return value as LegacyBookmark[];
	if (typeof value === "string") {
		try {
			const parsed = JSON.parse(value);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}
	return [];
}

/**
 * Reads a backup from this version or from the original extension, whose exports
 * looked like `{ importFileId, jsonParseFileBookmarks }`.
 */
export function parseBackup(text: string): VideoRecord[] {
	const data = JSON.parse(text);

	if (data?.app === "yt-study-bookmarks" && Array.isArray(data.videos)) {
		return (data.videos as VideoRecord[]).filter(
			(v) => typeof v.videoId === "string" && Array.isArray(v.bookmarks),
		);
	}

	if (typeof data?.importFileId === "string") {
		return [fromLegacy(data.importFileId, parseLegacyValue(data.jsonParseFileBookmarks))];
	}

	throw new Error("This file isn't a bookmarks backup.");
}

/** Converts the original extension's chrome.storage.sync data (videoId → JSON string). */
export function fromLegacySync(items: Record<string, unknown>): VideoRecord[] {
	return Object.entries(items)
		.filter(([key]) => /^[\w-]{11}$/.test(key))
		.map(([key, value]) => fromLegacy(key, parseLegacyValue(value)))
		.filter((v) => v.bookmarks.length > 0);
}

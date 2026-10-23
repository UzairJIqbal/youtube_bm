export interface Bookmark {
	id: string;
	/** Seconds from the start of the video. */
	start: number;
	/** Set only for clips (a start→end range). */
	end?: number;
	/** Empty means "untitled"; the UI falls back to the formatted time. */
	title: string;
	note: string;
	tags: string[];
	createdAt: number;
}

export interface VideoRecord {
	videoId: string;
	videoTitle: string;
	bookmarks: Bookmark[];
	updatedAt: number;
}

export interface Settings {
	/** Seconds subtracted from the capture time, to make up for pressing late. */
	offsetSeconds: number;
}

export const DEFAULT_SETTINGS: Settings = { offsetSeconds: 0 };

export const isClip = (b: Bookmark): b is Bookmark & { end: number } =>
	typeof b.end === "number";

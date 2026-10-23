import type { Bookmark, VideoRecord } from "../shared/types";

let n = 0;
export function bookmark(over: Partial<Bookmark> = {}): Bookmark {
	n++;
	return { id: `b${n}`, start: 0, title: "", note: "", tags: [], createdAt: 0, ...over };
}

export function video(videoId: string, videoTitle: string, bookmarks: Bookmark[]): VideoRecord {
	return { videoId, videoTitle, bookmarks, updatedAt: 0 };
}

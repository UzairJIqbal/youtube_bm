import { DEFAULT_SETTINGS, type Bookmark, type Settings, type VideoRecord } from "./types";

const VIDEO_PREFIX = "video:";
const SETTINGS_KEY = "settings";

const videoKey = (videoId: string) => `${VIDEO_PREFIX}${videoId}`;

export const isVideoKey = (key: string) => key.startsWith(VIDEO_PREFIX);

export function newId(): string {
	return crypto.randomUUID();
}

export async function getVideo(videoId: string): Promise<VideoRecord | null> {
	const key = videoKey(videoId);
	const result = await chrome.storage.local.get(key);
	return (result[key] as VideoRecord | undefined) ?? null;
}

export async function getAllVideos(): Promise<VideoRecord[]> {
	const all = await chrome.storage.local.get(null);
	return Object.entries(all)
		.filter(([key]) => isVideoKey(key))
		.map(([, value]) => value as VideoRecord)
		.sort((a, b) => b.updatedAt - a.updatedAt);
}

async function saveVideo(record: VideoRecord): Promise<void> {
	const key = videoKey(record.videoId);
	if (record.bookmarks.length === 0) {
		await chrome.storage.local.remove(key);
		return;
	}
	record.bookmarks.sort((a, b) => a.start - b.start);
	await chrome.storage.local.set({ [key]: { ...record, updatedAt: Date.now() } });
}

export async function addBookmark(
	videoId: string,
	videoTitle: string,
	bookmark: Omit<Bookmark, "id" | "createdAt">,
): Promise<Bookmark> {
	const record = (await getVideo(videoId)) ?? {
		videoId,
		videoTitle,
		bookmarks: [],
		updatedAt: Date.now(),
	};
	if (videoTitle) record.videoTitle = videoTitle;
	const created: Bookmark = { ...bookmark, id: newId(), createdAt: Date.now() };
	record.bookmarks.push(created);
	await saveVideo(record);
	return created;
}

export async function updateBookmark(
	videoId: string,
	id: string,
	changes: Partial<Omit<Bookmark, "id" | "createdAt">>,
): Promise<void> {
	const record = await getVideo(videoId);
	if (!record) return;
	record.bookmarks = record.bookmarks.map((b) => (b.id === id ? { ...b, ...changes } : b));
	await saveVideo(record);
}

export async function deleteBookmark(videoId: string, id: string): Promise<void> {
	const record = await getVideo(videoId);
	if (!record) return;
	record.bookmarks = record.bookmarks.filter((b) => b.id !== id);
	await saveVideo(record);
}

export async function getSettings(): Promise<Settings> {
	const result = await chrome.storage.local.get(SETTINGS_KEY);
	return { ...DEFAULT_SETTINGS, ...(result[SETTINGS_KEY] as Partial<Settings> | undefined) };
}

export async function saveSettings(settings: Settings): Promise<void> {
	await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
}

/** Merges records into storage, skipping bookmarks that already exist at the same time. */
export async function importVideos(records: VideoRecord[]): Promise<number> {
	let added = 0;
	for (const incoming of records) {
		const existing = await getVideo(incoming.videoId);
		const merged: VideoRecord = existing ?? { ...incoming, bookmarks: [] };
		if (!merged.videoTitle) merged.videoTitle = incoming.videoTitle;
		for (const b of incoming.bookmarks) {
			const duplicate = merged.bookmarks.some(
				(m) => Math.floor(m.start) === Math.floor(b.start) && m.end === b.end,
			);
			if (duplicate) continue;
			merged.bookmarks.push({ ...b, id: newId() });
			added++;
		}
		await saveVideo(merged);
	}
	return added;
}

/** Subscribes to changes of any stored video. Returns an unsubscribe function. */
export function onVideosChanged(callback: () => void): () => void {
	const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
		if (area === "local" && Object.keys(changes).some(isVideoKey)) callback();
	};
	chrome.storage.onChanged.addListener(listener);
	return () => chrome.storage.onChanged.removeListener(listener);
}

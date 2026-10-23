import { beforeEach, describe, expect, it, vi } from "vitest";
import { installChromeStorage } from "../test/chrome-storage";
import { bookmark, video } from "../test/fixtures";
import {
	addBookmark,
	deleteBookmark,
	getAllVideos,
	getSettings,
	getVideo,
	importVideos,
	onVideosChanged,
	saveSettings,
	updateBookmark,
} from "./storage";

const ID = "aircAruvnKk";
const point = (start: number) => ({ start, title: "", note: "", tags: [] });

beforeEach(() => {
	installChromeStorage();
});

describe("bookmarks", () => {
	it("creates the video on first bookmark and keeps bookmarks sorted by time", async () => {
		await addBookmark(ID, "Neural networks", point(300));
		await addBookmark(ID, "", point(12));
		const record = await getVideo(ID);
		expect(record?.videoTitle).toBe("Neural networks");
		expect(record?.bookmarks.map((b) => b.start)).toEqual([12, 300]);
	});

	it("updates and deletes by ID, and removes the video when it is empty", async () => {
		const b = await addBookmark(ID, "T", point(5));
		await updateBookmark(ID, b.id, { note: "remember this", tags: ["exam"] });
		expect((await getVideo(ID))?.bookmarks[0]).toMatchObject({ note: "remember this", tags: ["exam"] });

		await deleteBookmark(ID, b.id);
		expect(await getVideo(ID)).toBeNull();
	});

	it("lists videos most recently updated first", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(1000);
		await addBookmark("aaaaaaaaaaa", "Old", point(1));
		vi.setSystemTime(2000);
		await addBookmark("bbbbbbbbbbb", "New", point(1));
		vi.useRealTimers();
		expect((await getAllVideos()).map((v) => v.videoTitle)).toEqual(["New", "Old"]);
	});
});

describe("importVideos", () => {
	it("merges into existing videos and skips bookmarks already saved at the same second", async () => {
		await addBookmark(ID, "Neural networks", point(10.2));
		const added = await importVideos([
			video(ID, "Neural networks", [bookmark({ start: 10.8 }), bookmark({ start: 10, end: 20 }), bookmark({ start: 99 })]),
			video("bbbbbbbbbbb", "Other", [bookmark({ start: 1 })]),
		]);
		expect(added).toBe(3);
		expect((await getVideo(ID))?.bookmarks.map((b) => [b.start, b.end])).toEqual([
			[10, 20],
			[10.2, undefined],
			[99, undefined],
		]);
		expect((await getVideo("bbbbbbbbbbb"))?.videoTitle).toBe("Other");
	});

	it("gives imported bookmarks fresh IDs", async () => {
		await importVideos([video(ID, "", [bookmark({ id: "dup", start: 1 })])]);
		expect((await getVideo(ID))?.bookmarks[0].id).not.toBe("dup");
	});
});

describe("settings", () => {
	it("fills in defaults", async () => {
		expect(await getSettings()).toEqual({ offsetSeconds: 0 });
		await saveSettings({ offsetSeconds: 3 });
		expect(await getSettings()).toEqual({ offsetSeconds: 3 });
	});
});

describe("onVideosChanged", () => {
	it("fires for video changes only, until unsubscribed", async () => {
		const callback = vi.fn();
		const unsubscribe = onVideosChanged(callback);
		await saveSettings({ offsetSeconds: 1 });
		expect(callback).not.toHaveBeenCalled();
		await addBookmark(ID, "", point(1));
		expect(callback).toHaveBeenCalledTimes(1);
		unsubscribe();
		await addBookmark(ID, "", point(2));
		expect(callback).toHaveBeenCalledTimes(1);
	});
});

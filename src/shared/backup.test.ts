import { describe, expect, it } from "vitest";
import { bookmark, video } from "../test/fixtures";
import { createBackup, fromLegacySync, parseBackup } from "./backup";

describe("parseBackup", () => {
	it("round-trips a backup made by this version", () => {
		const videos = [video("aircAruvnKk", "Neural networks", [bookmark({ start: 12, title: "Intro" })])];
		expect(parseBackup(JSON.stringify(createBackup(videos)))).toEqual(videos);
	});

	it("skips malformed videos in a backup", () => {
		const file = { app: "yt-study-bookmarks", version: 1, videos: [{ videoId: 5 }, video("aircAruvnKk", "", [])] };
		expect(parseBackup(JSON.stringify(file)).map((v) => v.videoId)).toEqual(["aircAruvnKk"]);
	});

	it("reads an export from the original extension", () => {
		const legacy = {
			importFileId: "aircAruvnKk",
			jsonParseFileBookmarks: JSON.stringify([
				{ time: 61, desc: "Bookmark at 1:01" },
				{ time: 90, desc: "Gradient step" },
				{ desc: "no time, dropped" },
			]),
		};
		const [record] = parseBackup(JSON.stringify(legacy));
		expect(record.videoId).toBe("aircAruvnKk");
		expect(record.bookmarks.map((b) => [b.start, b.title])).toEqual([
			[61, ""],
			[90, "Gradient step"],
		]);
	});

	it("rejects anything else", () => {
		expect(() => parseBackup('{"hello":1}')).toThrow("isn't a bookmarks backup");
		expect(() => parseBackup("not json")).toThrow();
	});
});

describe("fromLegacySync", () => {
	it("converts video-ID keys and ignores other keys and empty videos", () => {
		const records = fromLegacySync({
			aircAruvnKk: JSON.stringify([{ time: 5, desc: "a" }]),
			IHZwWFHWa_w: "[]",
			settings: { theme: "dark" },
			brokenValue1: "{not json",
		});
		expect(records.map((r) => r.videoId)).toEqual(["aircAruvnKk"]);
	});
});

import { describe, expect, it } from "vitest";
import { bookmark, video } from "../test/fixtures";
import { bookmarkLabel, slugify, videoToMarkdown, videosToMarkdown } from "./markdown";

describe("bookmarkLabel", () => {
	it("shows a point as one time and a clip as a range", () => {
		expect(bookmarkLabel(bookmark({ start: 75 }))).toBe("1:15");
		expect(bookmarkLabel(bookmark({ start: 75, end: 90 }))).toBe("1:15–1:30");
	});
});

describe("videoToMarkdown", () => {
	it("writes a linked heading and one linked line per bookmark", () => {
		const md = videoToMarkdown(
			video("aircAruvnKk", "Neural networks", [
				bookmark({ start: 312, title: "Why layers", note: "first line\n  second line", tags: ["exam", "math"] }),
				bookmark({ start: 1980, end: 2145 }),
			]),
		);
		expect(md).toBe(
			[
				"## [Neural networks](https://www.youtube.com/watch?v=aircAruvnKk)",
				"",
				"- [5:12](https://www.youtube.com/watch?v=aircAruvnKk&t=312s) **Why layers** — first line second line #exam #math",
				"- [33:00–35:45](https://www.youtube.com/watch?v=aircAruvnKk&t=1980s)",
				"",
			].join("\n"),
		);
	});

	it("falls back to the video ID when there is no title", () => {
		expect(videoToMarkdown(video("aircAruvnKk", "", []))).toContain("## [aircAruvnKk]");
	});

	it("separates several videos with a blank line", () => {
		const md = videosToMarkdown([video("aaaaaaaaaaa", "A", []), video("bbbbbbbbbbb", "B", [])]);
		expect(md).toMatch(/\n\n## \[B\]/);
	});
});

describe("slugify", () => {
	it("makes a safe filename", () => {
		expect(slugify("Lecture 4: Backprop & Chain Rule!")).toBe("lecture-4-backprop-chain-rule");
		expect(slugify("???")).toBe("bookmarks");
		expect(slugify("x".repeat(100))).toHaveLength(60);
	});
});

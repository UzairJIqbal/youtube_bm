import { describe, expect, it } from "vitest";
import { bookmark, video } from "../test/fixtures";
import { countTags, filterVideos } from "./search";

const videos = [
	video("aaaaaaaaaaa", "Neural networks", [
		bookmark({ title: "Gradient descent", tags: ["exam"] }),
		bookmark({ title: "Chain rule", note: "re-watch before the problem set", tags: ["exam", "math"] }),
	]),
	video("bbbbbbbbbbb", "Linear algebra", [bookmark({ title: "Eigenvectors", tags: ["math"] })]),
];

const titles = (result: ReturnType<typeof filterVideos>) => result.flatMap((v) => v.bookmarks.map((b) => b.title));

describe("filterVideos", () => {
	it("returns everything for an empty query", () => {
		expect(titles(filterVideos(videos, "  ", null))).toHaveLength(3);
	});

	it("needs every word, in any field, ignoring case", () => {
		expect(titles(filterVideos(videos, "NEURAL problem", null))).toEqual(["Chain rule"]);
	});

	it("matches #tags typed in the query", () => {
		expect(titles(filterVideos(videos, "#math", null))).toEqual(["Chain rule", "Eigenvectors"]);
	});

	it("filters by tag and drops videos left empty", () => {
		const result = filterVideos(videos, "", "exam");
		expect(result.map((v) => v.videoId)).toEqual(["aaaaaaaaaaa"]);
		expect(titles(result)).toEqual(["Gradient descent", "Chain rule"]);
	});

	it("does not modify the input", () => {
		filterVideos(videos, "eigen", null);
		expect(videos[0].bookmarks).toHaveLength(2);
	});
});

describe("countTags", () => {
	it("orders by use, then alphabetically", () => {
		expect(countTags(videos)).toEqual([
			["exam", 2],
			["math", 2],
		]);
		expect(countTags([video("ccccccccccc", "", [bookmark({ tags: ["z"] }), bookmark({ tags: ["a", "z"] })])])).toEqual([
			["z", 2],
			["a", 1],
		]);
	});
});

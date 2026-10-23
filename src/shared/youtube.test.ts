import { describe, expect, it } from "vitest";
import { getVideoIdFromUrl, watchUrl } from "./youtube";

describe("getVideoIdFromUrl", () => {
	it.each([
		["https://www.youtube.com/watch?v=aircAruvnKk", "aircAruvnKk"],
		["https://www.youtube.com/watch?list=PL1&v=aircAruvnKk&t=300s", "aircAruvnKk"],
		["https://m.youtube.com/watch?v=IHZwWFHWa-w", "IHZwWFHWa-w"],
		["https://www.youtube.com/live/jfKfPfyJRdk?si=x", "jfKfPfyJRdk"],
	])("%s → %s", (url, id) => {
		expect(getVideoIdFromUrl(url)).toBe(id);
	});

	it.each([
		undefined,
		"",
		"not a url",
		"https://www.youtube.com/",
		"https://www.youtube.com/watch?v=short",
		"https://www.youtube.com/shorts/aircAruvnKk",
		"https://evil-youtube.com/watch?v=aircAruvnKk",
		"https://youtube.com.example.org/watch?v=aircAruvnKk",
	])("returns null for %j", (url) => {
		expect(getVideoIdFromUrl(url)).toBeNull();
	});
});

describe("watchUrl", () => {
	it("links to the video, optionally at a whole second", () => {
		expect(watchUrl("aircAruvnKk")).toBe("https://www.youtube.com/watch?v=aircAruvnKk");
		expect(watchUrl("aircAruvnKk", 300.9)).toBe("https://www.youtube.com/watch?v=aircAruvnKk&t=300s");
	});
});

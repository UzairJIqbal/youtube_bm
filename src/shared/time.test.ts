import { describe, expect, it } from "vitest";
import { formatTime, parseTime } from "./time";

describe("formatTime", () => {
	it.each([
		[0, "0:00"],
		[9.9, "0:09"],
		[75, "1:15"],
		[3600, "1:00:00"],
		[3723, "1:02:03"],
		[-5, "0:00"],
	])("%s → %s", (seconds, expected) => {
		expect(formatTime(seconds)).toBe(expected);
	});
});

describe("parseTime", () => {
	it.each([
		["75", 75],
		["1:15", 75],
		[" 1:02:03 ", 3723],
		["0:07.5", 7.5],
	])("%j → %s", (input, expected) => {
		expect(parseTime(input)).toBe(expected);
	});

	it.each(["", "abc", "1:2:3:4", "1:-5", "1::2"])("rejects %j", (input) => {
		expect(parseTime(input)).toBeNull();
	});

	it("round-trips with formatTime", () => {
		for (const s of [0, 59, 61, 3599, 3601, 86399]) expect(parseTime(formatTime(s))).toBe(s);
	});
});

import { formatTime } from "./time";
import { isClip, type Bookmark, type VideoRecord } from "./types";
import { watchUrl } from "./youtube";

export function bookmarkLabel(b: Bookmark): string {
	return isClip(b) ? `${formatTime(b.start)}–${formatTime(b.end)}` : formatTime(b.start);
}

function bookmarkLine(videoId: string, b: Bookmark): string {
	let line = `- [${bookmarkLabel(b)}](${watchUrl(videoId, b.start)})`;
	if (b.title) line += ` **${b.title}**`;
	if (b.note) line += ` — ${b.note.replace(/\s*\n\s*/g, " ")}`;
	if (b.tags.length) line += ` ${b.tags.map((t) => `#${t}`).join(" ")}`;
	return line;
}

/** One video as a Markdown section that pastes cleanly into Obsidian or Notion. */
export function videoToMarkdown(record: VideoRecord): string {
	const title = record.videoTitle || record.videoId;
	const lines = [`## [${title}](${watchUrl(record.videoId)})`, ""];
	for (const b of record.bookmarks) lines.push(bookmarkLine(record.videoId, b));
	return lines.join("\n") + "\n";
}

export function videosToMarkdown(records: VideoRecord[]): string {
	return records.map(videoToMarkdown).join("\n");
}

/** Turns a title into a safe filename. */
export function slugify(text: string): string {
	return (
		text
			.toLowerCase()
			.replace(/[^\w]+/g, "-")
			.replace(/^-+|-+$/g, "")
			.slice(0, 60) || "bookmarks"
	);
}

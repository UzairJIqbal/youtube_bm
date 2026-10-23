import { useState } from "react";
import { bookmarkLabel } from "../shared/markdown";
import { sendToTab } from "../shared/messages";
import { deleteBookmark, updateBookmark } from "../shared/storage";
import { formatTime, parseTime } from "../shared/time";
import { isClip, type Bookmark } from "../shared/types";

interface Props {
	bookmark: Bookmark;
	videoId: string;
	tabId: number;
	looping: boolean;
}

const parseTags = (text: string) =>
	[...new Set(text.split(/[\s,]+/).map((t) => t.replace(/^#/, "").trim()).filter(Boolean))];

export function BookmarkItem({ bookmark: b, videoId, tabId, looping }: Props) {
	const [open, setOpen] = useState(false);
	const [title, setTitle] = useState(b.title);
	const [note, setNote] = useState(b.note);
	const [tags, setTags] = useState(b.tags.map((t) => `#${t}`).join(" "));
	const [startText, setStartText] = useState(formatTime(b.start));
	const [isLooping, setIsLooping] = useState(looping);

	const save = (changes: Partial<Bookmark>) => void updateBookmark(videoId, b.id, changes);

	const play = () => void sendToTab(tabId, { type: "PLAY", seconds: b.start });

	const toggleLoop = async () => {
		if (!isClip(b)) return;
		if (isLooping) await sendToTab(tabId, { type: "STOP_LOOP" });
		else await sendToTab(tabId, { type: "LOOP", start: b.start, end: b.end });
		setIsLooping(!isLooping);
	};

	const nudge = (delta: number) => {
		const start = Math.max(0, b.start + delta);
		setStartText(formatTime(start));
		save({ start });
		void sendToTab(tabId, { type: "PLAY", seconds: start });
	};

	const commitStart = () => {
		const parsed = parseTime(startText);
		if (parsed === null || (isClip(b) && parsed >= b.end)) {
			setStartText(formatTime(b.start));
			return;
		}
		save({ start: parsed });
	};

	return (
		<li className={`item${open ? " item--open" : ""}`}>
			<div className="item__row">
				<button className="item__time" onClick={play} title="Jump to this moment">
					{bookmarkLabel(b)}
				</button>
				<input
					className="item__title"
					value={title}
					placeholder={isClip(b) ? "Untitled clip" : "Untitled moment"}
					onChange={(e) => setTitle(e.target.value)}
					onBlur={() => title !== b.title && save({ title: title.trim() })}
					onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
					aria-label="Title"
				/>
				{!b.note && <span className="item__dot" title="No note yet" />}
				{isClip(b) && (
					<button
						className={`btn btn--small${isLooping ? " btn--primary" : ""}`}
						onClick={toggleLoop}
						title={isLooping ? "Stop looping" : "Loop this clip"}
					>
						{isLooping ? "Stop" : "Loop"}
					</button>
				)}
				<button
					className="btn btn--ghost btn--small"
					onClick={() => setOpen(!open)}
					aria-expanded={open}
					title={open ? "Hide details" : "Note, tags and time"}
				>
					{open ? "▴" : "▾"}
				</button>
			</div>

			{!open && (b.note || b.tags.length > 0) && (
				<div className="item__summary" onClick={() => setOpen(true)}>
					{b.note && <span>{b.note}</span>}
					{b.tags.map((t) => (
						<span key={t} className="item__tag">
							#{t}
						</span>
					))}
				</div>
			)}

			{open && (
				<div className="item__details">
					<textarea
						className="field"
						rows={3}
						value={note}
						placeholder="Note — what matters here?"
						onChange={(e) => setNote(e.target.value)}
						onBlur={() => note !== b.note && save({ note: note.trim() })}
						autoFocus={!b.note}
					/>
					<input
						className="field"
						value={tags}
						placeholder="#tags, separated by spaces"
						onChange={(e) => setTags(e.target.value)}
						onBlur={() => {
							const next = parseTags(tags);
							setTags(next.map((t) => `#${t}`).join(" "));
							if (next.join() !== b.tags.join()) save({ tags: next });
						}}
					/>
					<div className="item__actions">
						<label className="item__start">
							<span className="muted">Start</span>
							<input
								className="field"
								value={startText}
								onChange={(e) => setStartText(e.target.value)}
								onBlur={commitStart}
								onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
								aria-label="Start time"
							/>
						</label>
						<button className="btn btn--small" onClick={() => nudge(-1)} title="1 second earlier">
							−1s
						</button>
						<button className="btn btn--small" onClick={() => nudge(1)} title="1 second later">
							+1s
						</button>
						<button
							className="btn btn--ghost btn--small item__delete"
							onClick={() => void deleteBookmark(videoId, b.id)}
						>
							Delete
						</button>
					</div>
				</div>
			)}
		</li>
	);
}

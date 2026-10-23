import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "../../src/ui/theme.css";
import "../../src/popup/popup.css";
import "./harness.css";
import { installChromeStub } from "./chrome-stub";
import { DURATION, VIDEO_ID, VIDEO_TITLE, record } from "./data";
import { videoToMarkdown } from "../../src/shared/markdown";
import { formatTime } from "../../src/shared/time";
import { isClip } from "../../src/shared/types";
import icon from "../../assets/icon-source.png";

const scene = new URLSearchParams(location.search).get("scene") ?? "capture";
const clip = record.bookmarks.find(isClip)!;

installChromeStub(
	{ [`video:${VIDEO_ID}`]: record, settings: { offsetSeconds: 2 } },
	`https://www.youtube.com/watch?v=${VIDEO_ID}`,
	{
		videoId: VIDEO_ID,
		videoTitle: VIDEO_TITLE,
		currentTime: 2754,
		pendingClipStart: null,
		loop: scene === "loop" ? { start: clip.start, end: clip.end } : null,
	},
);

// Import after the stub exists, so module-level code sees `chrome`.
const { Popup } = await import("../../src/popup/Popup");

function Player({ time, toast, highlightClip }: { time: number; toast?: string; highlightClip?: boolean }) {
	return (
		<div className="player">
			<div className="slide">
				<div className="slide__kicker">Lecture 4</div>
				<div className="slide__title">{highlightClip ? "The chain rule" : "Backpropagation"}</div>
				<div className="slide__eq">∂L/∂w = ∂L/∂a · ∂a/∂z · ∂z/∂w</div>
			</div>
			{toast && <div className="toast">{toast}</div>}
			<div className="controls">
				<div className="bar">
					<div className="bar__played" style={{ width: `${(time / DURATION) * 100}%` }} />
					{record.bookmarks.map((b) =>
						isClip(b) ? (
							<div
								key={b.id}
								className={`mark mark--clip${highlightClip ? " mark--hot" : ""}`}
								style={{ left: `${(b.start / DURATION) * 100}%`, width: `${((b.end - b.start) / DURATION) * 100}%` }}
							/>
						) : (
							<div key={b.id} className="mark" style={{ left: `${(b.start / DURATION) * 100}%` }} />
						),
					)}
					<div className="bar__head" style={{ left: `${(time / DURATION) * 100}%` }} />
				</div>
				<div className="controls__row">
					<span className="ctl">▶</span>
					<span className="ctl">⏭</span>
					<span className="ctl ctl--time">
						{formatTime(time)} / {formatTime(DURATION)}
					</span>
					<span className="controls__spacer" />
					<span className="ctl ctl--ours" title="Bookmark">
						<svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M7 4h10a1 1 0 0 1 1 1v15l-6-3.5L6 20V5a1 1 0 0 1 1-1zm1 2v10.5l4-2.3 4 2.3V6H8z"/><path fill="currentColor" d="M11 7.5h2v2h2v2h-2v2h-2v-2H9v-2h2z"/></svg>
					</span>
					<span className={`ctl ctl--ours${highlightClip ? " ctl--active" : ""}`} title="Clip">
						<svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M4 6h2v12H4zm14 0h2v12h-2zM8 11h8v2H8z"/><path fill="currentColor" d="M9 8l-3 4 3 4zm6 0v8l3-4z"/></svg>
					</span>
					<span className="ctl">⚙</span>
					<span className="ctl">⛶</span>
				</div>
			</div>
		</div>
	);
}

function Frame({ headline, sub, children }: { headline: string; sub: string; children: ReactNode }) {
	return (
		<div className="frame">
			<div className="frame__copy">
				<h1>{headline}</h1>
				<p>{sub}</p>
			</div>
			<div className="frame__stage">{children}</div>
		</div>
	);
}

function PopupCard() {
	return (
		<div className="popup-card">
			<Popup />
		</div>
	);
}

function MarkdownNote() {
	const md = videoToMarkdown(record);
	return (
		<div className="notes">
			<div className="notes__bar">
				<span className="dot" />
				<span className="dot" />
				<span className="dot" />
				<span className="notes__name">Neural Networks — study notes.md</span>
			</div>
			<pre className="notes__body">
				{md.split("\n").map((line, i) => (
					<div key={i} className={line.startsWith("##") ? "md-h" : undefined}>
						{line.split(/(\[[^\]]+\]\([^)]+\)|#\w+|\*\*[^*]+\*\*)/).map((part, j) =>
							part.startsWith("[") ? (
								<span key={j} className="md-link">{part.replace(/\]\(.*\)$/, "]").slice(1, -1)}</span>
							) : part.startsWith("**") ? (
								<strong key={j}>{part.slice(2, -2)}</strong>
							) : /^#\w+$/.test(part) ? (
								<span key={j} className="md-tag">{part}</span>
							) : (
								part
							),
						)}
					</div>
				))}
			</pre>
		</div>
	);
}

function Promo({ size }: { size: "small" | "marquee" }) {
	return (
		<div className={`promo promo--${size}`}>
			<img className="promo__logo" src={icon} alt="" />
			<div>
				<div className="promo__name">Study Bookmarks</div>
				<div className="promo__tag">
					{size === "marquee"
						? "Bookmark YouTube lectures with one key. Notes, loops and Markdown export."
						: "One key to bookmark any YouTube lecture"}
				</div>
				{size === "marquee" && (
					<div className="promo__keys">
						<span><kbd>Alt</kbd>+<kbd>B</kbd> bookmark</span>
						<span><kbd>Alt</kbd>+<kbd>C</kbd> clip &amp; loop</span>
					</div>
				)}
			</div>
		</div>
	);
}

const scenes: Record<string, ReactNode> = {
	capture: (
		<Frame headline="One key to capture" sub="Press Alt+B. The moment is saved and titled from the chapter.">
			<Player time={2754} toast="Bookmarked 45:54" />
		</Frame>
	),
	notes: (
		<Frame headline="Add notes when you have time" sub="Titles, notes and #tags for every moment. Click a time to jump back.">
			<div className="split">
				<Player time={2754} />
				<PopupCard />
			</div>
		</Frame>
	),
	loop: (
		<Frame headline="Loop the part you need" sub="Press Alt+C at the start and end, then replay just that explanation.">
			<div className="split">
				<Player time={2031} highlightClip toast={`Looping ${formatTime(clip.start)}–${formatTime(clip.end)}`} />
				<PopupCard />
			</div>
		</Frame>
	),
	export: (
		<Frame headline="Export to your notes" sub="Copy as Markdown with clickable timestamps. Paste into Obsidian, Notion or Logseq.">
			<MarkdownNote />
		</Frame>
	),
	"promo-small": <Promo size="small" />,
	"promo-marquee": <Promo size="marquee" />,
};

document.body.dataset.scene = scene;
createRoot(document.getElementById("root")!).render(<StrictMode>{scenes[scene]}</StrictMode>);

// The notes scene shows one bookmark expanded.
if (scene === "notes") {
	setTimeout(() => {
		const toggles = document.querySelectorAll<HTMLButtonElement>(".item [aria-expanded]");
		toggles[1]?.click();
	}, 300);
}

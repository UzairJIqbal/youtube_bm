import { useEffect, useState } from "react";
import { WAITLIST_URL } from "../shared/config";
import { slugify, videoToMarkdown } from "../shared/markdown";
import { sendToTab, type ContentState } from "../shared/messages";
import { getAllVideos, getVideo, onVideosChanged } from "../shared/storage";
import type { Bookmark, VideoRecord } from "../shared/types";
import { getVideoIdFromUrl, watchUrl } from "../shared/youtube";
import { BookmarkItem } from "./BookmarkItem";
import { downloadText } from "../ui/download";

interface TabInfo {
	tabId: number;
	videoId: string;
	state: ContentState | undefined;
}

function matches(b: Bookmark, query: string): boolean {
	if (!query) return true;
	const q = query.toLowerCase();
	return (
		b.title.toLowerCase().includes(q) ||
		b.note.toLowerCase().includes(q) ||
		b.tags.some((t) => t.toLowerCase().includes(q))
	);
}

export function Popup() {
	const [tab, setTab] = useState<TabInfo | null | undefined>(undefined);
	const [record, setRecord] = useState<VideoRecord | null>(null);
	const [recent, setRecent] = useState<VideoRecord[]>([]);
	const [query, setQuery] = useState("");
	const [status, setStatus] = useState("");

	useEffect(() => {
		(async () => {
			const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
			const videoId = getVideoIdFromUrl(active?.url);
			if (active?.id === undefined || !videoId) {
				setTab(null);
				return;
			}
			const state = await sendToTab<ContentState>(active.id, { type: "GET_STATE" });
			setTab({ tabId: active.id, videoId, state });
		})();
	}, []);

	useEffect(() => {
		if (tab === undefined) return;
		const load = async () => {
			if (tab) setRecord(await getVideo(tab.videoId));
			else setRecent(await getAllVideos());
		};
		void load();
		return onVideosChanged(() => void load());
	}, [tab]);

	const flash = (text: string) => {
		setStatus(text);
		setTimeout(() => setStatus(""), 2000);
	};

	const copyMarkdown = async () => {
		if (!record) return;
		await navigator.clipboard.writeText(videoToMarkdown(record));
		flash("Copied as Markdown");
	};

	const downloadMarkdown = () => {
		if (!record) return;
		downloadText(`${slugify(record.videoTitle || record.videoId)}.md`, videoToMarkdown(record));
	};

	const openOptions = () => void chrome.runtime.openOptionsPage();

	if (tab === undefined) return <div className="popup" />;

	const bookmarks = record?.bookmarks ?? [];
	const visible = bookmarks.filter((b) => matches(b, query));
	const needsNote = bookmarks.filter((b) => !b.note).length;
	const connected = tab?.state !== undefined;

	return (
		<div className="popup">
			<header className="popup__header">
				<div className="popup__brand">
					<span className="popup__logo" aria-hidden="true" />
					Study Bookmarks
				</div>
				<button className="btn btn--ghost btn--small" onClick={openOptions}>
					Settings
				</button>
			</header>

			{tab === null ? (
				<RecentVideos videos={recent} />
			) : (
				<>
					<div className="popup__video">
						<div className="popup__video-title" title={record?.videoTitle || tab.state?.videoTitle}>
							{record?.videoTitle || tab.state?.videoTitle || "This video"}
						</div>
						<div className="muted">
							{bookmarks.length} saved
							{needsNote > 0 && bookmarks.length > 0 && ` · ${needsNote} without a note`}
						</div>
					</div>

					{!connected && (
						<p className="popup__notice">
							Reload this YouTube tab to start bookmarking — it was open before the extension
							was installed.
						</p>
					)}

					{bookmarks.length === 0 ? (
						<div className="popup__empty">
							<p>No bookmarks for this video yet.</p>
							<p className="muted">
								Press <kbd>Alt</kbd>+<kbd>B</kbd> to bookmark a moment, or <kbd>Alt</kbd>+
								<kbd>C</kbd> twice to save a clip you can loop. You can also use the buttons
								in the player.
							</p>
						</div>
					) : (
						<>
							{bookmarks.length > 3 && (
								<input
									className="field popup__search"
									type="search"
									placeholder="Search titles, notes and #tags"
									value={query}
									onChange={(e) => setQuery(e.target.value)}
								/>
							)}
							<ul className="popup__list">
								{visible.map((b) => (
									<BookmarkItem
										key={b.id}
										bookmark={b}
										videoId={tab.videoId}
										tabId={tab.tabId}
										looping={
											tab.state?.loop?.start === b.start && tab.state?.loop?.end === b.end
										}
									/>
								))}
								{visible.length === 0 && <li className="muted popup__none">No matches.</li>}
							</ul>
							<div className="popup__export">
								<button className="btn" onClick={copyMarkdown}>
									Copy Markdown
								</button>
								<button className="btn" onClick={downloadMarkdown}>
									Download .md
								</button>
								<span className="popup__status" role="status">
									{status}
								</span>
							</div>
						</>
					)}
				</>
			)}

			<footer className="popup__footer">
				<a className="popup__pro" href={WAITLIST_URL} target="_blank" rel="noreferrer">
					<strong>Pro is coming:</strong> sync, Notion and share links. Join the waitlist →
				</a>
			</footer>
		</div>
	);
}

function RecentVideos({ videos }: { videos: VideoRecord[] }) {
	return (
		<div className="popup__recent">
			<p className="muted">Open a YouTube video to bookmark it.</p>
			{videos.length > 0 && (
				<>
					<h2 className="popup__section">Recent videos</h2>
					<ul className="popup__list">
						{videos.slice(0, 8).map((v) => (
							<li key={v.videoId}>
								<a
									className="popup__recent-item"
									href={watchUrl(v.videoId)}
									target="_blank"
									rel="noreferrer"
								>
									<span className="popup__recent-title">{v.videoTitle || v.videoId}</span>
									<span className="muted">{v.bookmarks.length}</span>
								</a>
							</li>
						))}
					</ul>
				</>
			)}
		</div>
	);
}

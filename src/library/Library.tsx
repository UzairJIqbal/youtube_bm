import { useEffect, useState } from "react";
import { bookmarkLabel, slugify, videosToMarkdown } from "../shared/markdown";
import { deleteBookmark, getAllVideos, onVideosChanged } from "../shared/storage";
import type { Bookmark, VideoRecord } from "../shared/types";
import { watchUrl } from "../shared/youtube";
import { downloadText } from "../ui/download";

function matches(record: VideoRecord, b: Bookmark, words: string[]): boolean {
	const haystack = [record.videoTitle, b.title, b.note, ...b.tags.map((t) => `#${t}`)]
		.join(" ")
		.toLowerCase();
	return words.every((w) => haystack.includes(w));
}

export function Library() {
	const [videos, setVideos] = useState<VideoRecord[] | null>(null);
	const [query, setQuery] = useState(() => new URLSearchParams(location.search).get("q") ?? "");
	const [tag, setTag] = useState<string | null>(null);

	useEffect(() => {
		const load = async () => setVideos(await getAllVideos());
		void load();
		return onVideosChanged(() => void load());
	}, []);

	if (videos === null) return <div className="library" />;

	const tagCounts = new Map<string, number>();
	for (const v of videos) for (const b of v.bookmarks) for (const t of b.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
	const tags = [...tagCounts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

	const words = query.toLowerCase().split(/\s+/).filter(Boolean);
	const results = videos
		.map((v) => ({
			...v,
			bookmarks: v.bookmarks.filter((b) => (!tag || b.tags.includes(tag)) && matches(v, b, words)),
		}))
		.filter((v) => v.bookmarks.length > 0);
	const total = videos.reduce((n, v) => n + v.bookmarks.length, 0);
	const shown = results.reduce((n, v) => n + v.bookmarks.length, 0);
	const filtered = words.length > 0 || tag !== null;

	const exportShown = () => {
		const name = tag ? `study-bookmarks-${slugify(tag)}` : "study-bookmarks";
		downloadText(`${name}.md`, videosToMarkdown(results));
	};

	return (
		<div className="library">
			<header className="library__header">
				<h1>Library</h1>
				<span className="muted">
					{total} bookmark{total === 1 ? "" : "s"} in {videos.length} video{videos.length === 1 ? "" : "s"}
				</span>
				<span className="library__spacer" />
				<button className="btn btn--ghost" onClick={() => void chrome.runtime.openOptionsPage()}>
					Settings
				</button>
			</header>

			{total === 0 ? (
				<div className="library__empty">
					<p>Nothing saved yet.</p>
					<p className="muted">
						Open a YouTube video and press <kbd>Alt</kbd>+<kbd>B</kbd> to bookmark a moment. Everything you
						save shows up here, searchable across all your videos.
					</p>
				</div>
			) : (
				<>
					<div className="library__tools">
						<input
							className="field library__search"
							type="search"
							autoFocus
							placeholder="Search every video, title, note and #tag"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
						/>
						<button className="btn" onClick={exportShown} disabled={shown === 0}>
							{filtered ? `Export ${shown} as Markdown` : "Export all as Markdown"}
						</button>
					</div>

					{tags.length > 0 && (
						<div className="library__tags" role="group" aria-label="Filter by tag">
							{tags.map(([t, n]) => (
								<button
									key={t}
									className={`chip${tag === t ? " chip--active" : ""}`}
									aria-pressed={tag === t}
									onClick={() => setTag(tag === t ? null : t)}
								>
									#{t} <span className="chip__count">{n}</span>
								</button>
							))}
						</div>
					)}

					{filtered && (
						<p className="muted library__count">
							{shown} match{shown === 1 ? "" : "es"}
							{" · "}
							<button
								className="link"
								onClick={() => {
									setQuery("");
									setTag(null);
								}}
							>
								Clear
							</button>
						</p>
					)}

					{results.map((v) => (
						<section key={v.videoId} className="video">
							<h2 className="video__title">
								<a href={watchUrl(v.videoId)} target="_blank" rel="noreferrer">
									{v.videoTitle || v.videoId}
								</a>
							</h2>
							<ul className="video__list">
								{v.bookmarks.map((b) => (
									<li key={b.id} className="entry">
										<a
											className="entry__time"
											href={watchUrl(v.videoId, b.start)}
											target="_blank"
											rel="noreferrer"
										>
											{bookmarkLabel(b)}
										</a>
										<div className="entry__body">
											<div className={b.title ? "entry__title" : "entry__title muted"}>
												{b.title || "Untitled"}
											</div>
											{b.note && <div className="entry__note">{b.note}</div>}
											{b.tags.length > 0 && (
												<div className="entry__tags">
													{b.tags.map((t) => (
														<button key={t} className="link entry__tag" onClick={() => setTag(t)}>
															#{t}
														</button>
													))}
												</div>
											)}
										</div>
										<button
											className="btn btn--ghost btn--small entry__delete"
											title="Delete bookmark"
											onClick={() => {
												if (confirm("Delete this bookmark?")) void deleteBookmark(v.videoId, b.id);
											}}
										>
											Delete
										</button>
									</li>
								))}
							</ul>
						</section>
					))}

					{shown === 0 && <p className="muted">No bookmarks match.</p>}
				</>
			)}
		</div>
	);
}

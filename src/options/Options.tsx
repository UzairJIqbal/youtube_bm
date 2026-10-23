import { useEffect, useRef, useState } from "react";
import { createBackup, parseBackup } from "../shared/backup";
import { WAITLIST_URL } from "../shared/config";
import { videosToMarkdown } from "../shared/markdown";
import { getAllVideos, getSettings, importVideos, onVideosChanged, saveSettings } from "../shared/storage";
import { DEFAULT_SETTINGS, type Settings } from "../shared/types";
import { downloadText } from "../ui/download";

const today = () => new Date().toISOString().slice(0, 10);

export function Options() {
	const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
	const [shortcuts, setShortcuts] = useState<chrome.commands.Command[]>([]);
	const [counts, setCounts] = useState({ videos: 0, bookmarks: 0 });
	const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
	const fileInput = useRef<HTMLInputElement>(null);
	const welcome = new URLSearchParams(location.search).has("welcome");

	useEffect(() => {
		(async () => {
			setSettings(await getSettings());
			setShortcuts(await chrome.commands.getAll());
		})();
		const loadCounts = async () => {
			const videos = await getAllVideos();
			setCounts({
				videos: videos.length,
				bookmarks: videos.reduce((n, v) => n + v.bookmarks.length, 0),
			});
		};
		void loadCounts();
		return onVideosChanged(() => void loadCounts());
	}, []);

	const updateOffset = async (value: number) => {
		const next = { ...settings, offsetSeconds: Math.min(30, Math.max(0, value || 0)) };
		setSettings(next);
		await saveSettings(next);
	};

	const exportBackup = async () => {
		const backup = createBackup(await getAllVideos());
		downloadText(`study-bookmarks-backup-${today()}.json`, JSON.stringify(backup, null, 2), "application/json");
	};

	const exportMarkdown = async () => {
		downloadText(`study-bookmarks-${today()}.md`, videosToMarkdown(await getAllVideos()));
	};

	const importFile = async (file: File) => {
		try {
			const added = await importVideos(parseBackup(await file.text()));
			setMessage({ text: `Imported ${added} bookmark${added === 1 ? "" : "s"}.` });
		} catch (err) {
			setMessage({ text: err instanceof Error ? err.message : "Couldn't read that file.", error: true });
		}
	};

	const openShortcuts = () => void chrome.tabs.create({ url: "chrome://extensions/shortcuts" });

	const describe: Record<string, string> = {
		"add-bookmark": "Bookmark the current moment",
		"add-clip": "Start a clip, then press again to end it",
		_execute_action: "Open the popup",
	};

	return (
		<main className="options">
			<h1>Study Bookmarks</h1>

			{welcome && (
				<section className="card card--welcome">
					<h2>You're set up</h2>
					<ol>
						<li>Open any YouTube video.</li>
						<li>
							Press <kbd>Alt</kbd>+<kbd>B</kbd> to bookmark a moment. It's titled from the chapter
							automatically.
						</li>
						<li>
							Press <kbd>Alt</kbd>+<kbd>C</kbd> at the start and end of a part you want to
							re-watch, then hit <strong>Loop</strong> in the popup.
						</li>
						<li>Click the toolbar icon to add notes and tags, or copy everything as Markdown.</li>
					</ol>
					<p className="muted">
						Tip: pin the extension from the puzzle-piece menu so it's one click away.
					</p>
				</section>
			)}

			<section className="card">
				<h2>Capture</h2>
				<label className="row">
					<span>
						<strong>Rewind on capture</strong>
						<span className="muted block">
							Saves the moment a few seconds earlier, so you catch the start of what you heard.
						</span>
					</span>
					<span className="row__control">
						<input
							className="field"
							type="number"
							min={0}
							max={30}
							value={settings.offsetSeconds}
							onChange={(e) => void updateOffset(e.target.valueAsNumber)}
						/>
						<span className="muted">seconds</span>
					</span>
				</label>
			</section>

			<section className="card">
				<h2>Keyboard shortcuts</h2>
				<table className="shortcuts">
					<tbody>
						{shortcuts.map((c) => (
							<tr key={c.name}>
								<td>{describe[c.name ?? ""] ?? c.description}</td>
								<td>{c.shortcut ? <kbd>{c.shortcut}</kbd> : <span className="muted">Not set</span>}</td>
							</tr>
						))}
					</tbody>
				</table>
				<button className="btn" onClick={openShortcuts}>
					Change shortcuts
				</button>
			</section>

			<section className="card">
				<h2>Your data</h2>
				<p className="muted">
					{counts.bookmarks} bookmark{counts.bookmarks === 1 ? "" : "s"} across {counts.videos} video
					{counts.videos === 1 ? "" : "s"}, stored only in this browser. Nothing is sent anywhere.
				</p>
				<div className="buttons">
					<button className="btn" onClick={exportMarkdown} disabled={counts.bookmarks === 0}>
						Export all as Markdown
					</button>
					<button className="btn" onClick={exportBackup} disabled={counts.bookmarks === 0}>
						Download backup (.json)
					</button>
					<button className="btn" onClick={() => fileInput.current?.click()}>
						Import backup
					</button>
					<input
						ref={fileInput}
						type="file"
						accept="application/json,.json"
						hidden
						onChange={(e) => {
							const file = e.target.files?.[0];
							if (file) void importFile(file);
							e.target.value = "";
						}}
					/>
				</div>
				{message && (
					<p className={message.error ? "message message--error" : "message"} role="status">
						{message.text}
					</p>
				)}
			</section>

			<section className="card card--pro">
				<h2>Pro is coming</h2>
				<p>
					Sync across devices with automatic backup, send bookmarks to Notion, and share a clip
					with a link that plays exactly that part. Everything you use today stays free.
				</p>
				<a className="btn btn--primary" href={WAITLIST_URL} target="_blank" rel="noreferrer">
					Join the waitlist
				</a>
			</section>
		</main>
	);
}

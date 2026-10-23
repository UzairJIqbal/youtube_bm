import { fromLegacySync } from "../shared/backup";
import { sendToTab, type Command } from "../shared/messages";
import { importVideos } from "../shared/storage";

const COMMANDS: Command[] = ["add-bookmark", "add-clip"];

chrome.commands.onCommand.addListener(async (command) => {
	if (!COMMANDS.includes(command as Command)) return;
	const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
	if (tab?.id === undefined) return;
	await sendToTab(tab.id, { type: "COMMAND", command: command as Command });
});

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
	if (reason === "install") {
		await chrome.tabs.create({ url: chrome.runtime.getURL("options.html?welcome=1") });
	}
	await migrateLegacySync();
});

/** Moves bookmarks saved by the original version (chrome.storage.sync) into local storage. */
async function migrateLegacySync(): Promise<void> {
	const items = await chrome.storage.sync.get(null);
	const records = fromLegacySync(items);
	if (records.length === 0) return;
	await importVideos(records);
	await chrome.storage.sync.remove(records.map((r) => r.videoId));
}

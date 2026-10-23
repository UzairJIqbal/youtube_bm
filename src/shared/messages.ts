export type Command = "add-bookmark" | "add-clip";

/** Messages sent from the popup or service worker to the content script. */
export type ContentMessage =
	| { type: "PLAY"; seconds: number }
	| { type: "LOOP"; start: number; end: number }
	| { type: "STOP_LOOP" }
	| { type: "GET_STATE" }
	| { type: "COMMAND"; command: Command };

export interface ContentState {
	videoId: string | null;
	videoTitle: string;
	currentTime: number;
	/** Start of a clip that is waiting for its end press. */
	pendingClipStart: number | null;
	loop: { start: number; end: number } | null;
}

export async function sendToTab<T = unknown>(
	tabId: number,
	message: ContentMessage,
): Promise<T | undefined> {
	try {
		return (await chrome.tabs.sendMessage(tabId, message)) as T;
	} catch {
		// No content script in this tab (e.g. YouTube tab opened before install).
		return undefined;
	}
}

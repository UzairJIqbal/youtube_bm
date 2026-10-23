// A tiny in-memory stand-in for the chrome.* APIs the popup uses, so the real
// popup component can be rendered outside the extension for store screenshots.
import type { ContentState } from "../../src/shared/messages";

type Listener = (changes: Record<string, unknown>, area: string) => void;

export function installChromeStub(
	data: Record<string, unknown>,
	tabUrl: string,
	state: ContentState,
): void {
	const store: Record<string, unknown> = structuredClone(data);
	const listeners = new Set<Listener>();

	const stub = {
		storage: {
			local: {
				get: async (key: string | null) =>
					key === null ? { ...store } : key in store ? { [key]: store[key] } : {},
				set: async (items: Record<string, unknown>) => {
					Object.assign(store, items);
					listeners.forEach((l) => l(items, "local"));
				},
				remove: async (key: string) => {
					delete store[key];
					listeners.forEach((l) => l({ [key]: {} }, "local"));
				},
			},
			onChanged: {
				addListener: (l: Listener) => listeners.add(l),
				removeListener: (l: Listener) => listeners.delete(l),
			},
		},
		tabs: {
			query: async () => [{ id: 1, url: tabUrl }],
			sendMessage: async (_id: number, message: { type: string }) =>
				message.type === "GET_STATE" ? state : true,
			create: async () => undefined,
		},
		runtime: { openOptionsPage: async () => undefined },
		commands: { getAll: async () => [] },
	};
	(globalThis as unknown as { chrome: unknown }).chrome = stub;
}

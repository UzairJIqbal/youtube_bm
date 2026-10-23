import { vi } from "vitest";

type Listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => void;

/** A minimal in-memory chrome.storage.local, enough for src/shared/storage.ts. */
export function installChromeStorage(initial: Record<string, unknown> = {}) {
	const data: Record<string, unknown> = structuredClone(initial);
	const listeners = new Set<Listener>();
	const emit = (changes: Record<string, chrome.storage.StorageChange>) => {
		for (const l of listeners) l(changes, "local");
	};

	const local = {
		async get(keys: string | null) {
			if (keys === null) return structuredClone(data);
			return keys in data ? { [keys]: structuredClone(data[keys]) } : {};
		},
		async set(items: Record<string, unknown>) {
			const changes: Record<string, chrome.storage.StorageChange> = {};
			for (const [k, v] of Object.entries(items)) {
				changes[k] = { oldValue: data[k], newValue: v };
				data[k] = structuredClone(v);
			}
			emit(changes);
		},
		async remove(key: string) {
			const changes = { [key]: { oldValue: data[key] } };
			delete data[key];
			emit(changes);
		},
	};

	vi.stubGlobal("chrome", {
		storage: {
			local,
			onChanged: {
				addListener: (l: Listener) => listeners.add(l),
				removeListener: (l: Listener) => listeners.delete(l),
			},
		},
	});
	return data;
}

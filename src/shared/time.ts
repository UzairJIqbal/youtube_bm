/** 75 → "1:15", 3723 → "1:02:03". */
export function formatTime(seconds: number): string {
	const total = Math.max(0, Math.floor(seconds));
	const h = Math.floor(total / 3600);
	const m = Math.floor((total % 3600) / 60);
	const s = total % 60;
	const ss = String(s).padStart(2, "0");
	return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

/** Accepts "75", "1:15" or "1:02:03". Returns null for anything else. */
export function parseTime(input: string): number | null {
	const parts = input.trim().split(":");
	if (parts.length === 0 || parts.length > 3) return null;
	if (!parts.every((p) => /^\d+(\.\d+)?$/.test(p))) return null;
	return parts.reduce((acc, p) => acc * 60 + Number(p), 0);
}

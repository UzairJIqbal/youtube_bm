// Loads dist/ into Chromium and exercises it on real YouTube.
// Run: npm run build && npm run e2e   (first time: npx playwright install chromium)
import { chromium } from "playwright";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const ext = resolve(process.argv[2] ?? "dist");
const out = mkdtempSync(join(tmpdir(), "ytsb-shots-"));
const ctx = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), "ytsb-")), {
	headless: true, channel: "chromium",
	args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`, "--mute-audio"],
	viewport: { width: 1280, height: 800 },
});
const log = (...a) => console.log("•", ...a);
try {
	let [sw] = ctx.serviceWorkers();
	sw ??= await ctx.waitForEvent("serviceworker");
	const extId = sw.url().split("/")[2];
	log("extension id", extId);

	// Welcome page opens on install.
	await new Promise((r) => setTimeout(r, 1500));
	log("pages after install:", ctx.pages().map((p) => p.url()).join(" | "));

	const page = await ctx.newPage();
	page.on("console", (m) => m.type() === "error" && m.text().includes("ytsb") && log("console error", m.text()));
	await page.goto("https://www.youtube.com/watch?v=aircAruvnKk&t=300s", { waitUntil: "domcontentloaded" });
	log("url", page.url());
	// Consent wall (EU) — decline non-essential.
	const reject = page.locator('button:has-text("Reject all")').first();
	if (await reject.isVisible({ timeout: 3000 }).catch(() => false)) { await reject.click(); log("declined consent"); }

	await page.waitForSelector(".ytsb-bookmark", { timeout: 30000 });
	log("buttons injected");
	await page.evaluate(() => { const v = document.querySelector("video"); v.muted = true; v.play(); });
	await page.waitForFunction(() => document.querySelector("video")?.currentTime > 300, null, { timeout: 30000 });

	await clickControl(page, ".ytsb-bookmark");
	await waitForToast(page, "Bookmarked");
	log("toast:", await page.textContent(".ytsb-toast"));

	// Clip: two clicks a few seconds apart.
	await clickControl(page, ".ytsb-clip");
	await waitForToast(page, "Clip starts");
	// Wait for real playback rather than wall-clock time, so a buffering stall doesn't make the clip too short.
	const clipFrom = await page.evaluate(() => document.querySelector("video").currentTime);
	await page.waitForFunction((t) => document.querySelector("video").currentTime > t + 3, clipFrom, { timeout: 20000 });
	await clickControl(page, ".ytsb-clip");
	await waitForToast(page, "Saved clip");
	log("toast:", await page.textContent(".ytsb-toast"));

	const markers = await page.$$eval(".ytsb-marker", (els) => els.map((e) => e.className));
	log("markers:", markers);

	const data = await sw.evaluate(() => chrome.storage.local.get(null));
	const rec = data["video:aircAruvnKk"];
	log("stored title:", rec?.videoTitle);
	for (const b of rec?.bookmarks ?? []) log("  bookmark", JSON.stringify({ start: b.start, end: b.end, title: b.title }));

	// Loop the clip the way the popup does, and check playback wraps back to the start.
	const clip = rec.bookmarks.find((b) => b.end !== undefined);
	await sw.evaluate(async (c) => {
		const [tab] = await chrome.tabs.query({ url: "https://www.youtube.com/watch*" });
		await chrome.tabs.sendMessage(tab.id, { type: "LOOP", start: c.start, end: c.end });
	}, clip);
	await page.waitForTimeout(500);
	await page.evaluate((end) => { document.querySelector("video").currentTime = end - 0.5; }, clip.end);
	await page.waitForTimeout(2000);
	const t = await page.evaluate(() => document.querySelector("video").currentTime);
	log("time after loop wrap:", t.toFixed(1), "clip", clip.start.toFixed(1), "-", clip.end.toFixed(1));
	if (t < clip.start - 0.5 || t > clip.end) throw new Error("loop did not wrap back into the clip");
	const state = await sw.evaluate(async () => {
		const [tab] = await chrome.tabs.query({ url: "https://www.youtube.com/watch*" });
		return chrome.tabs.sendMessage(tab.id, { type: "GET_STATE" });
	});
	log("state loop:", JSON.stringify(state.loop));
	await sw.evaluate(async () => {
		const [tab] = await chrome.tabs.query({ url: "https://www.youtube.com/watch*" });
		await chrome.tabs.sendMessage(tab.id, { type: "STOP_LOOP" });
	});
	await page.screenshot({ path: join(out, "e2e-player.png") });

	// Popup against this tab: open popup.html in a tab, it queries the active tab, so check library instead.
	const lib = await ctx.newPage();
	await lib.goto(`chrome-extension://${extId}/library.html`);
	await lib.waitForSelector(".entry");
	log("library entries:", await lib.$$eval(".entry", (e) => e.length));
	await lib.fill(".library__search", "zzzz-nothing");
	if ((await lib.$$(".entry")).length !== 0) throw new Error("search should hide every entry");
	await lib.fill(".library__search", "");
	await lib.screenshot({ path: join(out, "e2e-library.png") });

	// Navigate SPA to another video and check buttons re-render, no stale markers.
	await page.bringToFront();
	await page.evaluate(() => { location.href = "https://www.youtube.com/watch?v=IHZwWFHWa-w"; });
	await page.waitForSelector(".ytsb-bookmark", { timeout: 30000 });
	await page.waitForTimeout(2000);
	log("markers on second video:", await page.$$eval(".ytsb-marker", (e) => e.length));
	if (markers.length !== 2) throw new Error(`expected 2 markers, got ${markers.length}`);
	if (rec?.bookmarks.length !== 2) throw new Error("expected 2 stored bookmarks");
	if (rec.bookmarks.some((b) => !b.title)) throw new Error("expected chapter titles on every bookmark");
	const icon = await page.$eval(".ytsb-bookmark svg", (s) => s.getBoundingClientRect().width).catch(() => 0);
	log("OK — screenshots in", out, "icon width", icon);
} catch (e) {
	console.error("FAIL", e.message);
	await ctx.pages().at(-1)?.screenshot({ path: join(out, "e2e-fail.png") }).catch(() => {});
	process.exitCode = 1;
} finally {
	await ctx.close();
}

async function waitForToast(page, prefix) {
	try {
		await page.waitForFunction((p) => document.querySelector(".ytsb-toast")?.textContent.startsWith(p), prefix, { timeout: 5000 });
	} catch {
		const state = await page.evaluate(() => ({
			toast: document.querySelector(".ytsb-toast")?.textContent ?? null,
			time: document.querySelector("video")?.currentTime,
			readyState: document.querySelector("video")?.readyState,
		}));
		throw new Error(`no "${prefix}" toast: ${JSON.stringify(state)}`);
	}
}

// YouTube hides the controls a few seconds after the mouse stops, so wake them before every click.
async function clickControl(page, selector) {
	await page.mouse.move(10, 10);
	await page.hover("#movie_player");
	await page.waitForFunction(() => !document.querySelector("#movie_player")?.classList.contains("ytp-autohide"), null, { timeout: 3000 }).catch(() => {});
	await page.click(selector);
}

// Renders the store screenshots and promo tiles with headless Chrome.
// Usage: npm run store-assets
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const CHROME =
	process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 4789;

const shots = [
	["capture", "screenshot-1-capture.png", 1280, 800],
	["notes", "screenshot-2-notes.png", 1280, 800],
	["loop", "screenshot-3-loop.png", 1280, 800],
	["export", "screenshot-4-export.png", 1280, 800],
	["library&q=%23math", "screenshot-5-library.png", 1280, 800],
	["promo-small", "promo-small-440x280.png", 440, 280],
	["promo-marquee", "promo-marquee-1400x560.png", 1400, 560],
];

const build = spawnSync("npx", ["vite", "build", "-c", "store-assets/vite.config.ts"], { stdio: "inherit" });
if (build.status !== 0) process.exit(1);

mkdirSync(`${root}out`, { recursive: true });
const server = spawn("npx", ["vite", "preview", "-c", "store-assets/vite.config.ts", "--port", String(PORT), "--strictPort"], {
	stdio: "ignore",
});
await new Promise((r) => setTimeout(r, 1500));

try {
	for (const [scene, file, w, h] of shots) {
		const result = spawnSync(CHROME, [
			"--headless=new",
			"--disable-gpu",
			"--hide-scrollbars",
			"--force-device-scale-factor=1",
			`--window-size=${w},${h}`,
			"--virtual-time-budget=3000",
			`--screenshot=${root}out/${file}`,
			`http://localhost:${PORT}/?scene=${scene}`,
		]);
		console.log(result.status === 0 ? "✓" : "✗", file);
	}
} finally {
	server.kill();
}

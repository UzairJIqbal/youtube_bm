import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";

// Builds the popup, options page and service worker. The content script is built
// separately by vite.content.config.ts, because content scripts can't be ES modules.
export default defineConfig({
	plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
	build: {
		rollupOptions: {
			input: {
				popup: "popup.html",
				options: "options.html",
				background: "src/background/index.ts",
			},
			output: {
				entryFileNames: (chunk) =>
					chunk.name === "background" ? "background.js" : "assets/[name]-[hash].js",
			},
		},
	},
});

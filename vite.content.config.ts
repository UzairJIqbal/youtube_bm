import { defineConfig } from "vite";

export default defineConfig({
	publicDir: false,
	build: {
		emptyOutDir: false,
		lib: {
			entry: "src/content/index.ts",
			formats: ["iife"],
			name: "ytStudyBookmarks",
			fileName: () => "contentScript.js",
		},
	},
});

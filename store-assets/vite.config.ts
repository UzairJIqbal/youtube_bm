import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Builds the screenshot harness only; not part of the extension.
export default defineConfig({
	root: "store-assets",
	base: "./",
	plugins: [react()],
	build: { outDir: "dist", emptyOutDir: true, target: "es2022" },
});

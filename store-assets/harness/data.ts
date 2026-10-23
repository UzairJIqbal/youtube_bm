import type { VideoRecord } from "../../src/shared/types";

export const VIDEO_ID = "aircAruvnKk";
export const VIDEO_TITLE = "Lecture 4: Neural Networks and Backpropagation";
export const DURATION = 4520;

export const record: VideoRecord = {
	videoId: VIDEO_ID,
	videoTitle: VIDEO_TITLE,
	updatedAt: 0,
	bookmarks: [
		{ id: "1", start: 312, title: "Why neural networks?", note: "", tags: [], createdAt: 0 },
		{
			id: "2",
			start: 1104,
			title: "Gradient descent intuition",
			note: "Ball rolling downhill — step size = learning rate",
			tags: ["exam"],
			createdAt: 0,
		},
		{
			id: "3",
			start: 1980,
			end: 2145,
			title: "Chain rule, worked example",
			note: "Re-watch before the problem set",
			tags: ["exam", "math"],
			createdAt: 0,
		},
		{ id: "4", start: 2754, title: "Backprop, step by step", note: "", tags: ["exam"], createdAt: 0 },
		{
			id: "5",
			start: 3630,
			title: "Vanishing gradients",
			note: "Sigmoid saturates → use ReLU",
			tags: [],
			createdAt: 0,
		},
	],
};

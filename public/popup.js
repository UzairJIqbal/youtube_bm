console.log("Popup.js is running");

import { getCurrentTab } from "./utils";

const addnewBookmark = (bookmarksElement, bookmark) => {
	const bookmarkTitleElement = document.createElement("div");
	const newbookmarkElement = document.createElement("div");

	bookmarkTitleElement.textContent = bookmark.desc;
	bookmarkTitleElement.className = "bookmark-title";

	newbookmarkElement.id = "bookmark-" + bookmark.time;
	newbookmarkElement.className = "bookmark";
	newbookmarkElement.setAttribute("timestamp", bookmark.time);

	newbookmarkElement.appendChild(bookmarkTitleElement);
	bookmarksElement.appendChild(newbookmarkElement);
};

const viewBookmark = (currentVideobookmarks = []) => {
	const bookmarksElement = document.getElementById("bookmarks");
	bookmarksElement.innerHTML = "";

	if (currentVideobookmarks.length >= 1) {
		for (let i = 0; i < currentVideobookmarks.length; i++) {
			const bookmark = currentVideobookmarks[i];
			addnewBookmark(bookmarksElement, bookmark);
		}
	} else {
		bookmarksElement.innerHTML = `<i class="row">No bookmarks to show</i>`;
	}
};

document.addEventListener("DOMContentLoaded", async () => {
	const currentActiveTab = await getCurrentTab();
	console.log("currentActiveTab is :", currentActiveTab);

	const queryParameters = currentActiveTab.url.split("?")[1];
	console.log("queryParameters is :", queryParameters);
	const searchParameters = new URLSearchParams(queryParameters);
	console.log("searchParameters is :", searchParameters);
	const currentvideo = searchParameters.get("v");
	console.log("currentVideo", currentvideo);

	if (currentActiveTab.url.includes("youtube.com/watch") && currentvideo) {
		chrome.storage.sync.get(["currentVideo"], (result) => {
			const currentVideo = result;
			console.log(
				"currentVideo getting from localStorage in popup.js is :",
				currentVideo,
			);

			const currentVideobookmarks = result[currentVideo]
				? JSON.parse(result[currentvideo])
				: [];
			viewBookmark(currentVideobookmarks);
			console.log(
				"All currentVideobookmarks in popup.js is :",
				currentVideobookmarks,
			);
		});
	} else {
		const container = document.getElementsByClassName("container")[0];
		container.innerHTML = `<div class="title">THis is not a youtube video page</div>`;
	}
});

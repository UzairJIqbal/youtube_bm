import { getCurrentTab } from "./utils";
let updatedvideoBookmarks = [];
let greatupdatedvideoBookmarks = [];
let exportButton;
let importButton;
let currentVideo = "";
let importFileId = "";

const readJSONFile = (JSONfile) => {
	const bookmarksElement = document.getElementById("bookmarks");
	bookmarksElement.innerHTML = "";

	const reader = new FileReader();
	reader.readAsText(JSONfile);

	reader.onload = async () => {
		const jsonParseFile = JSON.parse(reader.result);
		importFileId = jsonParseFile.importFileId;
		const currentActiveTab = await getCurrentTab();
		const queryParameters = currentActiveTab.url.split("?")[1];
		const searchParameters = new URLSearchParams(queryParameters);
		currentVideo = searchParameters.get("v");

		greatupdatedvideoBookmarks = [
			...updatedvideoBookmarks,
			...jsonParseFile.jsonParseFileBookmarks,
		];

		chrome.storage.sync.set({
			[currentVideo]: JSON.stringify(
				[...greatupdatedvideoBookmarks].sort((a, b) => a.time - b.time),
			),
		});

		chrome.storage.sync.get([currentVideo], (result) => {
			const data = result[currentVideo];

			const bookmarks = JSON.parse(data || []);

			if (currentVideo != importFileId) {
				chrome.storage.sync.set({
					[currentVideo]: JSON.stringify(updatedvideoBookmarks),
				});

				chrome.storage.sync.get([currentVideo], (result) => {
					const getData = result[currentVideo];
					const getBookmarks = JSON.parse(getData || []);
					const seenTimes = [];
					if (getBookmarks.length >= 1) {
						const getfilteredbookmarks = getBookmarks.filter((getbookmark) => {
							if (seenTimes.includes(getbookmark.time)) {
								return false;
							} else seenTimes.push(getbookmark.time);
							return true;
						});
						bookmarksElement.innerHTML = "";
						getfilteredbookmarks.forEach((filterbookmark) => {
							addnewBookmark(bookmarksElement, filterbookmark);
						});
					} else {
						bookmarksElement.innerHTML = `<i class="row">No bookmarks to show</i>`;
					}
				});
				bookmarksElement.innerHTML = `<i class="row">Imported Bookmarks are of different video</i>`;
				return false;
			} else {
				chrome.tabs.sendMessage(
					currentActiveTab.id,
					{
						type: "BOOKMARKS",
						value: bookmarks,
					},
					(response) => {
						if (chrome.runtime.lastError) {
							console.log("Error :", chrome.runtime.lastError);
						}
						console.log("Response :", response);
					},
				);
				const seenTimes = [];
				if (bookmarks.length >= 1) {
					const filteredbookmarks = bookmarks.filter((bookmark) => {
						if (seenTimes.includes(bookmark.time)) {
							return false;
						} else seenTimes.push(bookmark.time);
						return true;
					});
					bookmarksElement.innerHTML = "";
					filteredbookmarks.forEach((filterbookmark) => {
						addnewBookmark(bookmarksElement, filterbookmark);
					});
				} else {
					bookmarksElement.innerHTML = `<i class="row">No bookmarks to show</i>`;
				}
			}
		});
	};

	reader.onerror = () => {
		bookmarksElement.innerHTML = "Error reading the file please try again";
	};
};

const handleInputFileEvent = (e) => {
	const existingContainer = document.getElementById("import-container");
	if (existingContainer) {
		existingContainer.style.display = "none";
	}
	const JSONfile = e.target.files[0];
	if (!JSONfile) {
		return;
	}
	readJSONFile(JSONfile);
};

const handleImportButtonEventListener = () => {
	const existingContainer = document.getElementById("import-container");

	if (existingContainer) {
		return;
	}

	const container = document.createElement("div");
	container.style.display = "flex";
	container.style.flexDirection = "column";
	container.style.gap = "10px";
	container.style.padding = "10px";
	container.style.borderRadius = "8px";
	container.style.width = "250px";
	container.id = "import-container";

	const labelElement = document.createElement("label");
	labelElement.textContent = "Select a file";
	labelElement.style.fontSize = "14px";
	labelElement.style.fontWeight = "600";

	const inputFile = document.createElement("input");
	inputFile.type = "file";
	inputFile.id = "myFile";
	inputFile.accept = ".json, application/json";
	inputFile.name = "myFile";
	inputFile.click();
	inputFile.addEventListener("change", handleInputFileEvent);
	container.appendChild(labelElement);
	container.appendChild(inputFile);
	document.body.appendChild(container);
};

const createSearchBarInput = (container) => {
	const searchBarElement = document.createElement("input");

	searchBarElement.type = "text";
	searchBarElement.className = "search-bar";
	searchBarElement.placeholder = "Search bookmarks...";
	container.appendChild(searchBarElement);
	searchBarElement.addEventListener("input", (e) => {
		const filtered = filterbookmarks(e.target.value);
		viewBookmark(filtered);
	});

	return searchBarElement;
};

const handleButtonEventListener = (e) => {
	if (updatedvideoBookmarks) {
		importFileId = currentVideo;

		const exportData = {
			importFileId: currentVideo,
			jsonParseFileBookmarks: updatedvideoBookmarks,
		};

		const jsonString = JSON.stringify(exportData);

		const blob = new Blob([jsonString], {
			type: "application/json",
		});

		const link = document.createElement("a");
		link.href = URL.createObjectURL(blob);
		link.download = "bookmarks.json";
		link.click();
	}
};

const createExportButton = (container) => {
	exportButton = document.createElement("button");
	exportButton.textContent = "export";
	exportButton.className = "button";
	exportButton.style.marginLeft = "32px";
	exportButton.style.backgroundColor = "#16a34a";
	exportButton.addEventListener("click", handleButtonEventListener);
	container.appendChild(exportButton);
	return exportButton;
};

const addnewBookmark = (bookmarksElement, bookmark) => {
	const bookmarkTitleElement = document.createElement("div");
	const newbookmarkElement = document.createElement("div");
	const controlParentElement = document.createElement("div");

	bookmarkTitleElement.textContent = bookmark.desc;
	bookmarkTitleElement.className = "bookmark-title";
	controlParentElement.className = "bookmark-controls";

	newbookmarkElement.id = "bookmark-" + bookmark.time;
	newbookmarkElement.className = "bookmark";
	newbookmarkElement.setAttribute("timestamp", bookmark.time);

	setBookmarkattribute("play", onPlay, controlParentElement);
	setBookmarkattribute("delete", onDelete, controlParentElement);

	newbookmarkElement.appendChild(bookmarkTitleElement);
	newbookmarkElement.appendChild(controlParentElement);
	bookmarksElement.appendChild(newbookmarkElement);
};

const filterbookmarks = (filterValue) => {
	return updatedvideoBookmarks.filter((item) =>
		item.desc.toLowerCase().includes(filterValue.toLowerCase()),
	);
};

const viewBookmark = (filteredbookmarks = []) => {
	const bookmarksElement = document.getElementById("bookmarks");
	bookmarksElement.innerHTML = "";
	if (exportButton) {
		if (filteredbookmarks.length === 0) {
			exportButton.disabled = true;
		}
	}
	if (filteredbookmarks.length >= 1) {
		for (let i = 0; i < filteredbookmarks.length; i++) {
			const bookmark = filteredbookmarks[i];
			addnewBookmark(bookmarksElement, bookmark);
		}
	} else {
		bookmarksElement.innerHTML = `<i class="row">No bookmarks to show</i>`;
	}
};

const setBookmarkattribute = (src, eventListener, controlParentElement) => {
	const controlElement = document.createElement("img");
	controlElement.src = chrome.runtime.getURL("assets/" + src + ".png");
	controlElement.addEventListener("click", eventListener);
	controlParentElement.appendChild(controlElement);
};

const onPlay = async (e) => {
	const bookmarkTime = e.target.parentNode.parentNode.getAttribute("timestamp");

	const activeTab = await getCurrentTab();

	chrome.tabs.sendMessage(
		activeTab.id,
		{
			type: "PLAY",
			value: bookmarkTime,
		},
		(response) => {
			if (chrome.runtime.lastError) {
				console.log("Error:", chrome.runtime.lastError.message);
				return;
			}
			console.log("Response :", response);
		},
	);
};

const onDelete = async (e) => {
	const bookmarkTime = e.target.parentNode.parentNode.getAttribute("timestamp");

	const activeTab = await getCurrentTab();

	const bookmarksElementtoDelete = document.getElementById(
		"bookmark-" + bookmarkTime,
	);

	bookmarksElementtoDelete.parentNode.removeChild(bookmarksElementtoDelete);

	chrome.tabs.sendMessage(
		activeTab.id,
		{
			type: "DELETE",
			value: bookmarkTime,
		},
		(updatedData) => {
			updatedvideoBookmarks = updatedData;

			viewBookmark(updatedData);
		},
	);
};
document.addEventListener("DOMContentLoaded", async () => {
	const currentActiveTab = await getCurrentTab();
	const queryParameters = currentActiveTab.url.split("?")[1];
	const searchParameters = new URLSearchParams(queryParameters);
	currentVideo = searchParameters.get("v");
	importButton = document.getElementById("importButton");

	if (importButton) {
		importButton.addEventListener("click", handleImportButtonEventListener);
	}

	if (currentActiveTab.url.includes("youtube.com/watch") && currentVideo) {
		const container = document.createElement("div");
		const bookmarkElement = document.getElementById("bookmarks");

		chrome.storage.sync.get([currentVideo], (result) => {
			if (chrome.runtime.lastError) {
				console.log(chrome.runtime.lastError);
				return;
			}
			const seenTimes = [];
			const currentVideobookmark = result[currentVideo]
				? JSON.parse(result[currentVideo])
				: [];

			const currentVideoFilteredBookmark = currentVideobookmark.filter(
				(bookmark) => {
					if (seenTimes.includes(bookmark.time)) {
						return false;
					} else seenTimes.push(bookmark.time);
					return true;
				},
			);
			updatedvideoBookmarks = currentVideoFilteredBookmark;

			const searchBar = createSearchBarInput(container);
			const exportButton = createExportButton(container);
			container.appendChild(searchBar);
			container.appendChild(exportButton);
			bookmarkElement.before(container);
			if (currentVideobookmark.length === 0) {
				exportButton.disabled = true;
			}
			viewBookmark(currentVideoFilteredBookmark);
		});
	} else {
		const container = document.getElementsByClassName("container")[0];
		container.innerHTML = `<div class="title">This is not a youtube video page</div>`;
	}
});

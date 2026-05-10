chrome.tabs.onUpdated.addListener((tabId, changeinfo, tab) => {
	if (
		changeinfo.status === "complete" &&
		tab.url &&
		tab.url.includes("youtube.com/watch")
	) {
		const queryParameters = tab.url.split("?")[1];
		const searchParameters = new URLSearchParams(queryParameters);
		chrome.tabs.sendMessage(tabId, {
			type: "NEW",
			videoId: searchParameters.get("v"),
		});
	}
});

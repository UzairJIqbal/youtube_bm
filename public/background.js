console.log("Background.js is running");

chrome.tabs.onUpdated.addListener((tabId, changeinfo, tab) => {
	console.log("The tabId from backgroung.js is :", tabId);

	if (
		changeinfo.status === "complete" &&
		tab.url &&
		tab.url.includes("youtube.com/watch")
	) {
		console.log("Tab URL's :", tab.url);

		const queryParameters = tab.url.split("?")[1];
		const searchParameters = new URLSearchParams(queryParameters);
		chrome.tabs.sendMessage(tabId, {
			type: "NEW",
			videoId: searchParameters.get("v"),
		});
	}
});

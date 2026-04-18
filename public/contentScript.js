(() => {
	console.log("Content Script is injected");

	let youtubeRightControls, youtubePlayer;
	let currentvideo = "";
	let allCurrentVideoBookmarks = [];

	chrome.runtime.onMessage.addListener((object) => {
		console.log("chrome on runtime message is running");

		const { type, videoId } = object;
		console.log("Video Type :", type);
		console.log("VideoId :", videoId);

		if (type === "NEW") {
			currentvideo = videoId;
			newVideoLoaded();
		}
	});

	const fetchBookmarks = async () => {
		return new Promise((resolve, reject) => {
			chrome.storage.sync.get(["currentVideo"], (result) => {
				const currentVideo = result;
				resolve(result[currentVideo] ? JSON.parse(result[currentVideo]) : []);
			});
		});
	};

	const newVideoLoaded = async () => {
		console.log("newVideoLoaded Function is loaded");

		const bookmarkBtnExists =
			document.getElementsByClassName("bookmark-btn")[0];
		console.log("BookmarkBtn Exists :", bookmarkBtnExists);

		allCurrentVideoBookmarks = await fetchBookmarks();

		if (!bookmarkBtnExists) {
			const bookmarkBtn = document.createElement("img");
			bookmarkBtn.src = chrome.runtime.getURL("assets/bookmark.png");
			bookmarkBtn.className = "ytp-button " + "bookmark-btn";
			bookmarkBtn.title = "Click to bookmark current timestamp";
			console.log("BookmarkBtn :", bookmarkBtn);

			youtubeRightControls =
				document.getElementsByClassName("ytp-right-controls")[0];

			youtubePlayer = document.getElementsByClassName("video-stream")[0];

			youtubeRightControls.appendChild(bookmarkBtn);

			bookmarkBtn.addEventListener("click", addnewBookmarkEventHandler);
		}
	};

	const addnewBookmarkEventHandler = async () => {
		const getCurrentTime = youtubePlayer.currentTime;
		console.log("getCurrentTime :", getCurrentTime);

		const finalCurrentTime = getTime(getCurrentTime);
		console.log("FinalCurrentTime :", finalCurrentTime);

		const newbookmark = {
			time: getCurrentTime,
			desc: "Bookmark at :" + finalCurrentTime,
		};
		console.log("newbookmark :", newbookmark);

		allCurrentVideoBookmarks = await fetchBookmarks();
		console.log("allCurrentVideoBookmarks", allCurrentVideoBookmarks);

		chrome.storage.sync.set({
			[currentvideo]: JSON.stringify(
				[...allCurrentVideoBookmarks, newbookmark].sort(
					(a, b) => a.time - b.time,
				),
			),
		});
	};

	const getTime = (getCurrentTime) => {
		var date = new Date(0);
		date.setSeconds(getCurrentTime);
		return date.toISOString().substr(11, 8);
	};
})();

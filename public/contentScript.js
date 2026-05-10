(() => {
	let youtubeRightControls, youtubePlayer;
	let currentVideo = "";
	let allCurrentVideoBookmarks = [];

	chrome.runtime.onMessage.addListener((object, sender, response) => {
		const { type, value, videoId } = object;

		if (type === "NEW") {
			currentVideo = videoId;
			newVideoLoaded();
		} else if (type === "PLAY") {
			youtubePlayer.currentTime = value;
		} else if (type === "DELETE") {
			const seenTimes = [];
			const currentVideoFilteredBookmark = allCurrentVideoBookmarks.filter(
				(bookmark) => {
					if (seenTimes.includes(bookmark.time)) {
						return false;
					} else seenTimes.push(bookmark.time);
					return true;
				},
			);
			allCurrentVideoBookmarks = currentVideoFilteredBookmark.filter(
				(b) => b.time != value,
			);

			chrome.storage.sync.set({
				[currentVideo]: JSON.stringify(allCurrentVideoBookmarks),
			});

			response(allCurrentVideoBookmarks);
		} else if (type === "BOOKMARKS") {
			allCurrentVideoBookmarks = value;
		}
	});

	const fetchBookmarks = async () => {
		return new Promise((resolve, reject) => {
			chrome.storage.sync.get([currentVideo], (result) => {
				resolve(result[currentVideo] ? JSON.parse(result[currentVideo]) : []);
			});
		});
	};

	const newVideoLoaded = async () => {
		const bookmarkBtnExists =
			document.getElementsByClassName("bookmark-btn")[0];

		allCurrentVideoBookmarks = await fetchBookmarks();

		if (!bookmarkBtnExists) {
			const bookmarkBtn = document.createElement("img");
			bookmarkBtn.src = chrome.runtime.getURL("assets/bookmark.png");
			bookmarkBtn.className = "ytp-button " + "bookmark-btn";
			bookmarkBtn.title = "Click to bookmark current timestamp";

			youtubeRightControls =
				document.getElementsByClassName("ytp-right-controls")[0];

			youtubePlayer = document.getElementsByClassName("video-stream")[0];

			youtubeRightControls.appendChild(bookmarkBtn);

			bookmarkBtn.addEventListener("click", addnewBookmarkEventHandler);
		}
	};

	const addnewBookmarkEventHandler = async () => {
		const getCurrentTime = youtubePlayer.currentTime;

		const finalCurrentTime = getTime(getCurrentTime);

		const newbookmark = {
			time: getCurrentTime,
			desc: "Bookmark at :" + finalCurrentTime,
		};

		chrome.storage.sync.set({
			[currentVideo]: JSON.stringify(
				[...allCurrentVideoBookmarks, newbookmark].sort(
					(a, b) => a.time - b.time,
				),
			),
		});
		allCurrentVideoBookmarks = await fetchBookmarks();
	};

	const getTime = (getCurrentTime) => {
		var date = new Date(0);
		date.setSeconds(getCurrentTime);
		return date.toISOString().substr(11, 8);
	};
})();

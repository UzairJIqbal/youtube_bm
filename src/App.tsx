import "./App.css";

const App = () => {
	return (
		<div className="container">
			<div>
				<div className="header">
					<div className="title">Your bookmarks for this video</div>
					<button className="button" id="importButton">
						Import
					</button>
				</div>
				<div className="bookmarks" id="bookmarks"></div>
			</div>
		</div>
	);
};

export default App;

import React from 'react';
import ReactDOM from 'react-dom';
import HomePage from './components/HomePage/HomePage';


if (document.getElementById('root')) {
	const [video_src, video_id] = [
		"/uploads/test.mp4",
		"73xK6JaeqV9MrGR2BlVO"
	];	
	ReactDOM.render(
		<HomePage
			videoSrc={video_src}
			apiURL={`https://dev.prosports.zone/api/v1/videos/${video_id}/annotations`}
		/>,
		document.getElementById('root'),
	);
}

import React from 'react';
import { hot } from 'react-hot-loader';
import { TwoDimensionalVideo } from 'apps/index';
import './HomePage.css';

const HomePage = () => {
	const handleSubmit = r => console.log(r);
	const previewNoticeList = [
		
	];
	const previewHeader = '';
	const emptyCheckSubmissionWarningText = '';
	const emptyCheckAnnotationItemWarningText = 'Step 2: Please track the cell bound by this layout';
	const emptyAnnotationReminderText = 'Step 1: Click the button above to add a new layout around a cell';

	// const videoSrc = "https://cildata.crbs.ucsd.edu/media/videos/15793/15793_web.mp4";
	const videoSrc = "/uploads/test.mp4";

	return (
		<div>
			<div className=''>
				<TwoDimensionalVideo
					onSubmit={ handleSubmit }
					url={videoSrc}
					videoWidth={ 1000 }
					hasReview
					isEmptyCheckEnable
					isSplitEnable
					isShowHideEnable
					emptyCheckSubmissionWarningText={ emptyCheckSubmissionWarningText }
					emptyCheckAnnotationItemWarningText={ emptyCheckAnnotationItemWarningText }
					emptyAnnotationReminderText={ emptyAnnotationReminderText }
					numAnnotationsToBeAdded={ 20 }
					defaultAnnotations={ [] }
					previewHeader={ previewHeader }
					previewNoticeList={ previewNoticeList }
				/>
			</div>
		</div>
	);
};

export default hot(module)(HomePage);

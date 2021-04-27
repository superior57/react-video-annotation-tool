import React from 'react';
import { hot } from 'react-hot-loader';
import { TwoDimensionalVideo } from '../../../../apps/index';
import './HomePage.css';

const HomePage = (props) => {
	const handleSubmit = r => console.log(r);
	const previewNoticeList = [

	];
	const previewHeader = '';
	const emptyCheckSubmissionWarningText = '';
	const emptyCheckAnnotationItemWarningText = 'Step 2: Please track the cell bound by this layout';
	const emptyAnnotationReminderText = 'Step 1: Click the button above to add a new layout around a cell';

	return (
		<div>
			<div className=''>
				<TwoDimensionalVideo
					onSubmit={ handleSubmit }
					url={props.videoSrc}
					videoWidth={ 1000 }
					hasReview
					isEmptyCheckEnable
					isSplitEnable
					isShowHideEnable
					serverURL={props.apiURL}
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

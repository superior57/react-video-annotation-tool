import React from 'react';
import { hot } from 'react-hot-loader';
import { TwoDimensionalImage, TwoDimensionalVideo } from 'apps/index';
import './HomePage.css';

const HomePage = () => {
	const handleSubmit = r => console.log(r);
	const imageAnnotations = [{
		id: 'jlyjm4py',
		name: 'jlyjm4py',
		type: 'Polygon',
		color: 'rgba(227,0,255,1)',
		vertices: [{
			id: 'jlyjm4py', name: 'jlyjm4py', x: 353.36249923706055, y: 258.8999938964844,
		}, {
			id: 'jlyjm5em', name: 'jlyjm5em', x: 444.79999923706055, y: 255.89999389648438,
		}, {
			id: 'jlyjm5v2', name: 'jlyjm5v2', x: 444.79999923706055, y: 269.8999938964844,
		}, {
			id: 'jlyjm6ci', name: 'jlyjm6ci', x: 477.79999923706055, y: 269.8999938964844,
		}, {
			id: 'jlyjm6ul', name: 'jlyjm6ul', x: 480.79999923706055, y: 285.8999938964844,
		}, {
			id: 'jlyjm7r8', name: 'jlyjm7r8', x: 356.79999923706055, y: 289.8999938964844,
		}],
		selectedOptions: [{ id: '0', value: 'root' }, { id: '2', value: 'Text' }, { id: '2-15', value: 'Suspicious' }],
	}];
	const options = {
		id: '0',
		value: 'root',
		children: [
			{
				id: '1',
				value: 'Object',
				children: [
					{
						id:
                        '1-1',
						value: 'Face',
						children: [
							{
								id: '1-1-1',
								value: 'Smile',
								children: [],
							},
						],
					},
					{ id: '1-2', value: 'Face Reflection', children: [] },
					{ id: '1-3', value: 'Framed Photo', children: [] },
					{ id: '1-4', value: 'Tattoo', children: [] },
					{ id: '1-5', value: 'Suspicious', children: [] },
					{ id: '1-6', value: 'Other', children: [] },
				],
			},
			{
				id: '2',
				value: 'Text',
				children: [
					{ id: '2-1', value: 'Letter', children: [] },
					{ id: '2-2', value: 'Computer Screen', children: [] },
					{ id: '2-3', value: 'Pill Bottle/Box', children: [] },
					{ id: '2-4', value: 'Miscellaneous Papers', children: [] },
					{ id: '2-5', value: 'Menu', children: [] },
					{ id: '2-6', value: 'Credit Card', children: [] },
					{ id: '2-7', value: 'Business Card', children: [] },
					{ id: '2-8', value: 'Poster', children: [] },
					{ id: '2-9', value: 'Clothing', children: [] },
					{ id: '2-10', value: 'Book', children: [] },
					{ id: '2-11', value: 'Receipt', children: [] },
					{ id: '2-12', value: 'Street Sign', children: [] },
					{ id: '2-13', value: 'License Plate', children: [] },
					{ id: '2-14', value: 'Newspaper', children: [] },
					{ id: '2-15', value: 'Suspicious', children: [] },
					{ id: '2-16', value: 'Other', children: [] },
				],
			},
		],
	};
	const videoAnnotations = [{
		id: 'jt192wyd',
		name: 'jt192wyd',
		label: '1-2',
		color: 'rgba(255,0,0,1)',
		incidents: [{
			id: 'jt192wyb', name: 'jt192wyb', x: 295.00402335586875, y: 193.3689649661968, width: 40.75402335586878, height: 41.63103503380317, time: 0.0308226495726496, status: 'Show',
		}, {
			id: 'jt1930nb', name: 'jt1930nb', x: 304.00402335586875, y: 202.3689649661968, width: 58.75402335586875, height: 60.63103503380319, time: 0.03178472222222222, status: 'Show',
		}, {
			id: 'jt193fim', name: 'jt193fim', x: 309.00402335586875, y: 213.3689649661968, width: 58.75402335586875, height: 60.63103503380319, time: 0.06388611111111112, status: 'Show',
		}, {
			id: 'jt193ijo', name: 'jt193ijo', x: 320.00402335586875, y: 220.3689649661968, width: 58.75402335586875, height: 74.63103503380319, time: 0.08677242063492063, status: 'Show',
		}, {
			id: 'jt19484m', name: 'jt19484m', x: 320.48992156587633, y: 218.42537212616642, width: 60.697616195899116, height: 78.17334040378043, time: 0.0966718253968254, status: 'Show',
		}, {
			id: 'jt193o4y', name: 'jt193o4y', x: 321.00402335586875, y: 216.3689649661968, width: 62.75402335586875, height: 71.63103503380319, time: 0.10714583333333334, status: 'Show',
		}, {
			id: 'jt194dom', name: 'jt194dom', x: 321.00402335586875, y: 218.8083044640243, width: 62.75402335586875, height: 69.1916955359757, time: 0.1195857142857143, status: 'Show',
		}, {
			id: 'jt193taw', name: 'jt193taw', x: 321.00402335586875, y: 228.3689649661968, width: 62.75402335586875, height: 59.63103503380319, time: 0.13459007936507936, status: 'Show',
		}, {
			id: 'jt193zb4', name: 'jt193zb4', x: 318.00402335586875, y: 228.3689649661968, width: 81.75402335586875, height: 59.63103503380319, time: 0.1693952380952381, status: 'Show',
		}, {
			id: 'jt195ltz', name: 'jt195ltz', x: 328.2874098641244, y: 230.6523514744525, width: 70.85164231813906, height: 56.631035033803215, time: 0.1985523622047244, status: 'Show',
		}, {
			id: 'jt194trg', name: 'jt194trg', x: 322.00402335586875, y: 232.3689649661968, width: 76.66967862975952, height: 59.63103503380319, time: 0.22047222222222224, status: 'Show',
		}, {
			id: 'jt194lgm', name: 'jt194lgm', x: 318.00402335586875, y: 228.3689649661968, width: 75.75402335586875, height: 59.63103503380319, time: 0.22967083333333332, status: 'Show',
		}, {
			id: 'jt195p7m', name: 'jt195p7m', x: 318.00402335586875, y: 228.3689649661968, width: 68.75402335586875, height: 58.19684946385905, time: 0.25359350393700786, status: 'Show',
		}, {
			id: 'jt1951r9', name: 'jt1951r9', x: 318.00402335586875, y: 228.3689649661968, width: 75.75402335586875, height: 54.63103503380319, time: 0.31307242063492063, status: 'Show',
		}, {
			id: 'jt195v9l', name: 'jt195v9l', x: 318.00402335586875, y: 228.3689649661968, width: 75.75402335586875, height: 54.63103503380319, time: 0.34623937007874017, status: 'Hide',
		}],
		childrenNames: [],
		parentName: 'jt1922xu',
	}, {
		id: 'jt192wyc',
		name: 'jt192wyc',
		label: '1-1',
		color: 'rgba(255,0,0,1)',
		incidents: [{
			id: 'jt192wyb', name: 'jt192wyb', x: 274.25, y: 171.73792993239366, width: 40.75402335586878, height: 41.63103503380317, time: 0.0308226495726496, status: 'Show',
		}, {
			id: 'jt19349x', name: 'jt19349x', x: 271.25, y: 167.73792993239366, width: 60.75402335586875, height: 58.63103503380316, time: 0.03178472222222222, status: 'Show',
		}, {
			id: 'jt193ekd', name: 'jt193ekd', x: 274.25, y: 160.73792993239366, width: 60.75402335586875, height: 58.63103503380316, time: 0.06388611111111112, status: 'Show',
		}, {
			id: 'jt193hp1', name: 'jt193hp1', x: 280.25, y: 160.73792993239366, width: 60.75402335586875, height: 58.63103503380316, time: 0.08677242063492063, status: 'Show',
		}, {
			id: 'jt194cbv', name: 'jt194cbv', x: 280.1326975821677, y: 158.62062751456136, width: 60.75402335586875, height: 58.63103503380316, time: 0.1195857142857143, status: 'Show',
		}, {
			id: 'jt193umg', name: 'jt193umg', x: 274.25, y: 154.73792993239366, width: 60.75402335586875, height: 58.63103503380316, time: 0.13459007936507936, status: 'Show',
		}, {
			id: 'jt193y7q', name: 'jt193y7q', x: 268.25, y: 155.73792993239366, width: 60.75402335586875, height: 58.63103503380316, time: 0.1693952380952381, status: 'Show',
		}, {
			id: 'jt194hxg', name: 'jt194hxg', x: 260.25, y: 157.73792993239366, width: 60.75402335586875, height: 58.63103503380316, time: 0.20233392857142857, status: 'Show',
		}, {
			id: 'jt194mj1', name: 'jt194mj1', x: 253.25, y: 156.73792993239366, width: 60.75402335586875, height: 58.63103503380316, time: 0.22967083333333332, status: 'Show',
		}, {
			id: 'jt195qgw', name: 'jt195qgw', x: 246.25, y: 156.73792993239366, width: 63.66047805713703, height: 58.63103503380316, time: 0.25359350393700786, status: 'Show',
		}, {
			id: 'jt194xqh', name: 'jt194xqh', x: 253.25, y: 156.73792993239366, width: 52.75402335586875, height: 58.63103503380316, time: 0.27642281746031744, status: 'Show',
		}, {
			id: 'jt1955u1', name: 'jt1955u1', x: 265.25, y: 159.73792993239366, width: 40.75402335586875, height: 49.63103503380316, time: 0.3564833333333333, status: 'Show',
		}, {
			id: 'jt195b3i', name: 'jt195b3i', x: 265.25, y: 141.73792993239366, width: 40.75402335586875, height: 49.63103503380316, time: 0.45984980158730154, status: 'Show',
		}, {
			id: 'jt1961v6', name: 'jt1961v6', x: 269.25, y: 144.73792993239366, width: 40.75402335586875, height: 49.63103503380316, time: 0.47851751968503936, status: 'Show',
		}, {
			id: 'jt1965az', name: 'jt1965az', x: 262.25, y: 144.73792993239366, width: 47.75402335586875, height: 49.63103503380316, time: 0.5342496062992126, status: 'Show',
		}, {
			id: 'jt1968nk', name: 'jt1968nk', x: 262.25, y: 149.73792993239366, width: 47.75402335586875, height: 49.63103503380316, time: 0.5904106299212598, status: 'Show',
		}, {
			id: 'jt196ax3', name: 'jt196ax3', x: 270.25, y: 158.73792993239366, width: 47.75402335586875, height: 49.63103503380316, time: 0.6662596456692913, status: 'Show',
		}, {
			id: 'jt196dys', name: 'jt196dys', x: 268.25, y: 164.73792993239366, width: 47.75402335586875, height: 49.63103503380316, time: 0.7368370078740157, status: 'Show',
		}, {
			id: 'jt196guu', name: 'jt196guu', x: 272.25, y: 154.73792993239366, width: 47.75402335586875, height: 49.63103503380316, time: 0.801053937007874, status: 'Show',
		}, {
			id: 'jt196k7h', name: 'jt196k7h', x: 273.25, y: 157.73792993239366, width: 47.75402335586875, height: 49.63103503380316, time: 0.8626350393700787, status: 'Show',
		}],
		childrenNames: [],
		parentName: 'jt1922xu',
	}, {
		id: 'jt1922xu',
		name: 'jt1922xu',
		label: '1',
		color: 'rgba(255,219,0,1)',
		incidents: [{
			id: 'jt1922xu', name: 'jt1922xu', x: 274.25, y: 174, width: 80, height: 81, time: 0, status: 'Show',
		}, {
			id: 'jt192wyb', name: 'jt192wyb', x: 274.25, y: 171.73792993239366, width: 81.50804671173756, height: 83.26207006760634, time: 0.0308226495726496, status: 'Split',
		}],
		childrenNames: ['jt192wyc', 'jt192wyd'],
		parentName: '',
	}];
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

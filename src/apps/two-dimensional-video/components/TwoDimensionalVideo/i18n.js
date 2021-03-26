import { getI18nextInstance } from 'shared/utils/i18nextUtils';

const resources = {
	en: {
		twoDimensionalVideo: {
			addingBox: 'Adding a New Layout',
			addBox: 'Add a New Layout',
			incidentSize: 'Size',
			incidentPosition: 'Position',
			dialogTitleDelete: 'Delete an annotation',
			dialogTitleShow: 'Show this annotation',
			dialogTitleHide: 'Hide this annotation',
			dialogTitleSplit: 'Split this box',
			dialogMessageDelete: 'Are you sure to delete this layout?',
			dialogMessageShow: 'Does the object show up on the video and would you like to show its annotation?',
			dialogMessageHide: 'Does the object leave the video or is obscured by other objects and would you like to hide its annotation?',
			dialogMessageSplit: 'Does the object split into two and would you like to split this bounding box into two boxes?',
			annotationItemParent: 'Parent',
			annotationItemChildren: 'Children',
			annotationItemIncidentHistory: 'Resizing & Tracking History',
			canvasAddingHint: 'Click and Drag here to add new layout',
			playerControlSpeed: 'Speed',
		},
	},
};
export default getI18nextInstance({ ns: 'twoDimensionalVideo', resources });

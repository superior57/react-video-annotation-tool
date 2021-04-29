import { withBasicIdentities } from '../../../../shared/models/node/index';
const canClearRedundantIncidents = state => ({
	clearRedundantIncidents: (status) => {
		const { incidents } = state;
		for (let i = incidents.length - 1; i > 0; i -= 1) {
			if (incidents[i].status === status && incidents[i].status === incidents[i - 1].status) {
				incidents.splice(i, 1);
			}
		}
	},
});

const Polygon = ({
	id,
	name,
	label,
	color,
	isManipulatable = true,
	isClosed = false,
	selectedOptions = [],
	shapeType = '',
	labelText = '',
	childrenNames = [],
	parentName = '',
	incidents = [],
	arrowHead = false,
	wave = false,
	lineMode = "0",
	videoWidth = 0
}) => {
	const state = {
		color,
		isClosed,
		selectedOptions,
		shapeType,
		isManipulatable,
		labelText,
		childrenNames,
		parentName,
		incidents,
		arrowHead,
		lineMode,
		wave,
		videoWidth
	};
	return Object.assign(state, withBasicIdentities({ id, name, label }), canClearRedundantIncidents(state));
};

export {
	Polygon,
};

import { withBasicIdentities } from 'shared/models/node/index';

const SHOW = 'Show';
const HIDE = 'Hide';
const SPLIT = 'Split';

const Incident = ({
	id,
	name,
	x = 0,
	y = 0,
	label,
	width = 0,
	height = 0,
	time = '',
	status = SHOW,
	vertices = []
}) => {
	const state = {
		x,
		y,
		width,
		height,
		time,
		status,
		vertices
	};
	return Object.assign(state, withBasicIdentities({ id, name, label }));
};

export {
	Incident, SHOW, HIDE, SPLIT,
};

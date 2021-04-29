import React, { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
	Button, Collapse, Badge, ListGroupItem, Input
} from 'reactstrap';
import { MdCallSplit, MdDelete } from 'react-icons/md';
import { FaChevronDown, FaChevronUp, FaPencilAlt } from 'react-icons/fa';
import { IoMdEyeOff, IoMdEye } from 'react-icons/io';
import { SPLIT, HIDE, SHOW } from '../../../../../models/2DVideo';
import IncidentList from '../../IncidentList/IncidentList.jsx';
import TwoDimensionalVideoContext from '../../TwoDimensionalVideo/twoDimensionalVideoContext';
import OpenDialogButton from '../../OpenDialogButton/OpenDialogButton.jsx';
import { isDialogDisabledConst } from '../isDialogDisabledReducer';
import 'bootstrap/dist/css/bootstrap.css';
import './annotationItem.scss';

const AnnotationItem = ({
	className,
	itemData,
	isDialogDisabled,
	dispatchIsDialogDisabled
}) => {
	const twoDimensionalVideoContext = useContext(TwoDimensionalVideoContext);
	const {
		played,
		entities,
		focusing,
		duration,
		onAnnotationItemClick,
		onAnnotationDeleteClick,
		onAnnotationShowHideClick,
		onAnnotationEditClick,
	} = twoDimensionalVideoContext;
	const [isIncidentListOpen, setIsIncidentListOpen] = useState(false);	

	const { t } = useTranslation('twoDimensionalVideo');

	const {
		incidents,
		name,
		labelText
	} = itemData;
	
	const currentIncident = [...incidents].reverse().find(incident => played >= incident.time) || {};

	let rootClassName = `annotation-item${className ? ` ${className}` : ''}`;

	rootClassName = `${rootClassName} ${name != focusing ? '' : 'selected'}`;

	let [startSec, endSec] = [0, 0];
	let cntIncident = incidents.length;

	
	if (cntIncident > 0) {
		startSec = parseFloat(incidents[0].time) * parseFloat(duration);
		if (cntIncident < 2) {
			endSec = duration;
		} else {
			endSec = incidents[cntIncident - 1].status == "Hide" ? parseFloat(incidents[cntIncident - 1].time) * parseFloat(duration) : duration;
		}
	}

	startSec = parseInt(startSec);
	endSec = parseInt(endSec);

	return (
		<ListGroupItem
			className={ rootClassName }
			name={ name }
			onClick={ () => onAnnotationItemClick(name) }
		>
			<div className='d-flex mb-2'>
				<div className='w-100'>
					{
						name != focusing ? labelText : <strong>{labelText}</strong>
					}
					<div>
					{`(sec ${startSec} - ${endSec})`}
					</div>
				</div>
				<div className="d-flex justify-content-end">
					<div>
						<Button 
							className="mr-3 px-4"
							outline
							color="dark"
							onClick={ onAnnotationEditClick }
						>
							Edit
						</Button>
					</div>
					<div>
					<OpenDialogButton
						color='danger'
						title={ t('dialogTitleDelete') }
						message={ t('dialogMessageDelete') }
						isDialogDisabled={ isDialogDisabled.delete }
						onYesClick={ () => onAnnotationDeleteClick(name) }
						onDontShowAgainChange={ e => dispatchIsDialogDisabled({ type: isDialogDisabledConst.DELETE, value: e.target.checked }) }
					>
						Delete
					</OpenDialogButton>
					</div>
				</div>
			</div>
		</ListGroupItem>
	);
};

AnnotationItem.propTypes = {
	className: PropTypes.string,
    itemData: PropTypes.object,
	dispatchIsDialogDisabled: PropTypes.func,
	isDialogDisabled: PropTypes.object,
};
AnnotationItem.defaultProps = {
	className: '',
	itemData: {},
	dispatchIsDialogDisabled: () => {},
	isDialogDisabled: {},
};
export default AnnotationItem;

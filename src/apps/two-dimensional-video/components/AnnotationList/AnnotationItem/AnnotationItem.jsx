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
import ColorPicker from "../../../../../shared/components/ColorPicker/ColorPicker";

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
		isEmptyCheckEnable,
		isSplitEnable,
		isShowHideEnable,
		emptyCheckAnnotationItemWarningText,
		onAnnotationItemClick,
		onAnnotationDeleteClick,
		onAnnotationShowHideClick,
		onAnnotationSplitClick,
		onChangeColorPicker,
		onAnnotationChangeLabel
	} = twoDimensionalVideoContext;
	const [isIncidentListOpen, setIsIncidentListOpen] = useState(false);	

	const { t } = useTranslation('twoDimensionalVideo');

	const {
		incidents,
		name,
		label,
		color,
		parentName,
		childrenNames,
		labelText
	} = itemData;

	const [state, setState] = useState({
		labelText: labelText
	});

	// console.log("itemdata in annotationItem", itemData);
	const parentAnnotation = entities.annotations[parentName];
	const childrenUI = childrenNames.map(c => (
		<Button color='link' key={ c } onClick={ () => onAnnotationItemClick(c) } className='video-ann-relatives'>
			{`${entities.annotations[c].label} `}
		</Button>
	));
	let showButtonUI = (
		<OpenDialogButton
			className='d-flex align-items-center annotation-item__control-button'
			outline
			title={ t('dialogTitleShow') }
			message={ t('dialogMessageShow') }
			isDialogDisabled={ isDialogDisabled.show }
			onYesClick={ () => onAnnotationShowHideClick({ name, status: SHOW }) }
			onDontShowAgainChange={ e => dispatchIsDialogDisabled({ type: isDialogDisabledConst.SHOW, value: e.target.checked }) }
		>
			<IoMdEye />
			{SHOW}
		</OpenDialogButton>
	);
	let hideButtonUI = (
		// <OpenDialogButton
		// 	className='d-flex align-items-center annotation-item__control-button'
		// 	outline
		// 	title={ t('dialogTitleHide') }
		// 	message={ t('dialogMessageHide') }
		// 	isDialogDisabled={ isDialogDisabled.hide }
		// 	onYesClick={ () => onAnnotationShowHideClick({ name, status: HIDE }) }
		// 	onDontShowAgainChange={ e => dispatchIsDialogDisabled({ type: isDialogDisabledConst.HIDE, value: e.target.checked }) }
		// >
		// 	{/* <IoMdEyeOff /> */}
		// 	{/* {HIDE} */}
		// 	End
		// </OpenDialogButton>		
		<Button color="secondary" onClick={ () => onAnnotationShowHideClick({ name, status: HIDE }) }>
			End
		</Button>
	);
	let splitButtonUI = (
		<OpenDialogButton
			className='d-flex align-items-center annotation-item__control-button'
			outline
			title={ t('dialogTitleSplit') }
			message={ t('dialogMessageSplit') }
			isDialogDisabled={ isDialogDisabled.split }
			onYesClick={ () => onAnnotationSplitClick(name) }
			onDontShowAgainChange={ e => dispatchIsDialogDisabled({ type: isDialogDisabledConst.HIDE, value: e.target.checked }) }
		>
			<MdCallSplit />
			{SPLIT}
		</OpenDialogButton>
	);
	const currentIncident = [...incidents].reverse().find(incident => played >= incident.time) || {};

	switch (currentIncident.status) {
	case SHOW:
		showButtonUI = null;
		break;
	case HIDE:
		hideButtonUI = null;
		splitButtonUI = null;
		break;
	case SPLIT:
		showButtonUI = null;
		hideButtonUI = null;
		break;
	default:
		showButtonUI = null;
		hideButtonUI = null;
		splitButtonUI = null;
		break;
	}

	const warningText = isEmptyCheckEnable && incidents.length < 2 && <span className='text-danger'>{emptyCheckAnnotationItemWarningText}</span>;
	let rootClassName = `annotation-item${className ? ` ${className}` : ''}`;
	if (name !== focusing) {
		return (
			<ListGroupItem
				className={ rootClassName }
				name={ name }
				onClick={ () => onAnnotationItemClick(name) }
				action
			>
				<div className='d-flex w-100 justify-content-between align-items-center'>
					<div className="annotation-nav-wrap">{ state.labelText }</div>
				</div>
			</ListGroupItem>
		);
	}

	rootClassName = `${rootClassName} annotation-item--highlight`;

	const handleChangeLabel = (e) => {
		setState({
			...state,
			labelText: e.target.value
		});
		onAnnotationChangeLabel(e.target.value);
	}

	return (
		<ListGroupItem
			className={ rootClassName }
			name={ name }
			style={ { borderColor: color.replace(/,1\)/, ',.3)') } }
		>
			<div className='d-flex align-items-center mb-2'>
				<div className='mr-auto'>
					{/* <strong>{label+ ' Layout'}</strong> */}
					<Input 
						value={state.labelText}
						onChange={e => handleChangeLabel(e)}
					/>
				</div>
				{/* {isSplitEnable && splitButtonUI} */}
				{/* <ColorPicker />
				{isShowHideEnable && hideButtonUI} */}
				{/* {showButtonUI} */}
				
			</div>
			<div className="d-flex justify-content-end">
				{/* <ColorPicker
					onChange={ onChangeColorPicker }
					value={ color.replace(/,1\)/, ',.3)') }					
				/> */}
				{
					isShowHideEnable && 
					<Button 
						className="ml-2"
						outline
						color="dark"
						size="sm"
						onClick={ () => onAnnotationShowHideClick({ name, status: HIDE }) }
					>
						End
					</Button>
				}
				<OpenDialogButton
					className='d-flex align-items-center annotation-item__delete-button ml-1'
					color='link'
					title={ t('dialogTitleDelete') }
					message={ t('dialogMessageDelete') }
					isDialogDisabled={ isDialogDisabled.delete }
					onYesClick={ () => onAnnotationDeleteClick(name) }
					onDontShowAgainChange={ e => dispatchIsDialogDisabled({ type: isDialogDisabledConst.DELETE, value: e.target.checked }) }
				>
					<MdDelete size={20} color="red" />
				</OpenDialogButton>
			</div>
			{/* <div>
				{parentAnnotation && (
					<div>
						<Badge color='secondary'>{ t('annotationItemParent') }</Badge>
						<Button
							color='link'
							onClick={ () => onAnnotationItemClick(parentAnnotation.name) }
							className='annotation-item__parent-button'
						>
							{parentAnnotation.label}
						</Button>
					</div>
				)}
			</div>
			<div>
				{childrenUI.length > 0 && (
					<div>
						<Badge color='secondary'>{ t('annotationItemChildren') }</Badge>
						{childrenUI}
					</div>
				)}
			</div> */}
			{/* <Button
				color='link'
				className='d-flex align-items-center justify-content-between incident-list-toggle-button p-3 mt-2'
				onClick={ () => setIsIncidentListOpen(!isIncidentListOpen) }
				style={ { marginBottom: 0 } }
			>
				<div>{ t('annotationItemIncidentHistory') }</div>
				{isIncidentListOpen ? <FaChevronUp /> : <FaChevronDown />}
			</Button> */}
			{/* <Collapse isOpen={ isIncidentListOpen }>
			</Collapse> */}
			{/* <IncidentList incidents={ incidents } annotationName={ name } /> */}
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

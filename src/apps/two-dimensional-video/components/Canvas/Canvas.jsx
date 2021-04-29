import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import {
	Stage, Layer, Rect, Group, Text, Circle, Arrow, Line
} from 'react-konva';
import { useTranslation } from 'react-i18next';
import { Incident, SHOW } from '../../models/incident';
import ResizingAnchor from './ResizingAnchor/ResizingAnchor.jsx';
import { getInterpolatedData, INTERPOLATION_TYPE } from '../../utils/interpolationUtils';
import './canvas.scss';
import { getShapeTypeKey } from "../../models/shape";

const handleGroupDragMove = (e, canvasWidth, canvasHeight, shapeType) => {
	if (e.target.getClassName() !== 'Group') return;
	const group = e.target;
	const topLeft = group.get('.topLeft')[0];
	const shapeKey = getShapeTypeKey(shapeType);
	const obj = group.get(shapeKey)[0];
	let absX; let absY;
	// boundary
	absX = topLeft.getAbsolutePosition().x;
	absY = topLeft.getAbsolutePosition().y;
	absX = absX < 0 ? 0 : absX;
	absY = absY < 0 ? 0 : absY;
	absX = absX + obj.width() > canvasWidth ? canvasWidth - obj.width() : absX;
	absY = absY + obj.height() > canvasHeight ? canvasHeight - obj.height() : absY;
	topLeft.setAbsolutePosition({ x: absX, y: absY });
	group.x(topLeft.getAbsolutePosition().x);
	group.y(topLeft.getAbsolutePosition().y);
	topLeft.position({ x: 0, y: 0 });
};

/* for polygon */
const CONST = {
	DOT_LENGTH: 5,
	MAGNIFIER_LENGTH: 200,
};

const handleMouseLeave = (isAdding) => {
	document.body.style.cursor = isAdding ? 'crosshair' : 'default';
};

const handleMouseOut = (isAdding) => {
	document.body.style.cursor = isAdding ? 'crosshair' : 'default';
};

const handleMouseOver = (isAdding) => {
	if (isAdding) return;
	document.body.style.cursor = 'pointer';
};

const handleFirstVertexMouseOver = () => {
	document.body.style.cursor = 'cell';
};

const handleVertexMouseOver = () => {
	document.body.style.cursor = 'move';
};

const handleVertexDragMove = (e, isAdding, entities, i) => {
	if (isAdding) return;
	document.body.style.cursor = 'move';
	const activeVertex = e.target;
	const group = activeVertex.getParent();
	const line = group.get('Line')[0];
	const linePoints = [], shapePoints = [], controlPoints = [];
	const { wave, shapeType } = entities.annotations[group.name()];
	let theata = 0;

	if (shapeType === "line") {
		entities.annotations[group.name()].incidents[i].vertices.forEach((v) => {
			if (v.name !== activeVertex.name()) {
				linePoints.push(v.x); linePoints.push(v.y);
				return;
			}
			linePoints.push(activeVertex.x()); linePoints.push(activeVertex.y());		
		});
	
		// for wave
		const leftWavePoints = [], rightWavePoints = [];
		controlPoints.splice(0, 2, 
			linePoints[2],
			linePoints[3]
		);
		leftWavePoints.splice(0, 2, 
			parseFloat(linePoints[0]) + ((parseFloat(controlPoints[0]) - parseFloat(linePoints[0])) / 2),
			controlPoints[1]
		);
		rightWavePoints.splice(0, 2, 
			parseFloat(controlPoints[0]) + ((parseFloat(linePoints[linePoints.length - 2]) - parseFloat(controlPoints[0])) / 2),
			controlPoints[1]
		);
		theata = angle(linePoints[0], linePoints[1], linePoints[linePoints.length - 2], linePoints[linePoints.length - 1]);
		if (wave) {			
			shapePoints.splice(0, 2, linePoints[0], linePoints[1]);
			shapePoints.splice(2, 2, leftWavePoints[0], leftWavePoints[1]);
			shapePoints.splice(4, 2, rightWavePoints[0], rightWavePoints[1]);
			shapePoints.splice(6, 2, linePoints[linePoints.length - 2], linePoints[linePoints.length - 1]);
			theata = angle(rightWavePoints[0], rightWavePoints[1], linePoints[linePoints.length - 2], linePoints[linePoints.length - 1]);
		} else {
			shapePoints.splice(0, 2, linePoints[0], linePoints[1]);
			shapePoints.splice(2, 2, linePoints[linePoints.length - 2], linePoints[linePoints.length - 1]);
		}
		if (entities.annotations[group.name()].arrowHead) {
			const arrowHead = group.get('Arrow')[0];
			arrowHead.setRotation(theata);
		}
	
		line.points(shapePoints);
	} else {
		entities.annotations[group.name()].incidents[i].vertices.forEach((v) => {
			if (v.name !== activeVertex.name()) {
				linePoints.push(v.x); linePoints.push(v.y);
				return;
			}
			linePoints.push(activeVertex.x()); linePoints.push(activeVertex.y());		
		});
	
		line.points(linePoints);
	}
	
};

/** calculate two points angle */
const angle = (cx, cy, ex, ey) => {
	var dy = parseFloat(ey) - parseFloat(cy);
	var dx = parseFloat(ex) - parseFloat(cx);
	var theta = Math.atan2(dy, dx); // range (-PI, PI]
	theta *= 180 / Math.PI; // rads to degs, range (-180, 180]
	//if (theta < 0) theta = 360 + theta; // range [0, 360)
	return theta;
}

const Canvas = ({
	className,
	dotLength,
	width: canvasWidth,
	height: canvasHeight,
	objects,
	played,
	focusing,
	isAdding,
	entities,
	annotations,
	isEmptyCheckEnable, 
	onStageMouseDown,
	onGroupDragEnd,
	onGroupMouseDown,
	onDotDragEnd,
	onDotMouseDown,
	onVertexMouseDown,
	onLineMouseDown,
	onVertexDragEnd,
	onGroupMove
}) => {
	const { t } = useTranslation('twoDimensionalVideo');
	const layerItems = [];
	
	annotations.slice().reverse().forEach((annotationId) => {
		const { color, id, name, shapeType, isManipulatable } = entities.annotations[annotationId];
		const isCurrent = focusing == id;

		if( shapeType == "polygon" ) {
			const { isClosed, incidents } = entities.annotations[annotationId];
			const colorWithOpacity = color.replace(/,1\)/, ',.15)');
			const verticesUI = [];
			const linePoints = [];
			const startPoint = {};
			for (let i = 0; i < incidents.length; i ++) {
				let x, y;
				if (played >= incidents[i].time) {
					if (i !== incidents.length - 1 && played >= incidents[i + 1].time) {
						continue;
					}
					if (incidents[i].status !== SHOW) break; // todo

					incidents[i].vertices.forEach((v, vi) => {
						const { name } = v;
						if (i === incidents.length - 1) {
							({
								x,
								y,
							} = v);
						} else {
							const interpoPos = getInterpolatedData({
								startIncident: incidents[i],
								endIncident: incidents[i + 1],
								currentTime: played,
								type: INTERPOLATION_TYPE.POSITION,
								vname: name,
								shapeType
							});
							({
								x, y,
							} = interpoPos);
						}	

						if (vi === 0) {
							startPoint.x = v.x; startPoint.y = v.y;
						}
						if (isAdding && focusing === name && vi === 0) {
							verticesUI.push(
								<Circle
									x={ x }
									y={ y }
									key={ v.name }
									name={ v.name }
									radius={ CONST.DOT_LENGTH * 1.1 }
									stroke={ color }
									fill={ colorWithOpacity }
									strokeWidth={ 1 }
									draggable
									dragOnTop={ false }
									onMouseDown={ onVertexMouseDown }
									onMouseOver={ handleFirstVertexMouseOver }
									onMouseOut={ () => handleMouseOut(isAdding) }
									onFocus={ () => {} }
									onBlur={ () => {} }
								/>,
							);
						} else {
							verticesUI.push(
								<Rect
									offsetX={ CONST.DOT_LENGTH / 2 }
									offsetY={ CONST.DOT_LENGTH / 2 }
									x={ x }
									y={ y }
									key={ v.name }
									name={ v.name }
									stroke={ color }
									fill={ color }
									strokeWidth={ 0 }
									width={ CONST.DOT_LENGTH }
									height={ CONST.DOT_LENGTH }
									draggable
									dragOnTop={ false }
									onMouseDown={ onVertexMouseDown }
									onMouseOver={ handleVertexMouseOver }
									onMouseOut={ () => handleMouseOut(isAdding) }
									onDragEnd={ onVertexDragEnd }
									onDragMove={ e => handleVertexDragMove(e, isAdding, entities, i) }
									onFocus={ () => {} }
									onBlur={ () => {} }
								/>,
							);
						}
						linePoints.push(x); linePoints.push(y);
					});
					const lineUI = (
						<Line
							name={ name }
							points={ linePoints }
							closed={ isClosed }
							fill={ focusing === name ? colorWithOpacity : '' }
							stroke={ color }
							strokeWidth={ 1 }
							lineCap='round'
							lineJoin='round'
							onMouseDown={ onLineMouseDown }
							onMouseOver={ () => handleMouseOver(isAdding) }
							onMouseLeave={ () => handleMouseLeave(isAdding) }
							onMouseOut={ () => handleMouseOut(isAdding) }
							onFocus={ () => {} }
							onBlur={ () => {} }
						/>
					);
		
					layerItems.push(		
						<Group
							key={ name }
							id={ id }
							name={ name }
							// draggable={ isManipulatable }
							onMouseDown={ (e) => {
								const group = e.target.findAncestor('Group');
								if (!isManipulatable) return;
								group.moveToTop();
								onGroupMouseDown(e);
							} }
							onDragEnd={ (e) => {
								if (e.target.getClassName() !== 'Group') return;
								onGroupDragEnd(e);
							} }
							onDragMove={ e => handleGroupDragMove(e, canvasWidth, canvasHeight, shapeType) }
							onMouseMove={e => onGroupMove(e)}
						>
							{lineUI}
							{verticesUI}
						</Group>
					);
				}
			}			
		} else if ( shapeType == "chain" ) {
			const { isClosed, incidents } = entities.annotations[annotationId];
			const colorWithOpacity = color.replace(/, [0-9].[0-9][0-9]\)/, ', 1)')
											.replace(/, [0-9][0-9]\)/, ', 1)')
											.replace(/, [0-9]\)/, ', 1)')
											.replace(/, .[0-9]\)/, ', 1)')
											.replace(/, .[0-9][0-9]\)/, ', 1)');		
											const verticesUI = [];
											const linePoints = [];
											const startPoint = {};

			for ( let i = 0; i < incidents.length; i ++ ) {
				let x, y, absMinX = 0, absMinY = 0, absMaxX = 0, absMaxY = 0;
				if (played >= incidents[i].time) {
					if (i !== incidents.length - 1 && played >= incidents[i + 1].time) {
						continue;
					}
					
					if (incidents[i].status !== SHOW) break; // todo					
				
					incidents[i].vertices.forEach((v, vi) => {
						const { name } = v;
						if (i === incidents.length - 1) {
							({
								x,
								y,
							} = v);
						} else {
							const interpoPos = getInterpolatedData({
								startIncident: incidents[i],
								endIncident: incidents[i + 1],
								currentTime: played,
								type: INTERPOLATION_TYPE.POSITION,
								vname: name,
								shapeType
							});
							({
								x, y,
							} = interpoPos);
						}	

						if (vi === 0) {
							startPoint.x = v.x; startPoint.y = v.y;
							absMinX = v.x;
							absMinY = v.y;
							absMaxX = v.x;
							absMaxY = v.y;
						}		
						absMinX = absMinX > v.x ? v.x : absMinX;
						absMinY = absMinY > v.y ? v.y : absMinY;
						absMaxX = absMaxX < v.x ? v.x : absMaxX;
						absMaxY = absMaxY < v.y ? v.y : absMaxY;		

						if (isAdding && focusing === name && vi === 0) {
							verticesUI.push(
								<Circle
									x={ v.x }
									y={ v.y }
									key={ v.name }
									name={ v.name }
									radius={ CONST.DOT_LENGTH * 3 }
									stroke={ color }
									fill={ '' }
									strokeWidth={ 7 }
									draggable
									dragOnTop={ false }
									onMouseDown={ onVertexMouseDown }
									onMouseOver={ handleFirstVertexMouseOver }
									onMouseOut={ () => handleMouseOut(isAdding) }
									onFocus={ () => {} }
									onBlur={ () => {} }
								/>,
							);
						} else {
							verticesUI.push(
								<Circle
									x={ x }
									y={ y }
									key={ v.name }
									name={ v.name }
									radius={ CONST.DOT_LENGTH * 3 }
									stroke={ color }
									fill={ '' }
									strokeWidth={ 7 }
									draggable
									dragOnTop={ false }
									onMouseDown={ onVertexMouseDown }
									onMouseOver={ handleVertexMouseOver }
									onMouseOut={ () => handleMouseOut(isAdding) }
									onDragEnd={ onVertexDragEnd }
									onDragMove={ e => handleVertexDragMove(e, isAdding, entities, i) }
									onFocus={ () => {} }
									onBlur={ () => {} }
								/>
							);
						}
						linePoints.push(x); linePoints.push(y);
					});
					const lineUI = (
						<Line
							name={ name }
							points={ linePoints }
							closed={ false }
							fill={ focusing === name ? colorWithOpacity : '' }
							stroke={ color }
							strokeWidth={ 10 }
							lineCap='round'
							lineJoin='round'
							onMouseDown={ onLineMouseDown }
							onMouseOver={ () => handleMouseOver(isAdding) }
							onMouseLeave={ () => handleMouseLeave(isAdding) }
							onMouseOut={ () => handleMouseOut(isAdding) }
							onFocus={ () => {} }
							onBlur={ () => {} }
						/>
					);	
		
					layerItems.push(
						<Group
							key={ name }
							id={ id }
							name={ name }
							onMouseDown={ (e) => {
								const group = e.target.findAncestor('Group');
								if (!isManipulatable) return;
								group.moveToTop();
								onGroupMouseDown(e);
							} }
							onDragEnd={ (e) => {
								if (e.target.getClassName() !== 'Group') return;
								onGroupDragEnd(e);
							} }
							onDragMove={ e => handleGroupDragMove(e, canvasWidth, canvasHeight, shapeType) }
							onMouseMove={e => onGroupMove(e)}
						>
							{lineUI}
							{verticesUI}
						</Group>
					);
				}
			}			
		} else if( shapeType == "line" ) {
			const { isClosed, incidents, arrowHead, wave, lineMode } = entities.annotations[annotationId];
			const colorWithOpacity = color.replace(/,1\)/, ',.15)');
			const verticesUI = [];
			const linePoints = [];
			const controlPoints = [];
			const shapePoints = [];
			const startPoint = {};
			let lineDash = [0];

			switch(lineMode) {
				case "0": lineDash = [0]; break;
				case "1": lineDash = [10]; break;
				case "2": lineDash = [10, 8, 0.123, 10]; break;
				default: lineDash = [10];
			}

			for (let i = 0; i < incidents.length; i ++) {
				let x, y;
				if (played >= incidents[i].time) {
					if (i !== incidents.length - 1 && played >= incidents[i + 1].time) {
						continue;
					}
					if (incidents[i].status !== SHOW) break; // todo

					incidents[i].vertices.forEach((v, vi) => {						
						const { name } = v;
						if (i === incidents.length - 1) {
							({
								x,
								y,
							} = v);
						} else {
							const interpoPos = getInterpolatedData({
								startIncident: incidents[i],
								endIncident: incidents[i + 1],
								currentTime: played,
								type: INTERPOLATION_TYPE.POSITION,
								vname: name,
								shapeType
							});
							({
								x, y,
							} = interpoPos);
						}	

						linePoints.push(x); linePoints.push(y);
						let theata = 0;
						if (linePoints.length >= 4) {
							// linePoints = []
							
							const leftWavePoints = [], rightWavePoints = [];
							controlPoints.splice(0, 2, 
								linePoints[2],
								linePoints[3]
							);
							leftWavePoints.splice(0, 2, 
								parseFloat(linePoints[0]) + ((parseFloat(controlPoints[0]) - parseFloat(linePoints[0])) / 2),
								controlPoints[1]
							);
							rightWavePoints.splice(0, 2, 
								parseFloat(controlPoints[0]) + ((parseFloat(linePoints[linePoints.length - 2]) - parseFloat(controlPoints[0])) / 2),
								controlPoints[1]
							);
							theata = angle(linePoints[0], linePoints[1], linePoints[linePoints.length - 2], linePoints[linePoints.length - 1]);
							// theata = angle(shapePoints[shapePoints.length - 4], shapePoints[shapePoints.length - 3], shapePoints[shapePoints.length - 2], shapePoints[shapePoints.length - 1]);
							if (wave) {
								shapePoints.splice(0, 2, linePoints[0], linePoints[1]);
								shapePoints.splice(2, 2, leftWavePoints[0], leftWavePoints[1]);
								shapePoints.splice(4, 2, rightWavePoints[0], rightWavePoints[1]);
								shapePoints.splice(6, 2, linePoints[linePoints.length - 2], linePoints[linePoints.length - 1]);
								theata = angle(rightWavePoints[0], rightWavePoints[1], linePoints[linePoints.length - 2], linePoints[linePoints.length - 1]);
							} else {
								shapePoints.splice(0, 2, linePoints[0], linePoints[1]);
								shapePoints.splice(2, 2, linePoints[linePoints.length - 2], linePoints[linePoints.length - 1]);								
							}
						}

						

						let arrowAngle = theata;
						
						if (isAdding && focusing === name && vi === 0) {
							verticesUI.push(
								<Circle
									x={ x }
									y={ y }
									key={ v.name }
									name={ v.name }
									radius={ CONST.DOT_LENGTH * 1.1 }
									stroke={ color }
									fill={ colorWithOpacity }
									strokeWidth={ 1 }
									draggable
									dragOnTop={ false }
									onMouseDown={ onVertexMouseDown }
									onMouseOver={ handleFirstVertexMouseOver }
									onMouseOut={ () => handleMouseOut(isAdding) }
									onFocus={ () => {} }
									onBlur={ () => {} }
								/>,
							);
						} else if (arrowHead && vi === 2) {
							verticesUI.push(
								<Arrow
									offsetX={ CONST.DOT_LENGTH * -2.3 }
									x={ x }
									y={ y }
									key={ v.name }
									name={ v.name }
									stroke={ color }
									fill={ color }
									strokeWidth={ 0 }
									tension={1}
									rotation={arrowAngle}
									width={ CONST.DOT_LENGTH * 2 }
									height={ CONST.DOT_LENGTH * 2 }
									draggable
									dragOnTop={ false }
									onMouseDown={ onVertexMouseDown }
									onMouseOver={ handleVertexMouseOver }
									onMouseOut={ () => handleMouseOut(isAdding) }
									onDragEnd={ onVertexDragEnd }
									onDragMove={ e => handleVertexDragMove(e, isAdding, entities, i) }
									onFocus={ () => {} }
									onBlur={ () => {} }
								/>,
							);
						} else if (isCurrent)  {							
							if (wave && vi === 1) {
								verticesUI.push(
									<Circle
										x={ x }
										y={ y }
										key={ v.name }
										name={ v.name }
										stroke={ color }
										fill={ color }
										strokeWidth={ 0 }
										width={ CONST.DOT_LENGTH * 4 }
										height={ CONST.DOT_LENGTH * 4 }
										draggable
										dragOnTop={ false }
										onMouseDown={ onVertexMouseDown }
										onMouseOver={ handleVertexMouseOver }
										onMouseOut={ () => handleMouseOut(isAdding) }
										onDragEnd={ onVertexDragEnd }
										// onDragMove={ e => handleVertexDragMove(e, isAdding, entities, i) }
										onFocus={ () => {} }
										onBlur={ () => {} }
									/>,
								);
							} else if (vi != 1) {
								verticesUI.push(
									<Rect
										offsetX={ CONST.DOT_LENGTH / 1 }
										offsetY={ CONST.DOT_LENGTH / 1 }
										x={ x }
										y={ y }
										key={ v.name }
										name={ v.name }
										stroke={ color }
										fill={ color }
										strokeWidth={ 0 }
										width={ CONST.DOT_LENGTH * 2 }
										height={ CONST.DOT_LENGTH * 2 }
										draggable
										dragOnTop={ false }
										onMouseDown={ onVertexMouseDown }
										onMouseOver={ handleVertexMouseOver }
										onMouseOut={ () => handleMouseOut(isAdding) }
										onDragEnd={ onVertexDragEnd }
										onDragMove={ e => handleVertexDragMove(e, isAdding, entities, i) }
										onFocus={ () => {} }
										onBlur={ () => {} }
									/>,
								);
							}
						}						
					});

					const lineUI = (
						<Line
							name={ name }
							points={shapePoints}
							closed={ false }
							fill={ focusing === name ? colorWithOpacity : '' }
							stroke={ color }
							strokeWidth={ 4 }
							lineCap='round'
							lineJoin='round'
							dash={lineDash}
							bezier={wave}
							onMouseDown={ onLineMouseDown }
							onMouseOver={ () => handleMouseOver(isAdding) }
							onMouseLeave={ () => handleMouseLeave(isAdding) }
							onMouseOut={ () => handleMouseOut(isAdding) }
							onFocus={ () => {} }
							onBlur={ () => {} }
						/>
					);
	
					layerItems.push(		
						<Group
							key={ name }
							id={ id }
							name={ name }
							// draggable={ isManipulatable }
							onMouseDown={ (e) => {
								const group = e.target.findAncestor('Group');
								if (!isManipulatable) return;
								group.moveToTop();
								onGroupMouseDown(e);
							} }
							onDragEnd={ (e) => {
								if (e.target.getClassName() !== 'Group') return;
								onGroupDragEnd(e);
							} }
							onDragMove={ e => handleGroupDragMove(e, canvasWidth, canvasHeight, shapeType) }
							onMouseMove={e => onGroupMove(e)}
						>
							{lineUI}
							{verticesUI}
						</Group>
					);
				}
			}			
		} else {
			const { incidents, labelText } = entities.annotations[annotationId];
			for (let i = 0; i < incidents.length; i++) {
				let x;
				let y;
				let width;
				let height;
	
				if (played >= incidents[i].time) {
					if (i !== incidents.length - 1 && played >= incidents[i + 1].time) {
						continue;
					}
					if (incidents[i].status !== SHOW) break; // todo
	
					if (i === incidents.length - 1) {
						({
							x,
							y,
							width,
							height,
						} = incidents[i]);
					} else {
						const interpoArea = getInterpolatedData({
							startIncident: incidents[i],
							endIncident: incidents[i + 1],
							currentTime: played,
							type: INTERPOLATION_TYPE.LENGTH,
						});
						const interpoPos = getInterpolatedData({
							startIncident: incidents[i],
							endIncident: incidents[i + 1],
							currentTime: played,
							type: INTERPOLATION_TYPE.POSITION,
						});
						({
							x, y,
						} = interpoPos);
						({
							width, height,
						} = interpoArea);
					}		
					const fill = color.replace(/, [0-9].[0-9][0-9]\)/, ', 1)')
										.replace(/, [0-9][0-9]\)/, ', 1)')
										.replace(/, [0-9]\)/, ', 1)');
	
					let shape = '';
					let shapeProps = {
						fill: color,
						stroke: fill,
						width,
						height,
						strokeWidth: 1,
						x: 0,
						y: 0,	
						onMouseOver: () => {
							if (!isManipulatable || isAdding) return;
							document.body.style.cursor = 'pointer';
						},
						onFocus: (ev) => {
						}
					}
					switch (shapeType) {
						case "circle" :  
							shapeProps.x = width / 2;
							shapeProps.y = height / 2;
							shape = (
							<Circle 
								{...shapeProps}
							/>
						); break;
						// case "line" : shape = (
						// 	<Line
						// 		{...shapeProps}				
						// 		points={[0, height / 2, width, height / 2]}
						// 		strokeWidth={5}
						// 	/>
						// ); break;
						case "rect" : shape = (
							<Rect
								{...shapeProps}																			
							/>
						); break;
						case "text" : shape = (
							<Text
								{...shapeProps}
								fontFamily='Arial'
								text={ labelText }
								fontSize={ 16 }
								lineHeight={ 1.2 }
							/>
						); break;
					}
	
					let resizingAnchorsUI = null;
					const resizingAnchorsData = [
						{ x: 0, y: 0, key: 'topLeft', name: 'topLeft' },
						{ x: width, y: 0, key: 'topRight', name: 'topRight' },
						{ x: width, y: height, key: 'bottomRight', name: 'bottomRight' },
						{ x: 0, y: height, key: 'bottomLeft', name: 'bottomLeft' },
						{ x: width / 2, y: 0, key: 'top', name: 'top' },
						{ x: 0, y: height / 2, key: 'left', name: 'left' },
						{ x: width, y: height / 2, key: 'right', name: 'right' },
						{ x: width / 2, y: height, key: 'bottom', name: 'bottom' },
					];
					if (isManipulatable && isCurrent ) {
						resizingAnchorsUI = resizingAnchorsData.map(data => (
							<ResizingAnchor
								dotLength={ dotLength }
								color={ fill }
								isManipulatable={ isManipulatable }
								x={ data.x }
								y={ data.y }
								key={ data.key }
								name={ data.name }
								canvasWidth={ canvasWidth }
								canvasHeight={ canvasHeight }
								onDragEnd={ onDotDragEnd }
								onMouseDown={ onDotMouseDown }
								shape={{
									type: shapeType
								}}
							/>
						));
					}
					layerItems.push(
						<Group
							x={ x }
							y={ y }
							key={ name }
							id={ id }
							name={ name }
							draggable={ isManipulatable }
							onMouseDown={ (e) => {
								const group = e.target.findAncestor('Group');
								if (!isManipulatable) return;
								group.moveToTop();
								onGroupMouseDown(e);
							} }
							onDragEnd={ (e) => {
								if (e.target.getClassName() !== 'Group') return;
								onGroupDragEnd(e);
							} }
							onDragMove={ e => handleGroupDragMove(e, canvasWidth, canvasHeight, shapeType) }
						>
							{shape}
							{resizingAnchorsUI}
						</Group>
					);
					break;
				}
			}
		}
	});
	return (
		<Stage
			width={ canvasWidth }
			height={ canvasHeight }
			className='konva-wrapper'
			onMouseDown={ e => onStageMouseDown(e) }
			onMouseOver={ () => { if (isAdding) { document.body.style.cursor = 'crosshair'; } } }
			onMouseLeave={ () => { document.body.style.cursor = 'default'; } }
			onMouseOut={ () => { document.body.style.cursor = 'default'; } }
			onBlur={ () => {} }
			onFocus={ () => {} }
		>
			{ isAdding && (
				<Layer>
					<Rect fill='#fff' width={ canvasWidth } height={ canvasHeight } opacity={ 0.2 } />
					<Text y={ canvasHeight / 2 } width={ canvasWidth } text={ t('canvasAddingHint') } align='center' fontSize={ 16 } fill='#fff' />
				</Layer>
			)}
			<Layer>{layerItems}</Layer>
		</Stage>
	);
};

Canvas.propTypes = {
	className: PropTypes.string,
	dotLength: PropTypes.number,
};
Canvas.defaultProps = {
	className: '',
	dotLength: 6,
};
export default Canvas;

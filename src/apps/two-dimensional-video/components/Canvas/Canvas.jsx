import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import {
	Stage, Layer, Rect, Group, Text, Circle, Arrow, Line
} from 'react-konva';
import { useTranslation } from 'react-i18next';
import { SHOW } from '../../models/incident';
import ResizingAnchor from './ResizingAnchor/ResizingAnchor.jsx';
import { getInterpolatedData, INTERPOLATION_TYPE } from '../../utils/interpolationUtils';
import './canvas.scss';
import { getShapeTypeKey } from "../../models/shape";

const handleGroupDragMove = (e, canvasWidth, canvasHeight, shapeType) => {
	// console.log("dragging");
	if (e.target.getClassName() !== 'Group') return;
	const group = e.target;
	const topLeft = group.get('.topLeft')[0];
	// console.log("moving mouse", group)
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
	const linePoints = [];
	entities.annotations[group.name()].incidents[i].vertices.forEach((v) => {
		if (v.name !== activeVertex.name()) {
			linePoints.push(v.x); linePoints.push(v.y);
			return;
		}
		linePoints.push(activeVertex.x()); linePoints.push(activeVertex.y());
	});
	line.points(linePoints);
};

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
					
					console.log("time =>", played);
					console.log("chain inci =>", incidents[i]);					
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
					
					// const fill = color.replace(/, [0-9].[0-9][0-9]\)/, ', 1)')
					// 					.replace(/, [0-9][0-9]\)/, ', 1)')
					// 					.replace(/, [0-9]\)/, ', 1)');
					// let resizingAnchorsUI = null;
					// const resizingAnchorsData = [
					// 	{ x: absMinX, y: absMinY, key: 'topLeft', name: 'topLeft' },
					// 	{ x: absMaxX, y: absMinY, key: 'topRight', name: 'topRight' },
					// 	{ x: absMaxX, y: absMaxY, key: 'bottomRight', name: 'bottomRight' },
					// 	{ x: absMinX, y: absMaxY, key: 'bottomLeft', name: 'bottomLeft' },
					// 	{ x: (absMaxX - absMinX) / 2, y: absMinY, key: 'top', name: 'top' },
					// 	{ x: absMinX, y: (absMaxY - absMinY) / 2, key: 'left', name: 'left' },
					// 	{ x: absMaxX, y: (absMaxY - absMinY) / 2, key: 'right', name: 'right' },
					// 	{ x: (absMaxX - absMinX) / 2, y: absMaxY, key: 'bottom', name: 'bottom' },
					// ];
					// if (isManipulatable && isCurrent ) {
					// 	resizingAnchorsUI = resizingAnchorsData.map(data => (
					// 		<ResizingAnchor
					// 			dotLength={ dotLength }
					// 			color={ fill }
					// 			isManipulatable={ isManipulatable }
					// 			x={ data.x }
					// 			y={ data.y }
					// 			key={ data.key }
					// 			name={ data.name }
					// 			canvasWidth={ canvasWidth }
					// 			canvasHeight={ canvasHeight }
					// 			onDragEnd={ onDotDragEnd }
					// 			onMouseDown={ onDotMouseDown }
					// 			shape={{
					// 				type: shapeType
					// 			}}
					// 		/>
					// 	));
					// }
		
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
							{/* {resizingAnchorsUI} */}
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
							console.log("clicked")
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
						case "line" : shape = (
							<Line
								{...shapeProps}				
								points={[0, height / 2, width, height / 2]}
								strokeWidth={5}
							/>
						); break;
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
					<Rect fill='#fff' width={ canvasWidth } height={ canvasHeight } opacity={ 0.9 } />
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

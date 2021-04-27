import React, { Component, useEffect } from 'react';
import PropTypes, { shape } from 'prop-types';
import { I18nextProvider, Translation } from 'react-i18next';
import { normalize, denormalize, schema } from 'normalizr';
import { Button, ButtonGroup, FormGroup, Input, Label } from 'reactstrap';
import { MdRedo, MdUndo, MdAdd } from 'react-icons/md';
import 'bootstrap/dist/css/bootstrap.css';
import PopupDialog from '../../../../shared/components/PopupDialog/PopupDialog.jsx';
import { highContrastingColors as colors } from '../../../../shared/utils/colorUtils';
import { getRandomInt, getFixedNumber } from '../../../../shared/utils/mathUtils';
import { UndoRedo } from '../../../../models/UndoRedo';
import i18nextInstance from './i18n';
import { Rectangle } from '../../models/rectangle';
import { Incident, SPLIT, HIDE, SHOW } from '../../models/incident';
import TwoDimensionalVideoContext from './twoDimensionalVideoContext';
import { getInterpolatedData, INTERPOLATION_TYPE } from '../../utils/interpolationUtils';
import AnnotationList from '../AnnotationList/AnnotationList.jsx';
import DrawableVideoPlayer from '../DrawableVideoPlayer/DrawableVideoPlayer.jsx';
import { getLastAnnotationLabel, getUniqueKey } from '../../utils/utils';
import './twoDimensionalVideo.scss';
import ColorPicker, { getRgbColor } from "../../../../shared/components/ColorPicker/ColorPicker";
import { SyncLoader as Loader } from "react-spinners";
import { shapeTypeList as shapeList, getShapeTypeKey } from "../../models/shape";
import { Polygon } from '../../models/polygon';
import { Vertex } from '../../models/vertex';



const getAnnotationData = async (API) => {
	const fetchHeaders = {
		method: "GET",
		headers: {
			"Accept": "application/json"
		},
	}
	try {
		const data = await fetch(API, fetchHeaders)
		return data.json();
	} catch (error) {
		
	}
}

const updateAnnotationData = async (API, data) => {
	const fetchHeaders = {
		method: "POST",
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			'X-Requested-With': 'XMLHttpRequest',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': '*'
		},
		// mode: 'no-cors',
		body: JSON.stringify(data)
	}

	try {
		const data = await fetch(API, fetchHeaders)
		return true;
	} catch (error) {
		return false;
	}
}

const Alert = (props) => {
	return (
		props.open && <div className={`alert alert-${props.type}`} role="alert">
			<strong>{props.title}</strong> {props.message}
		</div>
	)
}

const SelectShape = (props) => {	
	return (
		<div className={props.className}>
			{ props.options.map(shape => 
				<Button 
					className={`mr-1`} 
					outline={props.value != shape.value}
					color="dark"
					onClick={() => {props.onClick(shape.value)}}
					key={shape.value}
				>
					{shape.label}
				</Button>)
			}
		</div>
	)
}

class TwoDimensionalVideo extends Component {
	constructor(props) {
		super(props);
		const {
			defaultAnnotations,
			videoWidth,
			previewNoticeList,
		} = props;
		/* ===  normalize annotation props === */
		const entities = { annotations: {} };
		let annotations = [];
		if (defaultAnnotations && defaultAnnotations.length !== 0) {
			const annotation = new schema.Entity('annotations');
			const normalizedAnn = normalize(defaultAnnotations, [annotation]);
			entities.annotations = normalizedAnn.entities.annotations;
			annotations = normalizedAnn.result;
			annotations.forEach((id) => {
				entities.annotations[id].isManipulatable = props.isDefaultAnnotationsManipulatable;
			});
		}
		this.state = {
			isSubmitted: false,
			videoWidth,
			annotationHeight: 200,
			entities,
			annotations,
			played: 0,
			isPlaying: false,
			playbackRate: 1,
			duration: 0,
			isLoop: false,
			isSeeking: false,
			isAdding: false,
			focusing: '',
			isDialogOpen: false,
			dialogTitle: '',
			dialogMessage: '',
			defaultNumAnnotations: annotations.length,
			defaultNumRootAnnotations: getLastAnnotationLabel(annotations, entities),
			initialAnnotations: null,
			notification: {
				type: null,
				message: null,
				title: null,
				open: false,
			},
			apicallStatus: "saved",
			shape: 'circle'
		};
		this.UndoRedoState = new UndoRedo();
		this.change = this.change.bind(this.state);
	}
	
	
	change(ev) {
		console.log(this.state);
	}
	
	componentDidMount() {
		this.initialState();
	}

	initialState = async () => {
		this.setState(prevState => {
			return {
				apicallStatus: "calling"
			}
		});
		try {
			const res = await getAnnotationData(this.props.serverURL);
			const data = JSON.parse(res.data);	
			if(data) {
				this.setState((prevState) => {		
					for (let i = 0; i < data.annotations.length; i++) {
						let name = data.annotations[i];		
						const { shapeType } = data.entities.annotations[name];
						if (shapeType === "polygon" || shapeType === "chain" || shapeType === "line") {
							data.entities.annotations[name] = Polygon({
								...data.entities.annotations[name]
							})
						} else {
							data.entities.annotations[name] = Rectangle({
								...data.entities.annotations[name]
							})
						}
						
					}
					return {
						initialAnnotations: data.annotations,
						apicallStatus: "called",
						annotations: data.annotations,
						entities: {
							annotations: data.entities.annotations
						}					
					}
				});
			}
		} catch (error) {
			this.setState((prevState) => {
				return {
					apicallStatus: "called"
				}
			})
		}
	}

	/* ==================== video player ==================== */
	handlePlayerRef = (player) => {
		this.player = player;
	}

	handleVideoReady = () => {
		this.setState({ annotationHeight: document.getElementById('react-player').children[0].clientHeight });
	}

	handleVideoProgress = (state) => {
		console.log("playing video");
		const { played } = state;
		this.setState((prevState) => {
			if (prevState.isSeeking) return null;
			return { played: getFixedNumber(played, 5) };
		});
	}

	handleVideoDuration = (duration) => {
		this.setState({ duration });
	}

	handleVideoEnded = () => {
		this.setState(prevState => ({ isPlaying: prevState.isLoop }));
	}

	handleVideoRewind = () => {
		this.setState({ isPlaying: false, played: 0 });
		this.player.seekTo(0);
	}

	handleVideoPlayPause = () => {
		this.setState(prevState => ({ isPlaying: !prevState.isPlaying }));
	}

	handleVideoSpeedChange = (s) => {
		this.setState({ playbackRate: s });
	}

	handleVideoSliderMouseUp = () => {
		this.setState({ isSeeking: false });
	}

	handleVideoSliderMouseDown = () => {
		this.setState({ isPlaying: false, isSeeking: true });
	}

	handleVideoSliderChange = (e) => {
		const played = getFixedNumber(e.target.value, 5);
		this.setState((prevState) => {
			const { entities } = prevState;
			let { focusing } = prevState;
			if (focusing) {
				const { shapeType } = entities.annotations[focusing];
				if(shapeType === "polygon" || shapeType === "chain" || shapeType === "line") {
					const { incidents } = entities.annotations[focusing];
					for (let i = 0; i < incidents.length; i += 1) {
						if (played >= incidents[i].time) {
							if (i !== incidents.length - 1 && played >= incidents[i + 1].time) continue;
							if (incidents[i].status !== SHOW) focusing = '';
							break;
						} else if (i === incidents.length - 1) focusing = '';
					}
				} else {
					const { incidents } = entities.annotations[focusing];
					for (let i = 0; i < incidents.length; i += 1) {
						if (played >= incidents[i].time) {
							if (i !== incidents.length - 1 && played >= incidents[i + 1].time) continue;
							if (incidents[i].status !== SHOW) focusing = '';
							break;
						} else if (i === incidents.length - 1) focusing = '';
					}
				}
				
			}
			return { played, focusing };
		}, () => { this.player.seekTo(played); });
	}

	handleVideoNextSecFrame = () => {	
		const played = (this.state.played * this.state.duration + this.state.playbackRate) / this.state.duration;
		this.setState((prevState) => {
			const { entities } = prevState;
			let { focusing } = prevState;
			if (focusing) {
				const { incidents } = entities.annotations[focusing];
				for (let i = 0; i < incidents.length; i += 1) {
					if (played >= incidents[i].time) {
						if (i !== incidents.length - 1 && played >= incidents[i + 1].time) continue;
						if (incidents[i].status !== SHOW) focusing = '';
						break;
					} else if (i === incidents.length - 1) focusing = '';
				}
			}
			return { played, focusing };
		}, () => { this.player.seekTo(played); });
	}

	handleVideoPrevSecFrame = () => {		
		const played = (this.state.played * this.state.duration - this.state.playbackRate) / this.state.duration;
		if(played > 0) {
			this.setState((prevState) => {
				const { entities } = prevState;
				let { focusing } = prevState;
				if (focusing) {
					const { incidents } = entities.annotations[focusing];
					for (let i = 0; i < incidents.length; i += 1) {
						if (played >= incidents[i].time) {
							if (i !== incidents.length - 1 && played >= incidents[i + 1].time) continue;
							if (incidents[i].status !== SHOW) focusing = '';
							break;
						} else if (i === incidents.length - 1) focusing = '';
					}
				}
				return { played, focusing };
			}, () => { this.player.seekTo(played); });
		}
	}

	/* ==================== canvas ==================== */

	handleCanvasStageMouseDown = (e) => {
		const { isAdding, shape } = this.state;
		const stage = e.target.getStage();
		const position = stage.getPointerPosition();
		const uniqueKey = getUniqueKey();
		const color = "rgba(250, 8, 12, .37)"

		if( shape === "polygon" || shape === "chain" || shape === "line" ) {
			let { x, y } = stage.getPointerPosition();
			let incidents;
			this.setState((prevState) => {
				const {
					isAdding, focusing, annotations, entities, played
				} = prevState;
				if (!isAdding) return {};
				// prevent x, y exceeding boundary
				x = x < 0 ? 0 : x; x = x > stage.width() ? stage.width() : x;
				y = y < 0 ? 0 : y; y = y > stage.height() ? stage.height() : y;
				this.UndoRedoState.save(prevState);
				// first time adding
				if (!focusing || !entities.annotations[focusing].incidents || entities.annotations[focusing].isClosed || ( entities.annotations[focusing].shapeType != "polygon" && entities.annotations[focusing].shapeType != "chain" && entities.annotations[focusing].shapeType != "line" ) ) {
					incidents = [];
					incidents.push(Incident({
						time: prevState.played, vertices: [], x: position.x, y: position.y,
					}));
					incidents[0].vertices.push(Vertex({
						id: `${uniqueKey}`, name: `${uniqueKey}`, x, y
					}))
					entities.annotations[`${uniqueKey}`] = Polygon({
						id: `${uniqueKey}`, name: `${uniqueKey}`, label: `${getLastAnnotationLabel(annotations, entities) + 1}`, color, incidents, shapeType: shape, labelText: `${getLastAnnotationLabel(annotations, entities) + 1} Layout`
					});
					return {
						focusing: `${uniqueKey}`,
						annotations: [...annotations, `${uniqueKey}`],
						entities: { ...entities, annotations: entities.annotations },
					};
				}
				// entities.annotations[focusing] = true;
				prevState.isAdding = false;
				// continuing adding
				if (shape === "line") {
					const startPoints = entities.annotations[focusing].incidents[0].vertices[0];
					const controlPoints = [];
					controlPoints.push( parseFloat(startPoints.x) + ((parseFloat(x) - parseFloat(startPoints.x)) / 2) );
					controlPoints.push( parseFloat(startPoints.y) + ((parseFloat(y) - parseFloat(startPoints.y)) / 2) );

					entities.annotations[focusing].incidents[0].vertices.push(Vertex({
						id: `${uniqueKey}-control`, name: `${uniqueKey}-control`, x: controlPoints[0], y: controlPoints[1]
					}));
				}
				entities.annotations[focusing].incidents[0].vertices.push(Vertex({
					id: `${uniqueKey}`, name: `${uniqueKey}`, x, y
				}));
				return { entities: { ...entities, annotations: entities.annotations } };
			});
		} else {
			if (!isAdding) return;
			
			// const color = colors[getRandomInt(colors.length)];			
			this.setState((prevState) => {
				this.UndoRedoState.save({ ...prevState, isAdding: false }); // Undo/Redo
				const {
					annotations, entities,
				} = prevState;
				const incidents = [];
				incidents.push(Incident({
					id: `${uniqueKey}`, name: `${uniqueKey}`, x: position.x, y: position.y, height: 1, width: 1, time: prevState.played,
				}));
				entities.annotations[`${uniqueKey}`] = Rectangle({
					id: `${uniqueKey}`, name: `${uniqueKey}`, label: `${getLastAnnotationLabel(annotations, entities) + 1}`, color, incidents, shapeType: shape, labelText: `${getLastAnnotationLabel(annotations, entities) + 1} Layout`
				});
				return {
					isAdding: false,
					focusing: `${uniqueKey}`,
					annotations: [...annotations, `${uniqueKey}`],
					entities: { ...entities, annotations: entities.annotations },
				};
			}, () => {
				const group = stage.find(`.${uniqueKey}`)[0];
				const bottomRight = group.get('.bottomRight')[0];
				group.moveToTop();
				bottomRight.moveToTop();
				bottomRight.startDrag();
			});		
		}
	}

	handleCanvasGroupMouseDown = (e) => {
		const group = e.target.findAncestor('Group');
		const { entities } = this.state;
		const { shapeType } = entities.annotations[group.name()];
		this.setState({ isPlaying: false, focusing: group.name(), shape: shapeType });
	}

	handleCanvasGroupDragEnd = (e) => {
		if (e.target.getClassName() !== 'Group') return;
		const group = e.target;
		const { entities, focusing } = this.state;
		if (focusing) {
			const { shapeType } = entities.annotations[focusing];
			const shapeKey = getShapeTypeKey(shapeType);
			let obj = group.get(shapeKey)[0];
			const position = group.position();
			const uniqueKey = getUniqueKey();
			this.setState((prevState) => {
				this.UndoRedoState.save(prevState);
				const { entities, played } = prevState;
				const { incidents, shapeType } = entities.annotations[group.name()];
				if ( shapeType === "chain" || shapeType === "polygon" || shapeType === "line" ) {
					for (let i = 0; i < incidents.length; i += 1) {
						if (played >= incidents[i].time) {
							// skip elapsed incidents
							if (i !== incidents.length - 1 && played >= incidents[i + 1].time) continue;
							if (played === incidents[i].time) {
								// console.log("232323", diffX, position.x, incidents[0].x)
								var diffX = parseFloat(position.x) - parseFloat(incidents[i].x),
								diffY = parseFloat(position.y) - parseFloat(incidents[i].y);

								console.log("i =>", i);
								console.log("moved x =>", diffX);
								console.log("moved Y", diffY)
								incidents[i].x = position.x;
								incidents[i].y = position.y;
								incidents[i].vertices = incidents[i].vertices.map(vt => {
									console.log("vt =>", parseFloat(diffX));
									return {
										...vt,
										// x: parseFloat(vt.x) + parseFloat(diffX),
										// y: parseFloat(vt.y) + position.y
									};
								})
								break;
							}
							if (i === incidents.length - 1) {
								console.log("333", parseFloat(position.x) - parseFloat(incidents[0].x));
								var diffX = parseFloat(position.x) - parseFloat(incidents[0].x),
									diffY = parseFloat(position.y) - parseFloat(incidents[0].y);
								console.log("444", diffX);
								incidents.push(Incident({
									x: position.x, y: position.y, time: played, vertices: incidents[0].vertices.map(vt => {
										return {
											...vt,
											x: parseFloat(vt.x) + diffX,
											y: parseFloat(vt.y) + diffY
										}
									})
								}));
								break;
							}
							incidents.splice(i + 1, 0, Incident({
								id: `${uniqueKey}`, name: `${uniqueKey}`, x: position.x, y: position.y, time: played,
							}));
							break;
						}
					}
				} else {
					for (let i = 0; i < incidents.length; i += 1) {
						if (played >= incidents[i].time) {
							// skip elapsed incidents
							if (i !== incidents.length - 1 && played >= incidents[i + 1].time) continue;
							if (played === incidents[i].time) {
								incidents[i].x = position.x; incidents[i].y = position.y; incidents[i].width = obj.width(); incidents[i].height = obj.height();
								break;
							}
							if (i === incidents.length - 1) {
								incidents.push(Incident({
									id: `${uniqueKey}`, name: `${uniqueKey}`, x: position.x, y: position.y, width: obj.width(), height: obj.height(), time: played,
								}));
								break;
							}
							incidents.splice(i + 1, 0, Incident({
								id: `${uniqueKey}`, name: `${uniqueKey}`, x: position.x, y: position.y, height: obj.height(), width: obj.width(), time: played,
							}));
							break;
						}
					}
				}
				return {};
			});
		}
	}

	handleCanvasDotMouseDown = (e) => {
		console.log("handleCanvasDotMouseDown")
		const group = e.target.findAncestor('Group');
		const { entities } = this.state;
		const { shape } = entities.annotations[group.name()];
		this.setState({ focusing: group.name(), shape });
	}

	handleCanvasDotDragEnd = (e) => {
		console.log("handleCanvasDotDragEnd")
		const activeAnchor = e.target;
		const group = activeAnchor.getParent();
		const uniqueKey = getUniqueKey();
		group.draggable(true);
		const topLeft = group.get('.topLeft')[0]; const topRight = group.get('.topRight')[0]; const bottomRight = group.get('.bottomRight')[0]; const
			bottomLeft = group.get('.bottomLeft')[0];
		const maxX = Math.max(topLeft.getAbsolutePosition().x, topRight.getAbsolutePosition().x, bottomRight.getAbsolutePosition().x, bottomLeft.getAbsolutePosition().x);
		const minX = Math.min(topLeft.getAbsolutePosition().x, topRight.getAbsolutePosition().x, bottomRight.getAbsolutePosition().x, bottomLeft.getAbsolutePosition().x);
		const maxY = Math.max(topLeft.getAbsolutePosition().y, topRight.getAbsolutePosition().y, bottomRight.getAbsolutePosition().y, bottomLeft.getAbsolutePosition().y);
		const minY = Math.min(topLeft.getAbsolutePosition().y, topRight.getAbsolutePosition().y, bottomRight.getAbsolutePosition().y, bottomLeft.getAbsolutePosition().y);
		this.setState((prevState, props) => {
			this.UndoRedoState.save(prevState);
			const { entities, played } = prevState;
			const { annotations } = entities;
			const { incidents } = entities.annotations[group.name()];
			for (let i = 0; i < incidents.length; i += 1) {
				if (played >= incidents[i].time) {
					// skip elapsed incidents
					if (i !== incidents.length - 1 && played >= incidents[i + 1].time) continue;
					if (played === incidents[i].time) {
						incidents[i].x = minX; incidents[i].y = minY; incidents[i].height = maxY - minY; incidents[i].width = maxX - minX;
						break;
					}
					incidents.splice(i + 1, 0, Incident({
						id: `${uniqueKey}`, name: `${uniqueKey}`, x: minX, y: minY, height: maxY - minY, width: maxX - minX, time: played,
					}));
					break;
				}
			}
			annotations[group.name()].incidents = incidents;
			return { entities: { ...entities, annotations } };
		});
	}

	handleAnnotationItemClick = name => {
		const { entities } = this.state;
		const { shapeType } = entities.annotations[name];
		this.setState({ focusing: name, shape: shapeType });
	};

	handleIncidentItemClick = (incident) => {
		const { annotationName, time } = incident;
		this.setState({ isPlaying: false, focusing: annotationName },
			() => { this.player.seekTo(parseFloat(time)); });
	}

	handleIncidentItemDelete = (e) => {
		const { annotationName, incidentName } = e;
		this.setState((prevState) => {
			this.UndoRedoState.save(prevState);
			const { entities } = prevState;
			const { annotations } = entities;
			const incidents = entities.annotations[annotationName].incidents.filter((t) => {
				if (t.name !== incidentName) return true;
				return false;
			});
			annotations[annotationName].incidents = incidents;
			return { entities: { ...entities, annotations } };
		});
	}


	handleListAnnotationDelete = (name) => {
		this.setState((prevState) => {
			this.UndoRedoState.save(prevState);
			const { entities, annotations } = prevState;
			const entitiesAnnotations = entities.annotations;
			const { label } = entitiesAnnotations[name];
			// reorder the list
			if (!isNaN(label)) {
				const lastLabel = getLastAnnotationLabel(annotations, entities);
				if (`${lastLabel}` !== '1' && `${lastLabel}` !== label) {
					const lastName = annotations.find(a => entitiesAnnotations[a].label === `${lastLabel}`);
					this.renameLabel(annotations, entitiesAnnotations, lastName, label);
				}
			}
			// remove name from the parent's childrenNames
			if (entitiesAnnotations[name].parentName) {
				const parent = entitiesAnnotations[entitiesAnnotations[name].parentName];
				const i = parent.childrenNames.indexOf(name);
				if (i !== -1) {
					parent.childrenNames.splice(i, 1);
					if (parent.childrenNames.length == 0 && parent.incidents[parent.incidents.length - 1].status === SPLIT) parent.incidents[parent.incidents.length - 1].status = SHOW;
				}
			}
			// remove all its children and itself recusively
			this.removeAnnotation(annotations, entitiesAnnotations, name);
			return { annotations, entities: { ...entities, annotations: entitiesAnnotations }, focusing: '' };
		});
	}

	removeAnnotation = (annotations, entitiesAnnotations, name) => {
		if (entitiesAnnotations[name].childrenNames.length !== 0) {
			entitiesAnnotations[name].childrenNames.forEach((c) => {
				this.removeAnnotation(annotations, entitiesAnnotations, c);
			});
		}
		delete entitiesAnnotations.name;
		const i = annotations.indexOf(name);
		annotations.splice(i, 1);
	}

	renameLabel = (annotations, entitiesAnnotations, name, label) => {
		if (entitiesAnnotations[name].childrenNames.length !== 0) {
			entitiesAnnotations[name].childrenNames.forEach((c, index) => {
				this.renameLabel(annotations, entitiesAnnotations, c, `${label}-${index + 1}`);
			});
		}
		entitiesAnnotations[name].label = label;
	}

	handleListAnnotationShowHide = (e) => {
		const { name } = e;
		const { status } = e;
		const uniqueKey = new Date().getTime().toString(36);
		this.setState((prevState) => {
			this.UndoRedoState.save(prevState);
			const { played, entities } = prevState;
			const { incidents, shapeType } = entities.annotations[name];
			if (shapeType === "chain" || shapeType === "polygon" || shapeType === "line") {
				for (let i = 0; i < incidents.length; i += 1) {
					const { vertices } = incidents[i];
					if (i === 0 && played < incidents[i].time) {
						incidents.splice(0, 0, Incident({
							x: incidents[i].x, y: incidents[i].y, time: played, status, vertices: incidents[i].vertices
						}));
						break;
					}
					if (played >= incidents[i].time) {
						// skip elapsed incidents
						if (i !== incidents.length - 1 && played >= incidents[i + 1].time) continue;
						if (played === incidents[i].time) {
							incidents.splice(i, 1, Incident({
								...incidents[i], status,
							}));
							break;
						}
						if (i === incidents.length - 1) {
							incidents.push(Incident({
								x: incidents[i].x, y: incidents[i].y, time: played, status, vertices: incidents[i].vertices
							}));
							break;
						}
						for (let vi = 0; vi < vertices.length; vi++) {
							const { name } = vertices[vi];
							const interpoPos = getInterpolatedData({
								startIncident: incidents[i],
								endIncident: incidents[i + 1],
								currentTime: played,
								type: INTERPOLATION_TYPE.POSITION,
								shapeType,
								vname: name
							});
							vertices[vi].x = interpoPos.x;
							vertices[vi].y = interpoPos.y;
						}
						incidents.splice(i + 1, 0, Incident({
							id: `${uniqueKey}`, name: `${uniqueKey}`,time: played, status, vertices: [
								...vertices
							]
						}));
						break;
					}
				}
			} else {
				for (let i = 0; i < incidents.length; i += 1) {
					if (i === 0 && played < incidents[i].time) {
						incidents.splice(0, 0, Incident({
							id: `${uniqueKey}`, name: `${uniqueKey}`, x: incidents[i].x, y: incidents[i].y, height: incidents[i].height, width: incidents[i].width, time: played, status,
						}));
						break;
					}
					if (played >= incidents[i].time) {
						// skip elapsed incidents
						if (i !== incidents.length - 1 && played >= incidents[i + 1].time) continue;
						if (played === incidents[i].time) {
							incidents.splice(i, 1, Incident({
								...incidents[i], id: `${uniqueKey}`, name: `${uniqueKey}`, status,
							}));
							break;
						}
						if (i === incidents.length - 1) {
							incidents.push(Incident({
								id: `${uniqueKey}`, name: `${uniqueKey}`, x: incidents[i].x, y: incidents[i].y, height: incidents[i].height, width: incidents[i].width, time: played, status,
							}));
							break;
						}
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
						incidents.splice(i + 1, 0, Incident({
							id: `${uniqueKey}`, name: `${uniqueKey}`, x: interpoPos.x, y: interpoPos.y, height: interpoArea.height, width: interpoArea.width, time: played, status,
						}));
						break;
					}
				}
			}

			console.log("name in hidding func", name)
			console.log("hidding ", entities.annotations[name]);
			if (status === HIDE) entities.annotations[name].clearRedundantIncidents(status);
			return { entities: { ...entities, annotations: entities.annotations } };
		});
	}


	handleListAnnotationSplit = (name) => {
		const timeNow = (new Date()).getTime().toString(36);
		const timeNowChild1 = ((new Date()).getTime() + 1).toString(36);
		const timeNowChild2 = ((new Date()).getTime() + 2).toString(36);
		const status = SPLIT;
		this.setState((prevState) => {
			this.UndoRedoState.save(prevState);
			const { played, entities, annotations } = prevState;
			const parent = entities.annotations[name];
			// remove ex-childrenNames
			if (parent.childrenNames.length !== 0) {
				for (const c of parent.childrenNames) {
					delete entities.annotations[c];
					const i = annotations.indexOf(c);
					annotations.splice(i, 1);
				}
			}
			// make sure parent's color is different from its children
			let randomColor = colors[getRandomInt(colors.length)];
			while (parent.color === randomColor) randomColor = colors[getRandomInt(colors.length)];
			const childrenColor = randomColor;

			let parentX; let parentY; let parentWidth; let
				parentHeight;
			let { incidents } = parent;
			for (let i = 0; i < incidents.length; i++) {
				if (played >= incidents[i].time) {
					if (i !== incidents.length - 1 && played >= incidents[i + 1].time) continue;
					parentX = incidents[i].x;
					parentY = incidents[i].y;
					parentWidth = incidents[i].width;
					parentHeight = incidents[i].height;
					if (played === incidents[i].time) {
						incidents.splice(i, 1, Incident({
							...incidents[i], id: `${timeNow}`, name: `${timeNow}`, status,
						}));
						incidents = incidents.slice(0, i + 1);
						break;
					}
					if (i === incidents.length - 1) {
						incidents.push(Incident({
							id: `${timeNow}`, name: `${timeNow}`, x: incidents[i].x, y: incidents[i].y, height: incidents[i].height, width: incidents[i].width, time: played, status,
						}));
						break;
					}
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
					parentX = interpoPos.x;
					parentY = interpoPos.y;
					parentWidth = interpoArea.width;
					parentHeight = interpoArea.height;
					incidents.splice(i + 1, 0, Incident({
						id: `${timeNow}`, name: `${timeNow}`, x: interpoPos.x, y: interpoPos.y, height: interpoArea.height, width: interpoArea.width, time: played, status,
					}));
					incidents = incidents.slice(0, i + 2);
					break;
				}
			}
			parent.childrenNames = [`${timeNowChild1}`, `${timeNowChild2}`];
			parent.incidents = incidents;
			const childIncidents1 = [Incident({
				id: `${timeNow}`, name: `${timeNow}`, x: parentX, y: parentY, height: parentHeight / 2, width: parentWidth / 2, time: played,
			})];
			const childIncidents2 = [Incident({
				id: `${timeNow}`, name: `${timeNow}`, x: parentX + parentWidth / 2 - 20, y: parentY + parentHeight / 2 - 20, height: parentHeight / 2, width: parentWidth / 2, time: played,
			})];
			entities.annotations[`${timeNowChild1}`] = Rectangle({
				id: `${timeNowChild1}`, name: `${timeNowChild1}`, label: `${parent.label}-1`, color: childrenColor, incidents: childIncidents1, parentName: parent.name,
			});
			entities.annotations[`${timeNowChild2}`] = Rectangle({
				id: `${timeNowChild2}`, name: `${timeNowChild2}`, label: `${parent.label}-2`, color: childrenColor, incidents: childIncidents2, parentName: parent.name,
			});
			const parentIndex = annotations.find(a => a === parent.name);
			annotations.splice(parentIndex, 0, `${timeNowChild1}`);
			annotations.splice(parentIndex, 0, `${timeNowChild2}`);
			return { annotations, entities, focusing: `${timeNowChild2}` };
		});
	}

	/* ==================== undo/redo ==================== */
	handleUndo = () => {
		if (this.UndoRedoState.previous.length === 0) return;
		this.setState((prevState) => {
			const state = this.UndoRedoState.undo(prevState);
			return { ...state };
		});
	}

	handleRedo = () => {
		if (this.UndoRedoState.next.length === 0) return;
		this.setState((prevState) => {
			const state = this.UndoRedoState.redo(prevState);
			return { ...state };
		});
	}

	/* ==================== review ==================== */
	handleReviewCancelSubmission = () => this.setState({ isLoop: false, isSubmitted: false, isPlaying: false });

	/* ==================== others ==================== */
	isEmptyAnnotationOrIncident = () => {
		const { annotations, defaultNumAnnotations, entities } = this.state;
		const { isEmptyCheckEnable } = this.props;
		if (!isEmptyCheckEnable) return false;
		if (annotations.length !== 0 && defaultNumAnnotations < annotations.length) {
			for (const ann of annotations) {
				if (entities.annotations[ann].incidents.length < 2) return true;
			}
			return false;
		}
		return true;
	}

	handleCloseDraw = (e) => {
		this.setState(prevState => {
			const { focusing, annotations, entities } = prevState;
			entities.annotations[focusing].isClosed = true;
			return {
				isAdding: false,
				entities: { ...entities, annotations: entities.annotations }
			}
		})
	}

    handleDialogToggle = () => this.setState(prevState => ({ isDialogOpen: !prevState.isDialogOpen }));

	handleAddClick = () => this.setState(prevState => ({ isAdding: !prevState.isAdding, isPlaying: false }));

	renderAddButtonUI = () => {
		const {
			isAdding,
			defaultNumRootAnnotations,
			annotations,
			entities,
		} = this.state;
		const { numAnnotationsCanBeAdded } = this.props;
		const isAddButtonAvailable = (defaultNumRootAnnotations + numAnnotationsCanBeAdded) > getLastAnnotationLabel(annotations, entities);
		if (isAdding || (!isAdding && isAddButtonAvailable)) {
			return (
				<div>
					<Button
						disabled={ isAdding }
						color='primary'
						onClick={ this.handleAddClick }
						className='w-100 d-flex justify-content-center align-items-center float-left'
					>
						<MdAdd />
						{isAdding ? 'Adding' : 'Add'}
					</Button>
					{
						(isAdding && this.state.shape == "chain") && <Button
							color='secondary'
							onClick={e => this.handleCloseDraw(e)}
							className='w-100 d-flex justify-content-center align-items-center float-left mt-2'
						>
							Done
						</Button>
					}
				</div>
				
			);
		}
		return null;
	}

	handleChangeColorPicker = (color) => {
		const { focusing } = this.state;
		this.setState((prevState) => {
			const { entities } = prevState;
			const cur_entity = entities.annotations[focusing];
			cur_entity.color = getRgbColor(color.rgb);
			return {};
		});
	}

	showNotification = ({title, message, type}) => {
		this.setState(prevState => {
			return {
				notification: {
					title,
					message,
					type,
					open: true
				},				
				apicallStatus: "saved"
			}
		});
		setTimeout(() => {
			this.setState(prevState => {
				return {
					notification: {
						title: null,
						message: null,
						type: null,
						open: false
					}
				}
			});
		}, 3000);
	}

	handleSaveData = async () => {		
		this.setState(prevState => {
			return {
				apicallStatus: "calling",
				focusing: ''
			}
		});
		const { annotations, entities } = this.state;
		let data = {
			annotations,
			entities
		};
		console.log(entities);
		data = JSON.stringify(data);
		
		try {
			const res = await updateAnnotationData(this.props.serverURL, {
				"video_id": 111,
				"user_id": 1,
				"data": data,
				"video_uui": "73xK6JaeqV9MrGR2BlVO"
			});
			if (res) {
				console.log("updated data");
				this.initialState();
				this.showNotification({
					title: "Good job, ",
					message: "Saved data successfully.",
					type: "info",
				});
			}
		} catch (error) {
			
		}
	}

	handleShape(shape_value) {
		this.setState(prevState => {
			return {
				shape: shape_value
			}
		});
	}

	/* ==================== polygon ==================== */
	handleCanvasVertexMouseDown = (e) => {
		console.log("vertiex circle mouse down");
		const activeVertex = e.target;
		const group = activeVertex.getParent();		
		this.setState((prevState) => {
			const { isAdding, focusing, entities } = prevState;
			if (isAdding) {
				const { annotations } = entities;
				if (group.name() === focusing && annotations[focusing].incidents[0].vertices[0].name === activeVertex.name()) {
					annotations[focusing].isClosed = true;
					return { isAdding: false, entities: { ...entities, annotations } };
				}
				return {};
			}
			return { focusing: group.name() };
		});
	}

	handleCanvasFocusing = (e) => {
		const activeShape = e.target;
		this.setState((prevState) => {
			if (prevState.isAdding) return {};
			return { focusing: activeShape.name() };
		});
	}

	handleCanvasVertexDragEnd = (e) => {
		console.log("handleCanvasVertexDragEnd")
		const activeVertex = e.target;
		const group = activeVertex.getParent();
		const stage = e.target.getStage();
		const position = stage.getPointerPosition();



		this.setState((prevState) => {
			const { isAdding, entities, played } = prevState;
			if (isAdding) return {};			
			const { annotations } = entities;
			const { incidents } = annotations[group.name()];
			for ( let i = 0; i < incidents.length; i ++ ) {
				if ( played >= incidents[i].time ) {
					// skip elapsed incidents
					if ( i !== incidents.length - 1 && played >= incidents[i + 1].time ) continue;
					if ( played === incidents[i].time ) {
						incidents[i].x = position.x;
						incidents[i].y = position.y;
						incidents[i].vertices = incidents[i].vertices.map((v) => {
							if (v.name !== activeVertex.name()) return v;
							// prevent x, y exceeding boundary
							let x = activeVertex.x(); let y = activeVertex.y();
							x = x < 0 ? 0 : x; x = x > stage.width() ? stage.width() : x;
							y = y < 0 ? 0 : y; y = y > stage.height() ? stage.height() : y;
							return { ...v, x, y };
						});
						break;
					}
					// var diffX = parseFloat(position.x) - parseFloat(incidents[i].x),
					// 	diffY = parseFloat(position.y) - parseFloat(incidents[i].y);
					incidents.splice(i + 1, 0, Incident({
						x: position.x, y: position.y, time: played, vertices: incidents[i].vertices.map((v) => {
							if (v.name !== activeVertex.name()) return v;
							// prevent x, y exceeding boundary
							let x = activeVertex.x(); let y = activeVertex.y();
							x = x < 0 ? 0 : x; x = x > stage.width() ? stage.width() : x;
							y = y < 0 ? 0 : y; y = y > stage.height() ? stage.height() : y;
							return { ...v, x, y };
						})
					}));
					break;
				}
			}			
			annotations[group.name()].incidents = incidents;
			return { entities: { ...entities, annotations } };
		});
	}

	handleAnnotationChangeLabel = (string) => {
		const { focusing, entities } = this.state;
		this.setState(prevState => {
			const { annotations } = entities;
			annotations[focusing].labelText = string;
			return {
				entities: {
					...entities,
					annotations
				}
			}
		})
	}

	handleCanvasGroupMove = (e) => {
		if (e.target.getClassName() !== 'Group') return;
		const group = e.target;
		const { entities, focusing } = this.state;
		if (focusing) {
			const { shapeType } = entities.annotations[focusing];
			const shapeKey = getShapeTypeKey(shapeType);
			let obj = group.get(shapeKey)[0];
			const position = group.position();
			const uniqueKey = getUniqueKey();
			this.setState((prevState) => {
				this.UndoRedoState.save(prevState);
				const { entities, played } = prevState;
				const { incidents, shapeType } = entities.annotations[group.name()];
				for (let i = 0; i < incidents.length; i += 1) {
					if (played >= incidents[i].time) {
						// skip elapsed incidents
						if (i !== incidents.length - 1 && played >= incidents[i + 1].time) continue;
						if (played === incidents[i].time) {
							// console.log("232323", diffX, position.x, incidents[0].x)
							var diffX = parseFloat(position.x) - parseFloat(incidents[i].x),
							diffY = parseFloat(position.y) - parseFloat(incidents[i].y);
							incidents[i].x = position.x;
							incidents[i].y = position.y;
							incidents[i].vertices = incidents[i].vertices.map(vt => {
								console.log("vt =>", parseFloat(diffX));
								return {
									...vt,
									// x: parseFloat(vt.x) + parseFloat(diffX),
									// y: parseFloat(vt.y) + position.y
								};
							})
							break;
						}
						if (i === incidents.length - 1) {
							var diffX = parseFloat(position.x) - parseFloat(incidents[0].x),
								diffY = parseFloat(position.y) - parseFloat(incidents[0].y);
							incidents.push(Incident({
								x: position.x, y: position.y, time: played, vertices: incidents[0].vertices.map(vt => {
									return {
										...vt,
										x: parseFloat(vt.x) + diffX,
										y: parseFloat(vt.y) + diffY
									}
								})
							}));
							break;
						}
						incidents.splice(i + 1, 0, Incident({
							id: `${uniqueKey}`, name: `${uniqueKey}`, x: position.x, y: position.y, time: played,
						}));
						break;
					}
				}
				return {};
			});
		}
	}


	/** Line  */
	handleLineArrow(e) {
		this.setState(prevState => {
			const { focusing, entities } = prevState;
			const { annotations } = entities;
			const current = annotations[focusing];
			current.arrowHead = !current.arrowHead;
			return {}
		})
	}

	handleLineWave(e) {
		this.setState(prevState => {
			const { focusing, entities } = prevState;
			const { annotations } = entities;
			const current = annotations[focusing];
			current.wave = !current.wave;
			return {}
		})
	}


	handleChangeLineMode(e) {
		const value = e.target.value;
		this.setState(prevState => {
			const { focusing, entities } = prevState;
			const { annotations } = entities;
			const current = annotations[focusing];
			current.lineMode = String(value);
			return {}
		})
	}

	LineProperties() {
		const { focusing, entities } = this.state;
		const LineModes = [
			{
				label: "Normal",
				value: "0"
			},
			{
				label: "Dashed 1",
				value: "1"
			},
			{
				label: "Dashed 2",
				value: "2"
			}
		]
		return (<div className="d-flex">
			<Button 
				className={`ml-2 mr-1`} 
				outline={!entities.annotations[focusing].arrowHead}
				color="dark"
				onClick={e => this.handleLineArrow(e)}
			>
				ArrowHeader
			</Button>
			<Button 
				className={`mr-1`} 
				outline={!entities.annotations[focusing].wave}
				color="dark"
				onClick={e => this.handleLineWave(e)}
			>
				Wave
			</Button>
			<FormGroup>
				<Input type="select" onChange={e => this.handleChangeLineMode(e)} value={entities.annotations[focusing].lineMode}>
					{
						LineModes.map((mode, key) => <option value={mode.value} key={key}>{mode.label}</option>)
					}
				</Input>
			</FormGroup>
		</div>)
	}


	render() {
		const {
			isSubmitted,
			videoWidth,
			annotationHeight,
			isPlaying,
			played,
			playbackRate,
			duration,
			isLoop,
			isAdding,
			focusing,
			entities,
			annotations,
			isDialogOpen,
			dialogTitle,
			dialogMessage,
			shape,
		} = this.state;
		const {
			className,
			url,
			previewNoticeList,
			isEmptyCheckEnable,
			isSplitEnable,
			isShowHideEnable,
			emptyCheckAnnotationItemWarningText,
			emptyAnnotationReminderText,
		} = this.props;
		const twoDimensionalVideoContext = {
			playerRef: this.handlePlayerRef,
			entities,
			annotations,
			duration,
			played,
			focusing,
			width: videoWidth,
			height: annotationHeight,
			isEmptyCheckEnable,
			url,
			isPlaying,
			isLoop,
			playbackRate,
			isAdding,
			isSplitEnable,
			isShowHideEnable,
			emptyCheckAnnotationItemWarningText,
			emptyAnnotationReminderText,
			shape,

			onVideoReady: this.handleVideoReady,
			onVideoProgress: this.handleVideoProgress,
			onVideoDuration: this.handleVideoDuration,
			onVideoEnded: this.handleVideoEnded,
			onVideoSliderMouseUp: this.handleVideoSliderMouseUp,
			onVideoSliderMouseDown: this.handleVideoSliderMouseDown,
			onVideoSliderChange: this.handleVideoSliderChange,
			onVideoRewind: this.handleVideoRewind,
			onVideoPlayPause: this.handleVideoPlayPause,
			onVideoSpeedChange: this.handleVideoSpeedChange,
			onCanvasStageMouseDown: this.handleCanvasStageMouseDown,
			onCanvasGroupMouseDown: this.handleCanvasGroupMouseDown,
			onCanvasGroupDragEnd: this.handleCanvasGroupDragEnd,
			onCanvasDotMouseDown: this.handleCanvasDotMouseDown,
			onCanvasDotDragEnd: this.handleCanvasDotDragEnd,
			onAnnotationItemClick: this.handleAnnotationItemClick,
			onAnnotationDeleteClick: this.handleListAnnotationDelete,
			onAnnotationShowHideClick: this.handleListAnnotationShowHide,
			onAnnotationSplitClick: this.handleListAnnotationSplit,
			onIncidentItemClick: this.handleIncidentItemClick,
			onIncidentItemDeleteClick: this.handleIncidentItemDelete,
			onVideoNextSecFrame: this.handleVideoNextSecFrame,
			onVideoPrevSecFrame: this.handleVideoPrevSecFrame,
			onChangeColorPicker: this.handleChangeColorPicker,
			onCanvasVertexMouseDown: this.handleCanvasVertexMouseDown,
			onCanvasLineMouseDown: this.handleCanvasFocusing,
			onCanvasVertexDragEnd: this.handleCanvasVertexDragEnd,
			onAnnotationChangeLabel: this.handleAnnotationChangeLabel,
			onCanvasGroupMove: this.handleCanvasGroupMove
		};

		let controlPanelUI = null;
		// if (isSubmitted) {
		// 	controlPanelUI = (
		// 		<Review
		// 			height={ annotationHeight }
		// 			onConfirmSubmit={ this.handleSubmit }
		// 			onCancelSubmit={ this.handleReviewCancelSubmission }
		// 		/>
		// 	);
		// } else {
		controlPanelUI = (
			<div className="w-100 mb-auto overflow-auto" style={{
				maxHeight: 'calc(100% - 100px)'
			}}>
				
				<AnnotationList />
			</div>
		);
		// }

		const options = [
			{ value: 'chocolate', label: 'Chocolate' },
			{ value: 'strawberry', label: 'Strawberry' },
			{ value: 'vanilla', label: 'Vanilla' }
		]

		const rootClassName = `two-dimensional-video${className ? ` ${className}` : ''}`;
		return (
			<I18nextProvider i18n={ i18nextInstance }>
				<TwoDimensionalVideoContext.Provider value={ twoDimensionalVideoContext }>
					<div className={ rootClassName }>	
						<Alert
							title={this.state.notification.title} 
							message={this.state.notification.message}
							type={this.state.notification.type}
							open={this.state.notification.open}
						/>

						<div className='d-flex justify-content-around py-5 px-3 two-dimensional-video__main'>		
											
							<div className='mb-3 two-dimensional-video__control-panel px-3 py-3 position-relative'>
								<div className='w-100 pb-3 clearfix'>
									{this.renderAddButtonUI()}
									{/* <ButtonGroup className='float-right'>
										<Button disabled={ this.UndoRedoState.previous.length === 0 } outline onClick={ this.handleUndo }><MdUndo /></Button>
										<Button disabled={ this.UndoRedoState.next.length === 0 } outline onClick={ this.handleRedo }><MdRedo /></Button>
									</ButtonGroup> */}
								</div>
								{ controlPanelUI }
								{ isSubmitted ? '' : (
									<div className="w-100 pt-3 px-3 mb-3 save-wrap">
										<Button 
											className="w-100"
											color="success" 
											onClick={ this.handleSaveData }			
											disabled={this.state.apicallStatus == "calling"}					
										>		
											<Loader color={'#FFF'} loading={this.state.apicallStatus == "calling"} size={5} />									
											{
												this.state.apicallStatus != "calling" && <span>Save</span>
											}
										</Button>
									</div>
								)}
							</div>

							<div className='w-100 ml-3 d-flex flex-wrap'>
								<div className="d-flex py-3 px-5 custom-card w-100" style={{
									maxHeight: 70
								}}>
									<SelectShape 
										className="mr-2"
										value={this.state.shape}
										options={shapeList}
										onClick={(value) => {this.handleShape(value)} }
									/>
									{
										this.state.focusing && <div className="d-flex">
											<ColorPicker
												onChange={ this.handleChangeColorPicker }
												value={ this.state.focusing ? this.state.entities.annotations[this.state.focusing].color.replace(/,1\)/, ',.3)') : '' }					
											/>
											{
												this.state.shape === "line" && this.LineProperties()
											}
										</div>
									}
									
								</div>
								<div className='px-3' style={ { width: '100%' } }>
									<DrawableVideoPlayer />
								</div>
							</div>
						</div>
						<PopupDialog isOpen={ isDialogOpen } title={ dialogTitle } message={ dialogMessage } onToggle={ this.handleDialogToggle } hasCloseButton />
					</div>
				</TwoDimensionalVideoContext.Provider>
			</I18nextProvider>
		);
	}
}

TwoDimensionalVideo.propTypes = {
	className: PropTypes.string,
	defaultAnnotations: PropTypes.arrayOf(PropTypes.object),
	videoWidth: PropTypes.number,
	isDefaultAnnotationsManipulatable: PropTypes.bool,
	previewNoticeList: PropTypes.arrayOf(PropTypes.string),
	isEmptyCheckEnable: PropTypes.bool,
	isSplitEnable: PropTypes.bool,
	isShowHideEnable: PropTypes.bool,
	hasReview: PropTypes.bool,
	url: PropTypes.string,
	numAnnotationsCanBeAdded: PropTypes.number,
	onSubmit: PropTypes.func,
	emptyCheckSubmissionWarningText: PropTypes.string,
	emptyCheckAnnotationItemWarningText: PropTypes.string,
	emptyAnnotationReminderText: PropTypes.string,
};
TwoDimensionalVideo.defaultProps = {
	className: '',
	defaultAnnotations: [],
	videoWidth: 400,
	isDefaultAnnotationsManipulatable: false,
	previewNoticeList: [],
	isEmptyCheckEnable: false,
	isSplitEnable: false,
	isShowHideEnable: false,
	hasReview: false,
	url: '',
	numAnnotationsCanBeAdded: 1000,
	onSubmit: () => {},
	emptyCheckSubmissionWarningText: '',
	emptyCheckAnnotationItemWarningText: '',
	emptyAnnotationReminderText: '',
};
export default TwoDimensionalVideo;

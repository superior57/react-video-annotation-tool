export const shapeTypeList = [
	{
		label: "Circle",
		value: "circle",
		key: "Circle"
	},
	{
		label: "Line",
		value: "line",
		key: "Line"
	},	
    {
		label: "Rect",
		value: "rect",
		key: "Rect"
	},
    {
		label: "Polygon",
		value: "polygon",
		key: "Line"
	},
	{
		label: "Text",
		value: "text",
		key: "Text"
	},
	{
		label: "Chain",
		value: "chain",
		key: "Chain"
	},
]

export const getShapeTypeKey = (shapeType) => {
	return shapeTypeList.find(s => s.value == shapeType).key;
}
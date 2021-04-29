'use strict'

import React from 'react'
import reactCSS from 'reactcss'
import { SketchPicker } from 'react-color'

class ColorPicker extends React.Component {
  handleChange = (color) => {
    this.setState({ color: color.rgb })
    this.props.onChange(color)
  };

  render() {
    return (
      <SketchPicker color={ this.props.value } onChange={ this.handleChange } />
    )
  }
}

export default ColorPicker

export const getRgbColor = (obj_rgba) => {
    return `rgba( ${ obj_rgba.r }, ${ obj_rgba.g }, ${ obj_rgba.b }, ${ obj_rgba.a })`;
}
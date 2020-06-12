import React from 'react'
import { buttonStyle } from './_formStyles'

const Button = (props) => {
  return (
    <button 
      {...props} 
      className={`btn btn-primary generic-button${
          props.className ? ' ' + props.className : ''
        }`
      } 
    />
  )
}

export default Button

require('react-styl')(`
  ${buttonStyle('.generic-button')}
`)
